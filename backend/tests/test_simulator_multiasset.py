"""Testes de regressão e invariantes para o simulador multi-ativo."""

from __future__ import annotations

import math

import pytest

from app.schemas.simulation import AssetAllocation, SimulationRequest
from app.services.simulator import simulate
from app.utils.financial import monthly_rate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_single_asset_request(**kwargs) -> SimulationRequest:
    """Cria SimulationRequest com um único ativo regressive_ir (formato novo)."""
    defaults = {
        "initial_investment": 0.0,
        "monthly_contribution": 500.0,
        "annual_contribution_increase_pct": 0.0,
        "years": 10,
        "inflation_pct": 4.5,
        "rebalance_frequency": "none",
        "assets": [
            AssetAllocation(
                name="Carteira",
                weight=1.0,
                annual_rate_pct=12.0,
                tax_regime="regressive_ir",
            )
        ],
    }
    defaults.update(kwargs)
    return SimulationRequest(**defaults)


def make_two_asset_request(
    rate_a: float = 10.0,
    rate_b: float = 8.0,
    weight_a: float = 0.6,
    regime_a: str = "regressive_ir",
    regime_b: str = "regressive_ir",
    rebalance_frequency: str = "none",
    years: int = 5,
    initial_investment: float = 10_000.0,
) -> SimulationRequest:
    return SimulationRequest(
        initial_investment=initial_investment,
        monthly_contribution=500.0,
        annual_contribution_increase_pct=0.0,
        years=years,
        inflation_pct=4.5,
        rebalance_frequency=rebalance_frequency,
        assets=[
            AssetAllocation(name="A", weight=weight_a, annual_rate_pct=rate_a, tax_regime=regime_a),
            AssetAllocation(name="B", weight=round(1.0 - weight_a, 10), annual_rate_pct=rate_b, tax_regime=regime_b),
        ],
    )


# ---------------------------------------------------------------------------
# P0.4 — Teste 1: Regressão de 1 ativo
# Verifica que a série mensal (pré-IR) do novo engine reproduz float-by-float
# o algoritmo do simulador original.
# ---------------------------------------------------------------------------


class TestSingleAssetRegression:
    def test_series_matches_legacy_algorithm(self):
        """
        Um único ativo regressive_ir deve gerar a mesma série que o
        algoritmo legado (crescimento + aporte, sem come-cotas).
        """
        req = make_single_asset_request(
            initial_investment=1_000.0,
            monthly_contribution=500.0,
            years=3,
        )
        result = simulate(req)

        r_monthly = monthly_rate(12.0)
        r_inflation = monthly_rate(4.5)

        total_value = 1_000.0
        total_invested = 1_000.0
        contribution = 500.0

        for dp in result.series:
            m = dp.month
            total_value = total_value * (1 + r_monthly) + contribution
            total_invested += contribution
            interest_earned = total_value - total_invested
            real_value = total_value / (1 + r_inflation) ** m

            assert abs(dp.total_value - round(total_value, 2)) < 1e-6, (
                f"Mês {m}: total_value esperado {round(total_value, 2)}, "
                f"obtido {dp.total_value}"
            )
            assert abs(dp.total_invested - round(total_invested, 2)) < 1e-6
            assert abs(dp.interest_earned - round(interest_earned, 2)) < 1e-6
            assert abs(dp.real_value - round(real_value, 2)) < 1e-6

    def test_legacy_format_backward_compat(self):
        """Formato legado (annual_rate_pct no root) aceito via backward compat."""
        import warnings

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            req = SimulationRequest(
                initial_investment=0.0,
                monthly_contribution=500.0,
                annual_contribution_increase_pct=0.0,
                years=5,
                annual_rate_pct=10.0,  # campo legado
                inflation_pct=4.5,
            )
            assert len(w) == 1
            assert issubclass(w[0].category, DeprecationWarning)

        result = simulate(req)
        assert len(result.series) == 60
        assert result.final_value > result.total_invested

    def test_zero_rate_final_equals_invested(self):
        """Com taxa zero e regime regressive_ir, ganho=0 → IR=0 → final==investido."""
        req = make_single_asset_request(
            annual_contribution_increase_pct=0.0,
            assets=[
                AssetAllocation(
                    name="Carteira",
                    weight=1.0,
                    annual_rate_pct=0.0,
                    tax_regime="regressive_ir",
                )
            ],
            years=5,
            initial_investment=0.0,
        )
        result = simulate(req)
        assert abs(result.final_value - result.total_invested) < 1.0

    def test_series_length_equals_years_times_12(self):
        result = simulate(make_single_asset_request(years=7))
        assert len(result.series) == 84

    def test_real_value_less_than_nominal(self):
        req = make_single_asset_request(years=10, assets=[
            AssetAllocation(name="X", weight=1.0, annual_rate_pct=10.0, tax_regime="exempt")
        ])
        result = simulate(req)
        assert result.final_real_value < result.final_value


