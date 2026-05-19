import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any

import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class FileCache:
    """File-based cache for expensive computations and market data."""

    def __init__(self, cache_dir: str = settings.cache_dir) -> None:
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _key_to_path(self, key: str) -> Path:
        safe = hashlib.sha256(key.encode()).hexdigest()
        return self.cache_dir / f"{safe}.json"

    def get(self, key: str) -> Any | None:
        path = self._key_to_path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            if data.get("expires_at", float("inf")) < time.time():
                path.unlink(missing_ok=True)
                return None
            return data["value"]
        except Exception:
            logger.warning("cache_read_error", key=key)
            return None

    def set(self, key: str, value: Any, ttl_seconds: int = 86400) -> None:
        path = self._key_to_path(key)
        try:
            path.write_text(
                json.dumps({"value": value, "expires_at": time.time() + ttl_seconds})
            )
        except Exception:
            logger.warning("cache_write_error", key=key)

    def invalidate(self, key: str) -> None:
        self._key_to_path(key).unlink(missing_ok=True)

    def clear_all(self) -> int:
        count = 0
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
            count += 1
        return count


def make_cache_key(*args: Any, **kwargs: Any) -> str:
    payload = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


_cache_instance: FileCache | None = None


def get_cache() -> FileCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = FileCache()
    return _cache_instance
