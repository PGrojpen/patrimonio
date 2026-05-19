from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AssetClass(str, Enum):
    TESOURO_SELIC = "tesouro_selic"
    TESOURO_IPCA = "tesouro_ipca"
    TESOURO_PREFIXADO = "tesouro_prefixado"
    CDB = "cdb"
    LCI_LCA = "lci_lca"
    FII = "fii"
    ACOES = "acoes"
    ETF_INTERNACIONAL = "etf_internacional"
    RENDA_FIXA_INTERNACIONAL = "renda_fixa_internacional"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    asset_class: Mapped[str] = mapped_column(String(50))
    benchmark: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
