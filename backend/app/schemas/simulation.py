from pydantic import BaseModel, Field, field_validator, model_validator


class ContributionSchedule(BaseModel):
    monthly_amount: float = Field(..., gt=0, description="Aporte mensal em R$")
    annual_increase_pct: float = Field(
        0.0, ge=0, le=100, description="Aumento anual do aporte (%)"
    )


class SimulationRequest(BaseModel):
    initial_investment: float = Field(0.0, ge=0, description="Aporte inicial em R$")
    monthly_contribution: float = Field(..., ge=0, description="Aporte mensal em R$")
    annual_contribution_increase_pct: float = Field(
        0.0, ge=0, le=100, description="Crescimento anual dos aportes (%)"
    )
    years: int = Field(..., ge=1, le=50, description="Prazo em anos")
    annual_rate_pct: float = Field(..., ge=0, le=100, description="Taxa de juros anual esperada (%)")
    inflation_pct: float = Field(4.5, ge=0, le=50, description="IPCA anual projetado (%)")

    @field_validator("annual_rate_pct")
    @classmethod
    def rate_must_be_realistic(cls, v: float) -> float:
        if v > 50:
            raise ValueError("Taxa de juros anual acima de 50% parece irreal")
        return v


class MonthlyDataPoint(BaseModel):
    month: int
    date: str
    total_invested: float
    interest_earned: float
    total_value: float
    real_value: float  # deflated by IPCA


class SimulationResult(BaseModel):
    total_invested: float
    total_interest: float
    final_value: float
    final_real_value: float
    annualized_return_pct: float
    real_annualized_return_pct: float
    series: list[MonthlyDataPoint]
