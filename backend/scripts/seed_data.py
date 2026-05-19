"""Seed the database with initial asset data and mock historical prices."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal, create_tables
from app.models.asset import Asset, AssetClass


ASSETS = [
    {"ticker": "CDI",     "name": "CDI (Renda Fixa DI)",        "asset_class": AssetClass.CDB.value,                  "benchmark": "CDI"},
    {"ticker": "IPCA+5",  "name": "Tesouro IPCA+ 5%",          "asset_class": AssetClass.TESOURO_IPCA.value,          "benchmark": "IPCA"},
    {"ticker": "LFT",     "name": "Tesouro Selic",              "asset_class": AssetClass.TESOURO_SELIC.value,         "benchmark": "Selic"},
    {"ticker": "LCI",     "name": "LCI/LCA (Isento IR)",        "asset_class": AssetClass.LCI_LCA.value,              "benchmark": "CDI"},
    {"ticker": "BOVA11.SA","name": "Ibovespa (BOVA11)",         "asset_class": AssetClass.ACOES.value,                "benchmark": "IBOV"},
    {"ticker": "SMAL11.SA","name": "Small Caps (SMAL11)",       "asset_class": AssetClass.ACOES.value,                "benchmark": "SMLL"},
    {"ticker": "IVVB11.SA","name": "S&P 500 BRL (IVVB11)",     "asset_class": AssetClass.ETF_INTERNACIONAL.value,     "benchmark": "SPX"},
    {"ticker": "NASD11.SA","name": "Nasdaq 100 BRL (NASD11)",  "asset_class": AssetClass.ETF_INTERNACIONAL.value,     "benchmark": "NDX"},
    {"ticker": "KNRI11.SA","name": "Kinea Renda Imob.",         "asset_class": AssetClass.FII.value,                  "benchmark": "IFIX"},
    {"ticker": "MXRF11.SA","name": "Maxi Renda FII",           "asset_class": AssetClass.FII.value,                  "benchmark": "IFIX"},
    {"ticker": "BTLG11.SA","name": "BTG Logística FII",        "asset_class": AssetClass.FII.value,                  "benchmark": "IFIX"},
    {"ticker": "PETR4.SA", "name": "Petrobras PN",             "asset_class": AssetClass.ACOES.value,                "benchmark": "IBOV"},
    {"ticker": "VALE3.SA", "name": "Vale ON",                  "asset_class": AssetClass.ACOES.value,                "benchmark": "IBOV"},
    {"ticker": "ITUB4.SA", "name": "Itaú Unibanco PN",         "asset_class": AssetClass.ACOES.value,                "benchmark": "IBOV"},
]


async def seed() -> None:
    await create_tables()
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        for asset_data in ASSETS:
            stmt = select(Asset).where(Asset.ticker == asset_data["ticker"])
            existing = await session.scalar(stmt)
            if not existing:
                asset = Asset(**asset_data)
                session.add(asset)
        await session.commit()
    print(f"✅ Seeded {len(ASSETS)} assets.")


if __name__ == "__main__":
    asyncio.run(seed())
