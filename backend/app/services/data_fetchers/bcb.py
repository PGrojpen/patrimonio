"""Banco Central do Brasil (BCB) SGS API data fetcher."""

from datetime import date, timedelta

import httpx
import pandas as pd
import structlog

from app.core.cache import FileCache, get_cache, make_cache_key
from app.core.config import get_settings
from app.core.exceptions import DataFetchError

logger = structlog.get_logger()
settings = get_settings()

# BCB SGS series codes
SERIES = {
    "selic": 432,       # Selic meta (% a.a.)
    "cdi_daily": 12,    # CDI diário (% a.d.)
    "ipca": 433,        # IPCA mensal (%)
    "igpm": 189,        # IGP-M mensal (%)
    "ptax": 1,          # Dólar PTAX (R$/USD)
}

# Fallback mock data (monthly returns, recent approximate values)
_MOCK_DATA: dict[str, list[dict[str, str]]] = {
    "ipca": [
        {"data": "01/2024", "valor": "0.42"},
        {"data": "02/2024", "valor": "0.83"},
        {"data": "03/2024", "valor": "0.16"},
        {"data": "04/2024", "valor": "0.38"},
        {"data": "05/2024", "valor": "0.46"},
        {"data": "06/2024", "valor": "0.20"},
        {"data": "07/2024", "valor": "0.38"},
        {"data": "08/2024", "valor": "0.44"},
        {"data": "09/2024", "valor": "0.44"},
        {"data": "10/2024", "valor": "0.56"},
        {"data": "11/2024", "valor": "0.39"},
        {"data": "12/2024", "valor": "0.52"},
    ],
    "selic": [{"data": "01/2025", "valor": "13.25"}],
    "cdi_daily": [{"data": "01/2025", "valor": "0.0502"}],
}


async def fetch_series(
    series_name: str,
    start_date: date | None = None,
    end_date: date | None = None,
    cache: FileCache | None = None,
) -> pd.DataFrame:
    """
    Fetch a BCB SGS time series.

    Returns a DataFrame with columns ['date', 'value'].
    Falls back to mock data if the API is unavailable.
    """
    if series_name not in SERIES:
        raise DataFetchError("BCB", f"Série desconhecida: {series_name}")

    code = SERIES[series_name]
    if start_date is None:
        start_date = date.today() - timedelta(days=365 * 10)
    if end_date is None:
        end_date = date.today()

    cache = cache or get_cache()
    cache_key = make_cache_key("bcb", series_name, str(start_date), str(end_date))

    cached = cache.get(cache_key)
    if cached is not None:
        return pd.DataFrame(cached)

    url = (
        f"{settings.bcb_base_url}.{code}/dados"
        f"?formato=json"
        f"&dataInicial={start_date.strftime('%d/%m/%Y')}"
        f"&dataFinal={end_date.strftime('%d/%m/%Y')}"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            raw = response.json()

        df = _parse_bcb_response(raw)
        cache.set(cache_key, df.to_dict("records"), ttl_seconds=3600 * settings.market_data_ttl_hours)
        logger.info("bcb_fetch_success", series=series_name, rows=len(df))
        return df

    except Exception as exc:
        logger.warning("bcb_fetch_failed", series=series_name, error=str(exc))
        return _fallback_data(series_name)


def _parse_bcb_response(raw: list[dict[str, str]]) -> pd.DataFrame:
    """Parse BCB JSON response into a clean DataFrame."""
    records = []
    for item in raw:
        try:
            date_str = item.get("data", "")
            value_str = item.get("valor", "0").replace(",", ".")
            # BCB uses DD/MM/YYYY or MM/YYYY
            if len(date_str) == 10:
                parsed_date = pd.to_datetime(date_str, format="%d/%m/%Y")
            else:
                parsed_date = pd.to_datetime(date_str, format="%m/%Y")
            records.append({"date": parsed_date.date(), "value": float(value_str)})
        except (ValueError, KeyError):
            continue
    return pd.DataFrame(records) if records else pd.DataFrame(columns=["date", "value"])


def _fallback_data(series_name: str) -> pd.DataFrame:
    """Return mock data for the given series when API is unavailable."""
    mock = _MOCK_DATA.get(series_name, [])
    return _parse_bcb_response(mock)


async def get_ipca_monthly(
    start_date: date | None = None,
    end_date: date | None = None,
) -> pd.DataFrame:
    """Return monthly IPCA series as a DataFrame with ['date', 'value'] columns."""
    return await fetch_series("ipca", start_date, end_date)


async def get_selic_current() -> float:
    """Return current Selic rate (% a.a.)."""
    df = await fetch_series("selic")
    if df.empty:
        return 13.25  # fallback
    return float(df["value"].iloc[-1])


async def get_cdi_annual_pct() -> float:
    """Return CDI annual rate (% a.a.) approximated from daily rate."""
    df = await fetch_series("cdi_daily")
    if df.empty:
        return 13.15
    daily_rate = float(df["value"].iloc[-1]) / 100
    annual = ((1 + daily_rate) ** 252 - 1) * 100
    return round(annual, 2)
