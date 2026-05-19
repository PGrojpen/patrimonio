"""Market data endpoints — rates, IPCA, asset prices."""

from fastapi import APIRouter

from app.services.data_fetchers.bcb import get_cdi_annual_pct, get_ipca_monthly, get_selic_current
from app.services.data_fetchers.yfinance_client import DEFAULT_TICKERS, fetch_prices
from app.services.tax_calculator import TaxRegime, net_return_after_tax

router = APIRouter(prefix="/market-data", tags=["Dados de Mercado"])


@router.get(
    "/rates",
    summary="Taxas atuais",
    description="Retorna Selic, CDI, e IPCA mais recentes do Banco Central.",
)
async def get_current_rates() -> dict[str, float]:
    selic = await get_selic_current()
    cdi = await get_cdi_annual_pct()
    return {
        "selic_aa": round(selic, 2),
        "cdi_aa": round(cdi, 2),
        "poupanca_aa": round(selic * 0.7, 2),  # 70% da Selic (quando Selic > 8.5%)
    }


@router.get(
    "/ipca",
    summary="IPCA histórico",
    description="Série histórica do IPCA mensal (Banco Central série 433).",
)
async def get_ipca() -> list[dict[str, object]]:
    df = await get_ipca_monthly()
    if df.empty:
        return []
    return [
        {"date": str(row["date"]), "value": round(float(row["value"]), 4)}
        for _, row in df.iterrows()
    ]


@router.get(
    "/assets",
    summary="Ativos disponíveis",
    description="Lista ativos suportados com classe, ticker, e retorno/volatilidade estimados.",
)
async def list_assets() -> list[dict[str, object]]:
    assets = [
        {"ticker": "CDI", "name": "CDI (Renda Fixa)", "asset_class": "cdb",
         "tax_regime": TaxRegime.TABELA_REGRESSIVA.value},
        {"ticker": "IPCA+5", "name": "Tesouro IPCA+ 5%", "asset_class": "tesouro_ipca",
         "tax_regime": TaxRegime.TABELA_REGRESSIVA.value},
        {"ticker": "LCI", "name": "LCI/LCA (Isento IR)", "asset_class": "lci_lca",
         "tax_regime": TaxRegime.LCI_LCA.value},
        {"ticker": "BOVA11.SA", "name": "Ibovespa (BOVA11)", "asset_class": "acoes",
         "tax_regime": TaxRegime.ACOES.value},
        {"ticker": "IVVB11.SA", "name": "S&P 500 BRL (IVVB11)", "asset_class": "etf_internacional",
         "tax_regime": TaxRegime.ETF.value},
        {"ticker": "NASD11.SA", "name": "Nasdaq 100 BRL (NASD11)", "asset_class": "etf_internacional",
         "tax_regime": TaxRegime.ETF.value},
        {"ticker": "KNRI11.SA", "name": "Kinea Renda Imob. (KNRI11)", "asset_class": "fii",
         "tax_regime": TaxRegime.FII_DIVIDENDO.value},
        {"ticker": "MXRF11.SA", "name": "Maxi Renda (MXRF11)", "asset_class": "fii",
         "tax_regime": TaxRegime.FII_DIVIDENDO.value},
        {"ticker": "BTLG11.SA", "name": "BTG Logística (BTLG11)", "asset_class": "fii",
         "tax_regime": TaxRegime.FII_DIVIDENDO.value},
        {"ticker": "PETR4.SA", "name": "Petrobras (PETR4)", "asset_class": "acoes",
         "tax_regime": TaxRegime.ACOES.value},
        {"ticker": "VALE3.SA", "name": "Vale (VALE3)", "asset_class": "acoes",
         "tax_regime": TaxRegime.ACOES.value},
        {"ticker": "ITUB4.SA", "name": "Itaú (ITUB4)", "asset_class": "acoes",
         "tax_regime": TaxRegime.ACOES.value},
    ]
    return assets


@router.get(
    "/tax-comparison",
    summary="Comparação tributária",
    description="Compara retorno líquido após IR para diferentes regimes tributários.",
)
async def tax_comparison(gross_return_pct: float = 13.0) -> list[dict[str, object]]:
    regimes = [
        ("Renda Fixa +720d (15%)", TaxRegime.TABELA_REGRESSIVA, 3.0),
        ("Renda Fixa 0-180d (22.5%)", TaxRegime.TABELA_REGRESSIVA, 0.25),
        ("LCI/LCA (Isento)", TaxRegime.LCI_LCA, 3.0),
        ("Ações / ETF swing (15%)", TaxRegime.ACOES, 3.0),
        ("FII dividendo (Isento PF)", TaxRegime.FII_DIVIDENDO, 3.0),
        ("FII ganho de capital (20%)", TaxRegime.FII_GANHO, 3.0),
    ]
    results = []
    for name, regime, holding_years in regimes:
        net = net_return_after_tax(gross_return_pct, regime, holding_years)
        results.append({
            "regime": name,
            "gross_return_pct": gross_return_pct,
            "net_return_pct": round(net, 2),
            "tax_drag_pct": round(gross_return_pct - net, 2),
        })
    return results
