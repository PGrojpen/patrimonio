"""Date utilities for Brazilian business calendar."""

from datetime import date, timedelta


# Brazilian national holidays (fixed; approximate for demo — real impl would use workalendar)
BR_HOLIDAYS = {
    (1, 1),   # Confraternização Universal
    (4, 21),  # Tiradentes
    (5, 1),   # Dia do Trabalho
    (9, 7),   # Independência
    (10, 12), # Nossa Senhora Aparecida
    (11, 2),  # Finados
    (11, 15), # Proclamação da República
    (12, 25), # Natal
}


def is_business_day(d: date) -> bool:
    """Return True if date is a Brazilian business day (weekday + not holiday)."""
    if d.weekday() >= 5:  # Saturday=5, Sunday=6
        return False
    return (d.month, d.day) not in BR_HOLIDAYS


def next_business_day(d: date) -> date:
    """Return the next Brazilian business day after d."""
    d += timedelta(days=1)
    while not is_business_day(d):
        d += timedelta(days=1)
    return d


def business_days_between(start: date, end: date) -> int:
    """Count business days between start (inclusive) and end (exclusive)."""
    count = 0
    current = start
    while current < end:
        if is_business_day(current):
            count += 1
        current += timedelta(days=1)
    return count


def month_end_dates(start: date, end: date) -> list[date]:
    """Return list of month-end dates between start and end."""
    result: list[date] = []
    current = date(start.year, start.month, 1)
    while current <= end:
        # Last day of current month
        if current.month == 12:
            last = date(current.year + 1, 1, 1) - timedelta(days=1)
        else:
            last = date(current.year, current.month + 1, 1) - timedelta(days=1)
        if last <= end:
            result.append(last)
        # Move to next month
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)
    return result