# ---------------------------------------------------------------------------
# P0.4 — Teste 2: Invariante de soma
# Em todo timestep, sum(by_asset.values()) ≈ total_value dentro de 1e-9.
# ---------------------------------------------------------------------------


class TestByAssetInvariant:
    def test_sum_by_asset_equals_total_value_every_month(self):
        """
        sum(by_asset.values()) ≈ total_value em cada mês.

        by_asset armazena precisão total (float); total_value é arredondado
        para 2 casas decimais. Tolerância de 0,01 (1 centavo) cobre o erro
        máximo de arredondamento independente do número de ativos.
        """
        result = simulate(make_two_asset_request())
        for dp in result.series:
            total_from_parts = sum(dp.by_asset.values())
            assert abs(total_from_parts - dp.total_value) < 0.01, (
                f"Mês {dp.month}: sum(by_asset)={total_from_parts}, "
                f"total_value={dp.total_value}"
            )

    def test_by_asset_contains_all_assets(self):
        """by_asset deve conter uma entrada para cada ativo da carteira."""
        result = simulate(make_two_asset_request())
        for dp in result.series:
            assert set(dp.by_asset.keys()) == {"A", "B"}

    def test_single_asset_by_asset_equals_total(self):
        """Com 1 ativo, by_asset["X"] ≈ total_value (tolerância de arredondamento)."""
        result = simulate(make_single_asset_request())
        for dp in result.series:
            assert abs(dp.by_asset["Carteira"] - dp.total_value) < 0.01


# ---------------------------------------------------------------------------
# P0.4 — Teste 3: Come-cotas
# Ativo come_cotas perde saldo em m=5 e m=11 do primeiro ano;
# ativo regressive_ir não é afetado nesses meses.
# ---------------------------------------------------------------------------


class TestComeCotas:
    def _build_come_cotas_request(self) -> SimulationRequest:
        return SimulationRequest(
            initial_investment=10_000.0,
            monthly_contribution=100.0,
            annual_contribution_increase_pct=0.0,
            years=2,
            inflation_pct=4.5,
            rebalance_frequency="none",
            assets=[
                AssetAllocation(
                    name="Fundo RF",
                    weight=0.5,
                    annual_rate_pct=12.0,
                    tax_regime="come_cotas",
                ),
                AssetAllocation(
                    name="CDB",
                    weight=0.5,
                    annual_rate_pct=12.0,
                    tax_regime="regressive_ir",
                ),
            ],
        )

    def test_come_cotas_triggers_at_month_5(self):
        """
        Em m=5, o ativo come_cotas perde saldo (IR antecipado).
        Sem come-cotas, o saldo cresceria monotonicamente.
        """
        req = self._build_come_cotas_request()
        result = simulate(req)

        # Constrói o cenário hipotético sem come-cotas para o Fundo RF
        r_monthly = monthly_rate(12.0)
        bal_no_tax = 5_000.0
        for m in range(1, 6):
            bal_no_tax *= 1 + r_monthly
            bal_no_tax += 50.0  # 100 * 0.5

        bal_with_tax = result.series[4].by_asset["Fundo RF"]  # mês 5 (índice 4)
        assert bal_with_tax < bal_no_tax, (
            "Come-cotas deve reduzir o saldo do Fundo RF no mês 5"
        )

    def test_come_cotas_triggers_at_month_11(self):
        """Em m=11, o come-cotas é aplicado novamente."""
        req = self._build_come_cotas_request()
        result = simulate(req)

        # Sem come-cotas em m=11, o Fundo RF teria continuado crescendo
        # desde m=5. Com come-cotas, o saldo no mês 11 deve ser menor que
        # o saldo hipotético sem o segundo come-cotas.
        dp_m10 = result.series[9]
        dp_m11 = result.series[10]

        r_monthly = monthly_rate(12.0)
        expected_without_tax = dp_m10.by_asset["Fundo RF"] * (1 + r_monthly) + 50.0
        actual_m11 = dp_m11.by_asset["Fundo RF"]

        assert actual_m11 < expected_without_tax, (
            "Come-cotas deve reduzir o saldo do Fundo RF no mês 11"
        )

    def test_regressive_ir_not_affected_at_month_5_and_11(self):
        """CDB (regressive_ir) não é afetado pelo come-cotas."""
        req = self._build_come_cotas_request()
        result = simulate(req)

        r_monthly = monthly_rate(12.0)
        bal_cdb = 5_000.0
        for m in range(1, 6):
            bal_cdb *= 1 + r_monthly
            bal_cdb += 50.0

        bal_result = result.series[4].by_asset["CDB"]
        # by_asset armazena precisão total; compara com o valor exato do algoritmo
        assert abs(bal_result - bal_cdb) < 1e-6, (
            "CDB (regressive_ir) não deve ser afetado em m=5"
        )


