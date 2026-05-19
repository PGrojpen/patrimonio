"""Monte Carlo simulation endpoints."""

from fastapi import APIRouter

from app.core.cache import get_cache, make_cache_key
from app.schemas.risk import MonteCarloRequest, MonteCarloResult
from app.services.monte_carlo import run_monte_carlo

router = APIRouter(prefix="/monte-carlo", tags=["Monte Carlo"])


@router.post(
    "/",
    response_model=MonteCarloResult,
    summary="Simulação Monte Carlo",
    description="Projeta trajetórias futuras via Geometric Brownian Motion ou Bootstrap histórico.",
)
async def run_mc(request: MonteCarloRequest) -> MonteCarloResult:
    cache = get_cache()
    key = make_cache_key("mc", request.model_dump())
    cached = cache.get(key)
    if cached:
        return MonteCarloResult(**cached)

    result = run_monte_carlo(request)
    cache.set(key, result.model_dump(), ttl_seconds=3600)
    return result
