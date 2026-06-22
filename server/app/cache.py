"""图片缓存模块。"""
from __future__ import annotations

import hashlib
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any

from .logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class CacheEntry:
    """缓存条目。"""
    key: str
    image_bytes: bytes
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)


class ImageCache:
    """LRU 图片缓存，支持 TTL 过期。"""

    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        """初始化缓存。

        Args:
            max_size: 最大缓存条目数
            ttl_seconds: 缓存有效期（秒）
        """
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._hits = 0
        self._misses = 0

    def _make_key(self, prd: str, style: str, **kwargs: Any) -> str:
        """生成缓存键。"""
        # 组合关键参数生成唯一键
        key_parts = [prd.strip(), style]
        for k in sorted(kwargs.keys()):
            v = kwargs[k]
            if v is not None:
                key_parts.append(f"{k}={v}")

        raw_key = "|".join(key_parts)
        return hashlib.sha256(raw_key.encode()).hexdigest()[:16]

    def get(self, prd: str, style: str, **kwargs: Any) -> CacheEntry | None:
        """获取缓存条目。"""
        key = self._make_key(prd, style, **kwargs)

        if key in self._cache:
            entry = self._cache[key]

            # 检查是否过期
            if time.time() - entry.created_at > self._ttl_seconds:
                logger.debug("缓存已过期: %s", key)
                del self._cache[key]
                self._misses += 1
                return None

            # 更新访问信息
            entry.access_count += 1
            entry.last_accessed = time.time()

            # 移动到末尾（最近使用）
            self._cache.move_to_end(key)

            self._hits += 1
            logger.debug("缓存命中: %s (访问次数: %d)", key, entry.access_count)
            return entry

        self._misses += 1
        return None

    def set(
        self,
        prd: str,
        style: str,
        image_bytes: bytes,
        metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> str:
        """设置缓存条目。"""
        key = self._make_key(prd, style, **kwargs)

        # 如果缓存已满，删除最旧的条目
        if len(self._cache) >= self._max_size:
            # 删除最久未访问的条目
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            logger.debug("缓存已满，删除最旧条目: %s", oldest_key)

        # 添加新条目
        entry = CacheEntry(
            key=key,
            image_bytes=image_bytes,
            metadata=metadata or {},
        )
        self._cache[key] = entry

        logger.debug("缓存设置: %s (大小: %d bytes)", key, len(image_bytes))
        return key

    def clear(self) -> int:
        """清空缓存，返回删除的条目数。"""
        count = len(self._cache)
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        logger.info("缓存已清空: %d 条目", count)
        return count

    def cleanup_expired(self) -> int:
        """清理过期条目。"""
        now = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now - entry.created_at > self._ttl_seconds
        ]

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.info("清理过期缓存: %d 条目", len(expired_keys))

        return len(expired_keys)

    @property
    def stats(self) -> dict[str, Any]:
        """获取缓存统计信息。"""
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "ttl_seconds": self._ttl_seconds,
        }


# 全局缓存实例
_image_cache: ImageCache | None = None


def get_image_cache() -> ImageCache:
    """获取全局图片缓存实例。"""
    global _image_cache
    if _image_cache is None:
        _image_cache = ImageCache(max_size=50, ttl_seconds=3600)
    return _image_cache