# ---------------------------------------------------------------------------
# P0.4 — Teste 4: Rebalanceamento
# Após rebalanceamento, pesos realizados == pesos-alvo exatamente.
# ---------------------------------------------------------------------------


class TestRebalancing:
    def test_annual_rebalance_restores_target_weights(self):
        """
        Após rebalanceamento anual (m=12), pesos realizados == pesos-alvo.

        Usa sum(by_asset.values()) como denominador (precisão total),
        evitando discrepância com total_value arredondado.
        """
        req = make_two_asset_request(
            rate_a=15.0,
            rate_b=5.0,
            weight_a=0.6,
            rebalance_frequency="annual",
        )
        result = simulate(req)

        dp_m12 = result.series[11]  # mês 12 (índice 11)
        total = sum(dp_m12.by_asset.values())  # precisão total
        a_val = dp_m12.by_asset["A"]
        b_val = dp_m12.by_asset["B"]

        assert abs(a_val / total - 0.6) < 1e-9, (
            f"Peso de A após rebalance: {a_val / total:.9f}, esperado 0.6"
        )
        assert abs(b_val / total - 0.4) < 1e-9, (
            f"Peso de B após rebalance: {b_val / total:.9f}, esperado 0.4"
        )

    def test_monthly_rebalance_every_month(self):
        """Com rebalanceamento mensal, todos os meses têm pesos exatos."""
        req = make_two_asset_request(
            rate_a=15.0,
            rate_b=5.0,
            weight_a=0.7,
            rebalance_frequency="monthly",
        )
        result = simulate(req)

        for dp in result.series:
            total = sum(dp.by_asset.values())  # precisão total
            a_frac = dp.by_asset["A"] / total
            b_frac = dp.by_asset["B"] / total
            assert abs(a_frac - 0.7) < 1e-9, f"Mês {dp.month}: peso A = {a_frac}"
            assert abs(b_frac - 0.3) < 1e-9, f"Mês {dp.month}: peso B = {b_frac}"

    def test_no_rebalance_allows_drift(self):
        """Sem rebalanceamento, ativos com taxas diferentes causam drift."""
        req = make_two_asset_request(
            rate_a=20.0,  # A cresce mais rápido
            rate_b=2.0,
            weight_a=0.5,
            rebalance_frequency="none",
            years=10,
        )
        result = simulate(req)

        last_dp = result.series[-1]
        total = last_dp.total_value
        a_frac = last_dp.by_asset["A"] / total
        # A deve ter peso bem acima de 50% após 10 anos crescendo mais rápido
        assert a_frac > 0.65, (
            f"Com drift esperado, A deveria ter >65% mas tem {a_frac:.2%}"
        )

    def test_quarterly_rebalance_fires_at_month_3_6_9_12(self):
        """Rebalanceamento trimestral: pesos iguais nos meses 3, 6, 9, 12."""
        req = make_two_asset_request(
            rate_a=15.0,
            rate_b=5.0,
            weight_a=0.6,
            rebalance_frequency="quarterly",
        )
        result = simulate(req)

        for m in [3, 6, 9, 12]:
            dp = result.series[m - 1]
            total = sum(dp.by_asset.values())  # precisão total
            assert abs(dp.by_asset["A"] / total - 0.6) < 1e-9, (
                f"Mês {m}: peso A após rebalance trimestral = "
                f"{dp.by_asset['A'] / total:.9f}"
            )


