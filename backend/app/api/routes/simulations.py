"""Simulation endpoints."""

from fastapi import APIRouter

from app.schemas.simulation import SimulationRequest, SimulationResult
from app.services.simulator import simulate

router = APIRouter(prefix="/simulations", tags=["Simulações"])


@router.post(
    "/",
    response_model=SimulationResult,
    summary="Simular aportes mensais",
    description="Calcula a evolução patrimonial com aportes mensais e juros compostos.",
)
async def run_simulation(request: SimulationRequest) -> SimulationResult:
    return simulate(request)
