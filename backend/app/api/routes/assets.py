"""Risk metrics endpoint."""

from fastapi import APIRouter

from app.schemas.risk import RiskMetrics, RiskMetricsRequest
from app.services.risk_metrics import compute_risk_metrics

router = APIRouter(prefix="/risk", tags=["Métricas de Risco"])


@router.post(
    "/metrics",
    response_model=RiskMetrics,
    summary="Calcular métricas de risco",
    description="Calcula Sharpe, Sortino, VaR, CVaR, Maximum Drawdown e Beta de uma série de retornos.",
)
async def get_risk_metrics(request: RiskMetricsRequest) -> RiskMetrics:
    return compute_risk_metrics(request)