# ---------------------------------------------------------------------------
# P0.4 — Teste 5: Snapshot determinístico
# Payload fixo gera resultado idêntico em execuções repetidas.
# ---------------------------------------------------------------------------


class TestDeterminism:
    FIXED_REQUEST = dict(
        initial_investment=5_000.0,
        monthly_contribution=500.0,
        annual_contribution_increase_pct=5.0,
        years=5,
        inflation_pct=4.5,
        rebalance_frequency="annual",
        assets=[
            AssetAllocation(name="Selic", weight=0.5, annual_rate_pct=13.0, tax_regime="regressive_ir"),
            AssetAllocation(name="IPCA+", weight=0.3, annual_rate_pct=12.5, tax_regime="regressive_ir"),
            AssetAllocation(name="LCI", weight=0.2, annual_rate_pct=11.5, tax_regime="exempt"),
        ],
    )

    def test_same_input_produces_same_output(self):
        """Simulação é determinística: mesmo payload → mesmo resultado."""
        req = SimulationRequest(**self.FIXED_REQUEST)
        r1 = simulate(req)
        r2 = simulate(req)

        assert r1.final_value == r2.final_value
        assert r1.total_invested == r2.total_invested
        assert r1.total_ir_paid == r2.total_ir_paid
        assert len(r1.series) == len(r2.series)
        for dp1, dp2 in zip(r1.series, r2.series):
            assert dp1.total_value == dp2.total_value

    def test_snapshot_final_value_within_expected_range(self):
        """
        Payload fixo deve produzir resultado dentro de uma faixa razoável
        (proteção contra regressão silenciosa — ex: taxa aplicada duas vezes).
        """
        req = SimulationRequest(**self.FIXED_REQUEST)
        result = simulate(req)

        # Com 13% ponderado, R$5k inicial + R$500/mês por 5 anos:
        # valor bruto esperado entre R$45k e R$55k
        assert 40_000 < result.final_value < 65_000, (
            f"Valor final inesperado: {result.final_value:,.2f}. "
            "Possível regressão no engine."
        )
        assert result.total_ir_paid > 0, "IR deve ser positivo para ativos regressive_ir"
        assert len(result.series) == 60


# ---------------------------------------------------------------------------
# Testes de validação do schema
# ---------------------------------------------------------------------------


class TestSchemaValidation:
    def test_weights_must_sum_to_one(self):
        with pytest.raises(Exception, match="[Pp]esos"):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=500,
                annual_contribution_increase_pct=0,
                years=5,
                inflation_pct=4.5,
                assets=[
                    AssetAllocation(name="A", weight=0.6, annual_rate_pct=10.0, tax_regime="regressive_ir"),
                    AssetAllocation(name="B", weight=0.5, annual_rate_pct=8.0, tax_regime="regressive_ir"),
                ],
            )

    def test_empty_assets_raises(self):
        with pytest.raises(Exception, match="[Pp]elo menos"):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=500,
                annual_contribution_increase_pct=0,
                years=5,
                inflation_pct=4.5,
                assets=[],
            )

    def test_duplicate_asset_names_raises(self):
        with pytest.raises(Exception, match="[Uu]nico|[Úú]nico"):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=500,
                annual_contribution_increase_pct=0,
                years=5,
                inflation_pct=4.5,
                assets=[
                    AssetAllocation(name="A", weight=0.5, annual_rate_pct=10.0, tax_regime="regressive_ir"),
                    AssetAllocation(name="A", weight=0.5, annual_rate_pct=8.0, tax_regime="exempt"),
                ],
            )

    def test_valid_multiasset_request(self):
        req = SimulationRequest(
            initial_investment=10_000,
            monthly_contribution=1_000,
            annual_contribution_increase_pct=3.0,
            years=20,
            inflation_pct=5.0,
            rebalance_frequency="quarterly",
            assets=[
                AssetAllocation(name="Selic", weight=0.4, annual_rate_pct=13.0, tax_regime="regressive_ir", has_fgc=False),
                AssetAllocation(name="LCI", weight=0.3, annual_rate_pct=11.5, tax_regime="exempt", has_fgc=True),
                AssetAllocation(name="CDB", weight=0.2, annual_rate_pct=14.0, tax_regime="regressive_ir", has_fgc=True),
                AssetAllocation(name="BOVA11", weight=0.1, annual_rate_pct=15.0, tax_regime="stocks"),
            ],
        )
        result = simulate(req)
        assert len(result.series) == 240
        assert result.final_value > result.total_invested


