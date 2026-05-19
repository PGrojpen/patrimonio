from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HistoricalPrice(Base):
    __tablename__ = "historical_prices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    close: Mapped[float] = mapped_column(Float)
    adjusted_close: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dividends: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = ({"sqlite_autoincrement": False},)


class MacroIndicator(Base):
    __tablename__ = "macro_indicators"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    series_code: Mapped[str] = mapped_column(String(20), index=True)
    series_name: Mapped[str] = mapped_column(String(100))
    date: Mapped[date] = mapped_column(Date, index=True)
    value: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
