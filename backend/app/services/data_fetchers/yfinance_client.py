"""yfinance wrapper for Brazilian equities, FIIs, and ETFs."""

from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import structlog
import yfinance as yf

from app.core.cache import get_cache, make_cache_key
from app.core.config import get_settings
from app.core.exceptions import DataFetchError

logger = structlog.get_logger()
settings = get_settings()

# Common Brazilian tickers for seeding
DEFAULT_TICKERS = [
    "BOVA11.SA",   # ETF Ibovespa
    "SMAL11.SA",   # ETF Small Caps
    "IVVB11.SA",   # ETF S&P 500 (BRL)
    "NASD11.SA",   # ETF Nasdaq
    "KNRI11.SA",   # FII Kinea Renda Imobiliária
    "MXRF11.SA",   # FII Maxi Renda
    "BTLG11.SA",   # FII BTG Logística
    "PETR4.SA",    # Petrobras
    "VALE3.SA",    # Vale
    "ITUB4.SA",    # Itaú
]

# Mock fallback data: approximate annual returns and volatilities
_MOCK_STATS: dict[str, dict[str, float]] = {
    "BOVA11.SA":  {"annual_return": 0.12, "annual_vol": 0.22},
    "IVVB11.SA":  {"annual_return": 0.18, "annual_vol": 0.18},
    "NASD11.SA":  {"annual_return": 0.22, "annual_vol": 0.25},
    "KNRI11.SA":  {"annual_return": 0.14, "annual_vol": 0.15},
    "MXRF11.SA":  {"annual_return": 0.13, "annual_vol": 0.12},
    "CDI":        {"annual_return": 0.1315, "annual_vol": 0.005},
    "IPCA+5":     {"annual_return": 0.09, "annual_vol": 0.04},
}


def _cache_path(ticker: str) -> Path:
    cache_dir = Path(settings.cache_dir) / "prices"
    cache_dir.mkdir(parents=True, exist_ok=True)
    safe = ticker.replace(".", "_").replace("/", "_")
    return cache_dir / f"{safe}.parquet"


def _load_from_parquet(ticker: str) -> pd.DataFrame | None:
    path = _cache_path(ticker)
    if not path.exists():
        return None
    try:
        df = pd.read_parquet(path)
        return df
    except Exception:
        return None


def _save_to_parquet(ticker: str, df: pd.DataFrame) -> None:
    try:
        _cache_path(ticker).parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(_cache_path(ticker))
    except Exception as e:
        logger.warning("parquet_save_error", ticker=ticker, error=str(e))


async def fetch_prices(
    ticker: str,
    start_date: date | None = None,
    end_date: date | None = None,
    use_cache: bool = True,
) -> pd.DataFrame:
    """
    Fetch historical adjusted close prices for a ticker.

    Returns DataFrame with DatetimeIndex and columns ['close', 'adjusted_close', 'volume', 'dividends'].
    Falls back to cached Parquet or generates synthetic data if unavailable.
    """
    if start_date is None:
        start_date = date.today() - timedelta(days=365 * 10)
    if end_date is None:
        end_date = date.today()

    # Check Parquet cache
    if use_cache:
        cached = _load_from_parquet(ticker)
        if cached is not None and not cached.empty:
            mask = (cached.index >= pd.Timestamp(start_date)) & (
                cached.index <= pd.Timestamp(end_date)
            )
            subset = cached.loc[mask]
            if not subset.empty:
                logger.debug("price_cache_hit", ticker=ticker)
                return subset

    try:
        yf_ticker = yf.Ticker(ticker)
        hist = yf_ticker.history(
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
            auto_adjust=True,
        )
        if hist.empty:
            raise DataFetchError("yfinance", f"Sem dados para {ticker}")

        df = pd.DataFrame({
            "close": hist["Close"],
            "adjusted_close": hist["Close"],  # auto_adjust already adjusts
            "volume": hist.get("Volume", pd.Series(dtype=float)),
            "dividends": hist.get("Dividends", pd.Series(dtype=float, index=hist.index)),
        })
        df.index = pd.to_datetime(df.index).tz_localize(None)

        _save_to_parquet(ticker, df)
        logger.info("price_fetch_success", ticker=ticker, rows=len(df))
        return df

    except Exception as exc:
        logger.warning("yfinance_fetch_failed", ticker=ticker, error=str(exc))
        return _generate_synthetic(ticker, start_date, end_date)


def _generate_synthetic(ticker: str, start_date: date, end_date: date) -> pd.DataFrame:
    """Generate realistic synthetic price series as fallback."""
    stats = _MOCK_STATS.get(ticker, {"annual_return": 0.10, "annual_vol": 0.20})
    mu = stats["annual_return"] / 252
    sigma = stats["annual_vol"] / np.sqrt(252)

    dates = pd.bdate_range(start=start_date, end=end_date)
    rng = np.random.default_rng(hash(ticker) % (2**31))
    shocks = rng.normal(mu - 0.5 * sigma**2, sigma, len(dates))
    prices = 100.0 * np.exp(np.cumsum(shocks))

    return pd.DataFrame({
        "close": prices,
        "adjusted_close": prices,
        "volume": rng.integers(1_000_000, 10_000_000, len(dates)).astype(float),
        "dividends": 0.0,
    }, index=dates)


async def fetch_monthly_returns(
    ticker: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> pd.Series:
    """Return monthly simple returns for a ticker."""
    df = await fetch_prices(ticker, start_date, end_date)
    if df.empty:
        return pd.Series(dtype=float)
    monthly = df["adjusted_close"].resample("ME").last()
    return monthly.pct_change().dropna()


async def get_correlation_matrix(
    tickers: list[str],
    start_date: date | None = None,
    end_date: date | None = None,
) -> pd.DataFrame:
    """Compute pairwise correlation matrix from monthly returns."""
    returns_dict: dict[str, pd.Series] = {}
    for ticker in tickers:
        r = await fetch_monthly_returns(ticker, start_date, end_date)
        if not r.empty:
            returns_dict[ticker] = r
    df = pd.DataFrame(returns_dict).dropna()
    return df.corr()