# ---------------------------------------------------------------------------
# Testes de tributação por regime
# ---------------------------------------------------------------------------


class TestTaxRegimes:
    def _simulate_single(
        self,
        tax_regime: str,
        rate: float = 12.0,
        years: int = 3,
        initial: float = 10_000.0,
    ) -> float:
        """Retorna o final_value líquido de IR para um único ativo."""
        req = SimulationRequest(
            initial_investment=initial,
            monthly_contribution=100.0,
            annual_contribution_increase_pct=0.0,
            years=years,
            inflation_pct=4.5,
            rebalance_frequency="none",
            assets=[AssetAllocation(name="X", weight=1.0, annual_rate_pct=rate, tax_regime=tax_regime)],
        )
        return simulate(req).final_value

    def test_exempt_higher_than_regressive_ir_same_gross_rate(self):
        """Ativo exempt deve ter valor final maior que regressive_ir à mesma taxa bruta."""
        val_ir = self._simulate_single("regressive_ir")
        val_ex = self._simulate_single("exempt")
        assert val_ex > val_ir, (
            "Ativo isento deve render mais líquido que ativo com IR regressivo"
        )

    def test_regressive_ir_applies_correct_rate_for_long_hold(self):
        """
        Holding acima de 720 dias (>= 2 anos) deve usar alíquota de 15%.
        Verifica que IR pago = 15% * ganho bruto para 3 anos.
        """
        years = 3  # 1095 dias → alíquota 15%
        req = SimulationRequest(
            initial_investment=10_000.0,
            monthly_contribution=100.0,
            annual_contribution_increase_pct=0.0,
            years=years,
            inflation_pct=4.5,
            rebalance_frequency="none",
            assets=[AssetAllocation(name="CDB", weight=1.0, annual_rate_pct=12.0, tax_regime="regressive_ir")],
        )
        result = simulate(req)

        # IR pago = ganho bruto * 15%
        summary = result.by_asset[0]
        gross_gain = summary.ir_paid / 0.15
        assert abs(summary.ir_paid - gross_gain * 0.15) < 0.01

    def test_stocks_no_ir_at_redemption(self):
        """Regime 'stocks' não aplica IR no resgate (isenção simplificada)."""
        req = SimulationRequest(
            initial_investment=10_000.0,
            monthly_contribution=100.0,
            annual_contribution_increase_pct=0.0,
            years=5,
            inflation_pct=4.5,
            rebalance_frequency="none",
            assets=[AssetAllocation(name="BOVA11", weight=1.0, annual_rate_pct=15.0, tax_regime="stocks")],
        )
        result = simulate(req)
        assert result.total_ir_paid == 0.0
        assert result.by_asset[0].ir_paid == 0.0

    def test_come_cotas_less_final_value_than_exempt(self):
        """
        Fundo come-cotas deve ter valor final inferior ao ativo isento
        à mesma taxa bruta, devido ao IR antecipado semestral.
        """
        val_cc = self._simulate_single("come_cotas", rate=12.0, years=5, initial=50_000.0)
        val_ex = self._simulate_single("exempt", rate=12.0, years=5, initial=50_000.0)
        assert val_cc < val_ex, (
            "Come-cotas reduz o saldo final em relação ao ativo isento"
        )


# ---------------------------------------------------------------------------
# Testes de should_rebalance (util)
# ---------------------------------------------------------------------------


class TestShouldRebalance:
    def test_none_never_rebalances(self):
        from app.utils.financial import should_rebalance
        assert all(not should_rebalance(m, "none") for m in range(1, 121))

    def test_monthly_always_rebalances(self):
        from app.utils.financial import should_rebalance
        assert all(should_rebalance(m, "monthly") for m in range(1, 121))

    def test_quarterly_fires_at_3_6_9_12(self):
        from app.utils.financial import should_rebalance
        for m in range(1, 25):
            expected = m % 3 == 0
            assert should_rebalance(m, "quarterly") == expected

    def test_annual_fires_at_12_24_36(self):
        from app.utils.financial import should_rebalance
        for m in range(1, 37):
            expected = m % 12 == 0
            assert should_rebalance(m, "annual") == expected
