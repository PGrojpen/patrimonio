"""Brazilian tax rules for financial investments."""

from dataclasses import dataclass
from enum import Enum


class TaxRegime(str, Enum):
    TABELA_REGRESSIVA = "tabela_regressiva"  # renda fixa
    LCI_LCA = "lci_lca"                      # isento PF
    FII_DIVIDENDO = "fii_dividendo"          # isento PF
    FII_GANHO = "fii_ganho"                  # 20% sobre ganho
    ACOES = "acoes"                           # 15% swing / isenção 20k
    ETF = "etf"                               # 15% sobre ganho


# IR regressivo sobre renda fixa: days held -> rate
_IR_BRACKETS = [
    (180, 0.225),   # até 180 dias: 22.5%
    (360, 0.200),   # 181–360 dias: 20.0%
    (720, 0.175),   # 361–720 dias: 17.5%
    (float("inf"), 0.150),  # acima de 720 dias: 15%
]

# IOF regressivo para resgates < 30 dias (tabela completa)
_IOF_TABLE = [
    96, 93, 90, 86, 83, 80, 76, 73, 70, 66,
    63, 60, 56, 53, 50, 46, 43, 40, 36, 33,
    30, 26, 23, 20, 16, 13, 10, 6, 3, 0,
]  # day index 0 = day 1, day 29 = day 30 (0% IOF)


def ir_rate_renda_fixa(days_held: int) -> float:
    """Return IR rate (0–1) for renda fixa given holding period in days."""
    for threshold, rate in _IR_BRACKETS:
        if days_held <= threshold:
            return rate
    return 0.15


def iof_rate(days_held: int) -> float:
    """Return IOF rate (0–1) for early redemption (<30d). Returns 0 if >= 30 days."""
    if days_held >= 30:
        return 0.0
    idx = min(days_held - 1, 29)
    return _IOF_TABLE[idx] / 100


@dataclass
class TaxResult:
    gross_gain: float
    iof_amount: float
    ir_amount: float
    net_gain: float
    effective_rate: float  # total tax / gross gain


def calculate_renda_fixa_tax(
    invested: float,
    gross_value: float,
    days_held: int,
) -> TaxResult:
    """
    Calculate taxes on renda fixa redemption.
    Applies IOF first (if < 30 days), then IR on remaining gain.
    """
    gross_gain = max(0.0, gross_value - invested)
    if gross_gain == 0:
        return TaxResult(0, 0, 0, 0, 0)

    iof = iof_rate(days_held)
    iof_amount = gross_gain * iof
    gain_after_iof = gross_gain - iof_amount

    ir = ir_rate_renda_fixa(days_held)
    ir_amount = gain_after_iof * ir

    net_gain = gain_after_iof - ir_amount
    total_tax = iof_amount + ir_amount
    effective = total_tax / gross_gain if gross_gain > 0 else 0.0

    return TaxResult(
        gross_gain=gross_gain,
        iof_amount=iof_amount,
        ir_amount=ir_amount,
        net_gain=net_gain,
        effective_rate=effective,
    )


def calculate_acoes_tax(
    gross_gain: float,
    monthly_sales_volume: float,
    is_day_trade: bool = False,
) -> TaxResult:
    """
    Calculate IR on stock gains.
    - Swing trade: 15% on gains, exempt if monthly sales < R$20k
    - Day trade: 20%, no exemption
    """
    if gross_gain <= 0:
        return TaxResult(0, 0, 0, 0, 0)

    if is_day_trade:
        rate = 0.20
        ir_amount = gross_gain * rate
    else:
        if monthly_sales_volume <= 20_000:
            ir_amount = 0.0
            rate = 0.0
        else:
            rate = 0.15
            ir_amount = gross_gain * rate

    net_gain = gross_gain - ir_amount
    effective = ir_amount / gross_gain if gross_gain > 0 else 0.0
    return TaxResult(
        gross_gain=gross_gain,
        iof_amount=0,
        ir_amount=ir_amount,
        net_gain=net_gain,
        effective_rate=effective,
    )


def calculate_fii_tax(
    capital_gain: float,
    dividend_income: float,
) -> TaxResult:
    """
    FII taxation:
    - Dividendos: isentos para PF
    - Ganho de capital na venda: 20%
    """
    ir_amount = max(0.0, capital_gain * 0.20)
    net_gain = capital_gain - ir_amount + dividend_income
    gross = capital_gain + dividend_income
    effective = ir_amount / gross if gross > 0 else 0.0
    return TaxResult(
        gross_gain=gross,
        iof_amount=0,
        ir_amount=ir_amount,
        net_gain=net_gain,
        effective_rate=effective,
    )


def apply_come_cotas(
    fund_value: float,
    gross_gain: float,
    days_held: int,
) -> float:
    """
    Apply come-cotas (semi-annual tax) for investment funds (NOT FIIs).
    Returns the tax amount to be deducted.
    """
    rate = ir_rate_renda_fixa(days_held)
    # Come-cotas uses the short-term rate floor of 15%
    effective_rate = max(rate, 0.15)
    return gross_gain * effective_rate


def net_return_after_tax(
    gross_annual_return_pct: float,
    regime: TaxRegime,
    holding_years: float = 3.0,
) -> float:
    """
    Estimate annualized net return after tax for a given regime.
    Simplified for projection purposes.
    """
    if regime in (TaxRegime.LCI_LCA, TaxRegime.FII_DIVIDENDO):
        return gross_annual_return_pct

    days = int(holding_years * 365)
    rate = ir_rate_renda_fixa(days)

    if regime == TaxRegime.TABELA_REGRESSIVA:
        # Net = (1 + gross)^years deducting tax on gains
        # Simplified: net_return ≈ gross * (1 - rate)
        return gross_annual_return_pct * (1 - rate)

    if regime in (TaxRegime.ACOES, TaxRegime.ETF):
        return gross_annual_return_pct * (1 - 0.15)

    if regime == TaxRegime.FII_GANHO:
        return gross_annual_return_pct * (1 - 0.20)

    return gross_annual_return_pct
