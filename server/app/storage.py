"""Supabase 图片存储接入层。"""
from __future__ import annotations

import io
import logging
import time
import uuid

from .config import get_settings

logger = logging.getLogger(__name__)


class StorageError(RuntimeError):
    pass


class PosterStorage:
    """海报图上传 + 公共 URL（Supabase Storage）。"""

    def __init__(self, settings=None) -> None:
        self.s = settings or get_settings()
        self._supabase_client = None

    @property
    def supabase_client(self):
        if not self.s.supabase_ready:
            raise StorageError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        if self._supabase_client is None:
            from supabase import create_client

            self._supabase_client = create_client(self.s.supabase_url, self.s.supabase_service_key)
        return self._supabase_client

    def upload_poster_image(self, image_bytes: bytes, *, ext: str = "png") -> tuple[str, str]:
        """上传海报图到 Supabase Storage。

        返回 (public_url, storage_path)。
        """
        if not self.s.supabase_ready:
            raise StorageError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")

        ym = time.strftime("%Y/%m", time.gmtime())
        filename = f"{uuid.uuid4().hex}.{ext.lstrip('.')}"
        storage_path = f"{ym}/{filename}"
        content_type = f"image/{ext.lstrip('.')}"

        try:
            return self._upload_supabase(image_bytes, storage_path, content_type)
        except Exception as exc:
            raise StorageError(f"图片上传失败: {exc}") from exc

    def _upload_supabase(self, image_bytes: bytes, storage_path: str, content_type: str) -> tuple[str, str]:
        """上传到 Supabase Storage。"""
        bucket = self.supabase_client.storage.from_(self.s.supabase_bucket)
        buf = io.BytesIO(image_bytes)
        bucket.upload(
            file=buf,
            path=storage_path,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        public_url = bucket.get_public_url(storage_path)
        logger.info("Supabase 上传成功: %s", public_url)
        return public_url, storage_path
