"""Backtesting endpoints."""

from fastapi import APIRouter

from app.schemas.backtest import BacktestRequest, BacktestResult
from app.services.backtester import run_backtest

router = APIRouter(prefix="/backtest", tags=["Backtesting"])


@router.post(
    "/",
    response_model=BacktestResult,
    summary="Backtesting histórico",
    description="Simula o desempenho histórico de uma carteira multi-ativo com aportes mensais e rebalanceamento.",
)
async def backtest(request: BacktestRequest) -> BacktestResult:
    return await run_backtest(request)
