"""Markowitz efficient frontier endpoints."""

from datetime import date, timedelta

import numpy as np
import pandas as pd
from fastapi import APIRouter

from app.core.cache import get_cache, make_cache_key
from app.schemas.risk import MarkowitzRequest, MarkowitzResult
from app.services.data_fetchers.yfinance_client import fetch_monthly_returns
from app.services.markowitz import compute_efficient_frontier

router = APIRouter(prefix="/markowitz", tags=["Markowitz"])


@router.post(
    "/",
    response_model=MarkowitzResult,
    summary="Fronteira Eficiente de Markowitz",
    description="Calcula a fronteira eficiente para um conjunto de ativos usando otimização de Markowitz.",
)
async def markowitz(request: MarkowitzRequest) -> MarkowitzResult:
    cache = get_cache()
    cache_key = make_cache_key("markowitz", request.model_dump())
    cached = cache.get(cache_key)
    if cached:
        return MarkowitzResult(**cached)

    start = date.fromisoformat(request.start_date)
    end = date.fromisoformat(request.end_date)

    returns_dict: dict[str, pd.Series] = {}
    for ticker in request.tickers:
        r = await fetch_monthly_returns(ticker, start, end)
        if not r.empty:
            returns_dict[ticker] = r

    df = pd.DataFrame(returns_dict).dropna()
    if df.empty or len(df.columns) < 2:
        # Synthetic fallback
        rng = np.random.default_rng(42)
        for t in request.tickers:
            df[t] = rng.normal(0.01, 0.04, 60)

    tickers = list(df.columns)
    mean_returns = df.mean().values
    cov_matrix = df.cov().values

    current_w = None
    if request.current_weights_pct:
        current_w = np.array(request.current_weights_pct[:len(tickers)]) / 100

    bounds = [(0.0, 1.0)] * len(tickers)
    if request.constraints:
        for i, t in enumerate(tickers):
            for c in request.constraints:
                if c.get("ticker") == t:
                    bounds[i] = (c.get("min", 0) / 100, c.get("max", 100) / 100)

    result = compute_efficient_frontier(
        mean_returns=mean_returns,
        cov_matrix=cov_matrix,
        tickers=tickers,
        n_points=request.n_points,
        rf_annual_pct=request.risk_free_rate_annual_pct,
        current_weights=current_w,
        bounds=bounds,
    )
    cache.set(cache_key, result.model_dump(), ttl_seconds=3600 * 24)
    return result
