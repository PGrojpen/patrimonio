"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_root_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200


class TestSimulationEndpoint:
    def _valid_payload(self) -> dict:
        return {
            "initial_investment": 10000,
            "monthly_contribution": 500,
            "annual_contribution_increase_pct": 0,
            "years": 10,
            "annual_rate_pct": 12.0,
            "inflation_pct": 4.5,
        }

    def test_simulation_returns_200(self):
        resp = client.post("/api/v1/simulations/", json=self._valid_payload())
        assert resp.status_code == 200

    def test_simulation_has_required_fields(self):
        resp = client.post("/api/v1/simulations/", json=self._valid_payload())
        data = resp.json()
        assert "final_value" in data
        assert "total_invested" in data
        assert "total_interest" in data
        assert "series" in data
        assert len(data["series"]) == 120  # 10 years

    def test_simulation_invalid_years_returns_422(self):
        payload = self._valid_payload()
        payload["years"] = 0
        resp = client.post("/api/v1/simulations/", json=payload)
        assert resp.status_code == 422

    def test_simulation_invalid_contribution_returns_422(self):
        payload = self._valid_payload()
        payload["monthly_contribution"] = -100
        resp = client.post("/api/v1/simulations/", json=payload)
        assert resp.status_code == 422


class TestMonteCarloEndpoint:
    def _valid_payload(self) -> dict:
        return {
            "initial_value": 10000,
            "monthly_contribution": 500,
            "months": 60,
            "annual_return_pct": 10.0,
            "annual_volatility_pct": 20.0,
            "n_simulations": 200,
            "seed": 42,
        }

    def test_mc_returns_200(self):
        resp = client.post("/api/v1/monte-carlo/", json=self._valid_payload())
        assert resp.status_code == 200

    def test_mc_has_percentile_bands(self):
        resp = client.post("/api/v1/monte-carlo/", json=self._valid_payload())
        data = resp.json()
        for band in ("p5", "p25", "p50", "p75", "p95"):
            assert band in data
            assert len(data[band]) == 61  # months+1

    def test_mc_with_target_has_probability(self):
        payload = self._valid_payload()
        payload["target_value"] = 100_000
        resp = client.post("/api/v1/monte-carlo/", json=payload)
        data = resp.json()
        assert data["probability_of_reaching_target"] is not None


class TestMarketDataEndpoint:
    def test_rates_returns_200(self):
        resp = client.get("/api/v1/market-data/rates")
        assert resp.status_code == 200
        data = resp.json()
        assert "selic_aa" in data
        assert "cdi_aa" in data

    def test_assets_returns_list(self):
        resp = client.get("/api/v1/market-data/assets")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 5

    def test_tax_comparison_returns_regimes(self):
        resp = client.get("/api/v1/market-data/tax-comparison?gross_return_pct=13.0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 4
        assert all("net_return_pct" in item for item in data)


class TestRiskEndpoint:
    def test_risk_metrics_returns_200(self):
        import numpy as np
        returns = list(np.random.default_rng(0).normal(0.01, 0.04, 60))
        resp = client.post("/api/v1/risk/metrics", json={"returns": returns})
        assert resp.status_code == 200
        data = resp.json()
        assert "sharpe_ratio" in data
        assert "max_drawdown_pct" in data
        assert "var_95_pct" in data
