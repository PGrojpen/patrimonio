from pydantic import BaseModel, Field, model_validator


class AssetAllocation(BaseModel):
    ticker: str = Field(..., description="Ticker do ativo (ex: BOVA11.SA, CDI)")
    name: str = Field(..., description="Nome do ativo")
    asset_class: str = Field(..., description="Classe do ativo")
    weight_pct: float = Field(..., ge=0, le=100, description="Peso na carteira (%)")
    expected_annual_return_pct: float | None = Field(
        None, description="Retorno anual esperado (% override manual)"
    )
    expected_volatility_pct: float | None = Field(
        None, description="Volatilidade anual esperada (% override manual)"
    )


class PortfolioAllocationRequest(BaseModel):
    allocations: list[AssetAllocation] = Field(..., min_length=1)
    total_investment: float = Field(..., gt=0)
    monthly_contribution: float = Field(0.0, ge=0)

    @model_validator(mode="after")
    def weights_must_sum_to_100(self) -> "PortfolioAllocationRequest":
        total = sum(a.weight_pct for a in self.allocations)
        if abs(total - 100.0) > 0.01:
            raise ValueError(f"Pesos somam {total:.2f}%, devem somar 100%")
        return self


class AllocationConstraint(BaseModel):
    ticker: str
    min_weight_pct: float = Field(0.0, ge=0, le=100)
    max_weight_pct: float = Field(100.0, ge=0, le=100)

    @model_validator(mode="after")
    def min_le_max(self) -> "AllocationConstraint":
        if self.min_weight_pct > self.max_weight_pct:
            raise ValueError("min_weight_pct deve ser <= max_weight_pct")
        return self
