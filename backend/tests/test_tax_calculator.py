"""Tests for Brazilian tax calculation rules."""

import pytest

from app.services.tax_calculator import (
    TaxRegime,
    calculate_acoes_tax,
    calculate_fii_tax,
    calculate_renda_fixa_tax,
    iof_rate,
    ir_rate_renda_fixa,
    net_return_after_tax,
)


class TestIRRates:
    def test_under_180_days_is_225_pct(self):
        assert ir_rate_renda_fixa(30) == 0.225
        assert ir_rate_renda_fixa(180) == 0.225

    def test_181_to_360_days_is_20_pct(self):
        assert ir_rate_renda_fixa(181) == 0.20
        assert ir_rate_renda_fixa(360) == 0.20

    def test_361_to_720_days_is_175_pct(self):
        assert ir_rate_renda_fixa(361) == 0.175
        assert ir_rate_renda_fixa(720) == 0.175

    def test_above_720_days_is_15_pct(self):
        assert ir_rate_renda_fixa(721) == 0.15
        assert ir_rate_renda_fixa(3650) == 0.15


class TestIOFRates:
    def test_day_1_is_96_pct(self):
        assert iof_rate(1) == 0.96

    def test_day_30_onwards_is_zero(self):
        assert iof_rate(30) == 0.0
        assert iof_rate(365) == 0.0

    def test_day_15_is_decreasing(self):
        assert iof_rate(10) > iof_rate(20)


class TestRendaFixaTax:
    def test_no_gain_means_no_tax(self):
        result = calculate_renda_fixa_tax(10_000, 10_000, 365)
        assert result.gross_gain == 0
        assert result.ir_amount == 0

    def test_long_term_15pct_ir(self):
        result = calculate_renda_fixa_tax(10_000, 12_000, 730)
        assert result.ir_amount == pytest.approx(2_000 * 0.15, abs=0.01)

    def test_short_term_225pct_ir_plus_iof(self):
        result = calculate_renda_fixa_tax(10_000, 11_000, 10)
        assert result.iof_amount > 0  # IOF applies
        assert result.ir_amount > 0

    def test_net_gain_less_than_gross(self):
        result = calculate_renda_fixa_tax(10_000, 13_000, 200)
        assert result.net_gain < result.gross_gain

    def test_effective_rate_between_0_and_1(self):
        result = calculate_renda_fixa_tax(10_000, 12_000, 400)
        assert 0 < result.effective_rate < 1


class TestAcoesTax:
    def test_under_20k_monthly_sales_exempt(self):
        result = calculate_acoes_tax(5_000, monthly_sales_volume=15_000)
        assert result.ir_amount == 0

    def test_over_20k_monthly_sales_15pct(self):
        result = calculate_acoes_tax(5_000, monthly_sales_volume=25_000)
        assert result.ir_amount == pytest.approx(5_000 * 0.15, abs=0.01)

    def test_day_trade_20pct_no_exemption(self):
        result = calculate_acoes_tax(5_000, monthly_sales_volume=15_000, is_day_trade=True)
        assert result.ir_amount == pytest.approx(5_000 * 0.20, abs=0.01)

    def test_no_gain_no_tax(self):
        result = calculate_acoes_tax(0, monthly_sales_volume=50_000)
        assert result.ir_amount == 0


class TestFIITax:
    def test_dividends_are_tax_free(self):
        result = calculate_fii_tax(capital_gain=0, dividend_income=1_000)
        assert result.ir_amount == 0
        assert result.net_gain == 1_000

    def test_capital_gain_taxed_at_20pct(self):
        result = calculate_fii_tax(capital_gain=5_000, dividend_income=0)
        assert result.ir_amount == pytest.approx(1_000, abs=0.01)

    def test_mixed_gain_and_dividend(self):
        result = calculate_fii_tax(capital_gain=2_000, dividend_income=500)
        assert result.ir_amount == pytest.approx(400, abs=0.01)
        assert result.net_gain == pytest.approx(2_100, abs=0.01)


class TestNetReturn:
    def test_lci_lca_no_tax_drag(self):
        gross = 12.0
        net = net_return_after_tax(gross, TaxRegime.LCI_LCA)
        assert net == gross

    def test_renda_fixa_has_tax_drag(self):
        gross = 13.0
        net = net_return_after_tax(gross, TaxRegime.TABELA_REGRESSIVA, holding_years=3)
        assert net < gross

    def test_fii_dividend_no_tax_drag(self):
        gross = 10.0
        net = net_return_after_tax(gross, TaxRegime.FII_DIVIDENDO)
        assert net == gross
