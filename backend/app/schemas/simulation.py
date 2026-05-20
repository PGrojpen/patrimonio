from __future__ import annotations

import warnings
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class AssetAllocation(BaseModel):
    """Definição de um ativo na carteira multi-ativo."""

    name: str = Field(..., min_length=1, description="Nome do ativo (ex: 'Tesouro IPCA+ 2032')")
    weight: float = Field(..., ge=0, le=1, description="Peso na carteira (0.0–1.0, deve somar 1.0)")
    annual_rate_pct: float = Field(..., ge=0, le=100, description="Taxa nominal esperada (% a.a.)")
    tax_regime: Literal[
        "regressive_ir",  # Tesouro, CDB, debênture comum
        "exempt",         # LCI, LCA, CRI, CRA, debênture incentivada
        "come_cotas",     # Fundos RF/multimercado — antecipação semestral de IR
        "stocks",         # Ações — isenção R$20k/mês de venda (simplificação)
    ] = Field(..., description="Regime tributário do ativo")
    has_fgc: bool = Field(False, description="Coberto pelo FGC até R$250k por CPF/instituição (informativo)")
    indexador: Literal[
        "pre", "pos_cdi", "pos_selic", "ipca_plus", "hybrid", "equity"
    ] | None = Field(None, description="Indexador base (habilita cenários macro em endpoints futuros)")


class SimulationRequest(BaseModel):
    """Requisição de simulação patrimonial multi-ativo."""

    initial_investment: float = Field(0.0, ge=0, description="Aporte inicial em R$")
    monthly_contribution: float = Field(..., gt=0, description="Aporte mensal em R$")
    annual_contribution_increase_pct: float = Field(
        0.0, ge=0, le=100, description="Crescimento anual dos aportes (%)"
    )
    years: int = Field(..., ge=1, le=50, description="Prazo em anos")
    inflation_pct: float = Field(4.5, ge=0, le=50, description="IPCA anual projetado (%)")
    assets: list[AssetAllocation] = Field(..., description="Ativos e pesos da carteira")
    rebalance_frequency: Literal["none", "monthly", "quarterly", "annual"] = Field(
        "annual", description="Frequência de rebalanceamento periódico"
    )
    apply_costs: bool = Field(
        True,
        description="Aplicar custos operacionais (custódia B3, IOF) — implementação em P1.9",
    )

    @model_validator(mode="before")
    @classmethod
    def handle_legacy_format(cls, values: object) -> object:
        """
        Compatibilidade com formato legado: aceita annual_rate_pct no root.

        Converte para assets=[AssetAllocation(name='Carteira', ...)].
        Deprecado desde v1.1 — será removido na v1.2.
        """
        if not isinstance(values, dict):
            return values
        if "annual_rate_pct" in values and "assets" not in values:
            warnings.warn(
                "annual_rate_pct no root do SimulationRequest está deprecado. "
                "Use assets=[AssetAllocation(...)] no lugar.",
                DeprecationWarning,
                stacklevel=3,
            )
            rate = float(values.pop("annual_rate_pct"))
            values["assets"] = [
                {
                    "name": "Carteira",
                    "weight": 1.0,
                    "annual_rate_pct": rate,
                    "tax_regime": "regressive_ir",
                }
            ]
        return values

    @model_validator(mode="after")
    def validate_assets(self) -> SimulationRequest:
        if not self.assets:
            raise ValueError("Pelo menos um ativo é obrigatório")
        total = sum(a.weight for a in self.assets)
        if not 0.99 <= total <= 1.01:
            raise ValueError(
                f"Pesos somam {total:.4f}, devem somar 1.0 "
                f"(tolerância ±0.01)"
            )
        names = [a.name for a in self.assets]
        if len(names) != len(set(names)):
            raise ValueError("Cada ativo deve ter um nome único na carteira")
        return self


class MonthlyDataPoint(BaseModel):
    """Snapshot mensal da carteira."""

    month: int
    date: str
    total_invested: float
    interest_earned: float
    total_value: float
    real_value: float  # deflated by IPCA
    by_asset: dict[str, float] = Field(
        default_factory=dict,
        description="Valor de cada ativo no mês (pré-IR de resgate)",
    )


class AssetSummary(BaseModel):
    """Resumo final de um ativo ao término da simulação."""

    name: str
    final_value: float
    final_value_real: float
    total_contributed: float
    total_interest: float
    ir_paid: float
    weight_target: float
    weight_final: float


class SimulationResult(BaseModel):
    """Resultado completo da simulação patrimonial."""

    total_invested: float
    total_interest: float
    final_value: float
    final_real_value: float
    annualized_return_pct: float
    real_annualized_return_pct: float
    series: list[MonthlyDataPoint]
    by_asset: list[AssetSummary] = Field(default_factory=list)
    total_ir_paid: float = 0.0
