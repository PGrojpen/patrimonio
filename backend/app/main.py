"""Patrimônio — Investment Portfolio Simulator API."""

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import assets, backtest, markowitz, market_data, monte_carlo, simulations
from app.core.config import get_settings
from app.core.database import create_tables
from app.core.exceptions import PatrimonioError, patrimonio_exception_handler

logger = structlog.get_logger()
settings = get_settings()

app = FastAPI(
    title="Patrimônio API",
    description=(
        "API para simulação de investimentos de longo prazo no mercado brasileiro. "
        "Inclui simulador de aportes, backtesting, Monte Carlo, e fronteira eficiente de Markowitz.\n\n"
        "⚠️ **Disclaimer**: Este aplicativo tem caráter exclusivamente educacional. "
        "Não constitui recomendação de investimento. Consulte um profissional certificado (CVM)."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(PatrimonioError, patrimonio_exception_handler)  # type: ignore[arg-type]

# Routers
app.include_router(simulations.router, prefix="/api/v1")
app.include_router(monte_carlo.router, prefix="/api/v1")
app.include_router(backtest.router, prefix="/api/v1")
app.include_router(markowitz.router, prefix="/api/v1")
app.include_router(market_data.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")


@app.on_event("startup")
async def startup() -> None:
    await create_tables()
    logger.info("patrimonio_startup", version=settings.app_version, env=settings.environment)


@app.get("/", include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse({"name": "Patrimônio API", "version": settings.app_version, "docs": "/docs"})


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {"status": "healthy", "version": settings.app_version}
