"""Supabase 数据库接入层（posters 表 CRUD）。"""
from __future__ import annotations

import logging
from typing import Any

from .config import get_settings

logger = logging.getLogger(__name__)


class DBError(RuntimeError):
    pass


class PosterDB:
    """posters 表的 Supabase 封装。"""

    def __init__(self, settings=None) -> None:
        self.s = settings or get_settings()
        self._supabase_client = None

    @property
    def supabase_client(self):
        if not self.s.supabase_ready:
            raise DBError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        if self._supabase_client is None:
            from supabase import create_client

            self._supabase_client = create_client(
                self.s.supabase_url, self.s.supabase_service_key
            )
        return self._supabase_client

    def _supabase_save(self, record: dict[str, Any]) -> dict[str, Any]:
        resp = self.supabase_client.table("posters").insert(record).execute()
        if not resp.data:
            raise DBError(f"supabase_save 无返回: {resp!r}")
        return resp.data[0]

    def _supabase_list(
        self, *, user_ref: str | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        q = self.supabase_client.table("posters").select("*").order("created_at", desc=True)
        if user_ref:
            q = q.eq("user_ref", user_ref)
        resp = q.limit(limit).offset(offset).execute()
        return resp.data or []

    def _supabase_get(self, poster_id: str) -> dict[str, Any] | None:
        resp = (
            self.supabase_client.table("posters")
            .select("*")
            .eq("id", poster_id)
            .limit(1)
            .execute()
        )
        return resp.data[0] if resp.data else None

    # ── 公开接口 ──

    def save_poster(self, record: dict[str, Any]) -> dict[str, Any]:
        """插入一条 poster 记录，返回含 id 的完整记录。"""
        if not self.s.supabase_ready:
            raise DBError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        try:
            return self._supabase_save(record)
        except Exception as exc:
            raise DBError(f"save_poster 失败: {exc}") from exc

    def list_posters(
        self,
        *,
        user_ref: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """查询海报列表（默认按时间倒序）。"""
        if not self.s.supabase_ready:
            raise DBError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        try:
            return self._supabase_list(user_ref=user_ref, limit=limit, offset=offset)
        except Exception as exc:
            raise DBError(f"list_posters 失败: {exc}") from exc

    def get_poster(self, poster_id: str) -> dict[str, Any] | None:
        """查询单条海报。"""
        if not self.s.supabase_ready:
            raise DBError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        try:
            return self._supabase_get(poster_id)
        except Exception as exc:
            raise DBError(f"get_poster 失败: {exc}") from exc
