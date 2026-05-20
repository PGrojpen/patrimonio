"""Simulador patrimonial multi-ativo com tributação brasileira."""

from __future__ import annotations

from datetime import date, timedelta

from app.schemas.simulation import (
    AssetSummary,
    MonthlyDataPoint,
    SimulationRequest,
    SimulationResult,
)
from app.utils.financial import monthly_rate, should_rebalance

# Tabela de alíquotas regressivas do IR para renda fixa (Lei 11.033/2004).
# Tupla: (prazo máximo em dias, alíquota).
_IR_REGRESSIVE_TABLE: list[tuple[int, float]] = [
    (180, 0.225),
    (360, 0.200),
    (720, 0.175),
    (10_000, 0.150),  # acima de 720 dias
]


def _ir_regressive_rate(holding_days: int) -> float:
    """
    Alíquota regressiva do IR para renda fixa conforme prazo de aplicação:
        até 180 dias: 22,5%  |  até 360 dias: 20,0%
        até 720 dias: 17,5%  |  acima de 720 dias: 15,0%
    """
    for threshold, rate in _IR_REGRESSIVE_TABLE:
        if holding_days <= threshold:
            return rate
    return 0.15


def simulate(request: SimulationRequest) -> SimulationResult:
    """
    Simula a evolução patrimonial de uma carteira multi-ativo.

    Algoritmo por mês m = 1..N:
      1. Rendimento: balances[ativo] *= (1 + r_mensal(ativo))
      2. Come-cotas em maio (m%12==5) e novembro (m%12==11):
         IR antecipado de 15% sobre o ganho em fundos come-cotas.
         Simplificação: usa alíquota de longo prazo (15%) nos dois eventos.
      3. Aporte: balances[ativo] += aporte_mensal * peso_alvo
      4. Rebalanceamento periódico (redistribui pelo peso-alvo).
         Nota: não modela fato gerador de IR sobre o rebalanceamento (v1).
      5. Aumento anual do aporte ao final de cada ano completo.

    IR de resgate final aplicado por ativo conforme regime:
      regressive_ir — alíquota regressiva sobre o ganho
      exempt        — sem IR
      come_cotas    — IR já recolhido via come-cotas; sem IR adicional
      stocks        — isenção para vendas até R$20k/mês (simplificação)
    """
    months_total = request.years * 12
    r_inflation_monthly = monthly_rate(request.inflation_pct)

    # Saldos e bases de custo por ativo (chave = nome do ativo)
    balances: dict[str, float] = {}
    cost_basis: dict[str, float] = {}       # referência para cálculo de IR
    contributions_per_asset: dict[str, float] = {}

    for a in request.assets:
        initial_alloc = request.initial_investment * a.weight
        balances[a.name] = initial_alloc
        cost_basis[a.name] = initial_alloc
        contributions_per_asset[a.name] = initial_alloc

    current_contribution = request.monthly_contribution
    total_invested = request.initial_investment
    series: list[MonthlyDataPoint] = []
    start_date = date.today().replace(day=1)

    for m in range(1, months_total + 1):
        # 1. Rendimento mensal por ativo
        for a in request.assets:
            balances[a.name] *= 1 + monthly_rate(a.annual_rate_pct)

        # 2. Come-cotas: maio (m%12 == 5) e novembro (m%12 == 11)
        if m % 12 in (5, 11):
            for a in request.assets:
                if a.tax_regime == "come_cotas":
                    gain = balances[a.name] - cost_basis[a.name]
                    if gain > 0:
                        balances[a.name] -= gain * 0.15
                        cost_basis[a.name] = balances[a.name]

        # 3. Aporte distribuído pelos pesos-alvo (não pelos pesos atuais)
        for a in request.assets:
            c = current_contribution * a.weight
            balances[a.name] += c
            cost_basis[a.name] += c
            contributions_per_asset[a.name] += c

        total_invested += current_contribution

        # 4. Rebalanceamento periódico
        if should_rebalance(m, request.rebalance_frequency):
            total_bal = sum(balances.values())
            for a in request.assets:
                balances[a.name] = total_bal * a.weight
            # cost_basis não é ajustado — simplificação sem fato gerador de IR

        # 5. Aumento anual do aporte ao final de cada ano completo
        if m % 12 == 0 and request.annual_contribution_increase_pct > 0:
            current_contribution *= 1 + request.annual_contribution_increase_pct / 100

        total_value = sum(balances.values())
        period_date = start_date + timedelta(days=30 * m)
        series.append(
            MonthlyDataPoint(
                month=m,
                date=period_date.strftime("%Y-%m"),
                total_invested=round(total_invested, 2),
                interest_earned=round(total_value - total_invested, 2),
                total_value=round(total_value, 2),
                real_value=round(total_value / (1 + r_inflation_monthly) ** m, 2),
                by_asset=dict(balances),  # precisão total; total_value = round(sum(by_asset.values()), 2)
            )
        )

    # IR no resgate final, por ativo
    total_ir_paid = 0.0
    ir_paid_per_asset: dict[str, float] = {}
    holding_days = request.years * 365

    for a in request.assets:
        gain = balances[a.name] - cost_basis[a.name]
        ir_paid = 0.0
        if a.tax_regime == "regressive_ir" and gain > 0:
            ir_paid = gain * _ir_regressive_rate(holding_days)
            balances[a.name] -= ir_paid
        # exempt: sem IR
        # come_cotas: IR já recolhido ao longo da simulação via come-cotas
        # stocks: isenção para resgates até R$20k/mês (simplificação documentada)
        total_ir_paid += ir_paid
        ir_paid_per_asset[a.name] = ir_paid

    final_value = sum(balances.values())
    final_real_value = final_value / (1 + r_inflation_monthly) ** months_total

    # Taxa de retorno ponderada pelos pesos-alvo (aproximação para carteira multi-ativo)
    blended_rate = sum(a.annual_rate_pct * a.weight for a in request.assets)
    real_annualized = ((1 + blended_rate / 100) / (1 + request.inflation_pct / 100) - 1) * 100

    asset_summaries: list[AssetSummary] = [
        AssetSummary(
            name=a.name,
            final_value=round(balances[a.name], 2),
            final_value_real=round(
                balances[a.name] / (1 + r_inflation_monthly) ** months_total, 2
            ),
            total_contributed=round(contributions_per_asset[a.name], 2),
            total_interest=round(balances[a.name] - contributions_per_asset[a.name], 2),
            ir_paid=round(ir_paid_per_asset[a.name], 2),
            weight_target=a.weight,
            weight_final=round(balances[a.name] / final_value, 4) if final_value > 0 else 0.0,
        )
        for a in request.assets
    ]

    return SimulationResult(
        total_invested=round(total_invested, 2),
        total_interest=round(final_value - total_invested, 2),
        final_value=round(final_value, 2),
        final_real_value=round(final_real_value, 2),
        annualized_return_pct=round(blended_rate, 2),
        real_annualized_return_pct=round(real_annualized, 2),
        series=series,
        by_asset=asset_summaries,
        total_ir_paid=round(total_ir_paid, 2),
    )
