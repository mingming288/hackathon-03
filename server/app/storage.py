"""图片存储接入层（阿里云 OSS + Supabase 降级）。"""
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
    """海报图上传 + 公共 URL。

    优先使用阿里云 OSS，降级到 Supabase Storage。
    """

    def __init__(self, settings=None) -> None:
        self.s = settings or get_settings()
        self._oss_client = None
        self._supabase_client = None

    @property
    def oss_client(self):
        if not self.s.oss_ready:
            raise StorageError("OSS 未配置")
        if self._oss_client is None:
            import oss2

            auth = oss2.Auth(self.s.oss_access_key_id, self.s.oss_access_key_secret)
            self._oss_client = oss2.Bucket(auth, self.s.oss_endpoint, self.s.oss_bucket_name)
        return self._oss_client

    @property
    def supabase_client(self):
        if not self.s.supabase_ready:
            raise StorageError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")
        if self._supabase_client is None:
            from supabase import create_client

            self._supabase_client = create_client(self.s.supabase_url, self.s.supabase_service_key)
        return self._supabase_client

    def upload_poster_image(self, image_bytes: bytes, *, ext: str = "png") -> tuple[str, str]:
        """上传海报图。

        返回 (public_url, storage_path)。
        优先 OSS，降级 Supabase。
        """
        ym = time.strftime("%Y/%m", time.gmtime())
        filename = f"{uuid.uuid4().hex}.{ext.lstrip('.')}"
        storage_path = f"{ym}/{filename}"
        content_type = f"image/{ext.lstrip('.')}"

        # 尝试阿里云 OSS
        if self.s.oss_ready:
            try:
                return self._upload_oss(image_bytes, storage_path, content_type)
            except Exception as exc:
                logger.warning("OSS 上传失败，降级 Supabase: %s", exc)

        # 降级 Supabase
        if self.s.supabase_ready:
            try:
                return self._upload_supabase(image_bytes, storage_path, content_type)
            except Exception as exc:
                logger.error("Supabase 上传也失败: %s", exc)
                raise StorageError(f"图片上传失败: {exc}") from exc

        raise StorageError("未配置任何存储服务（OSS/Supabase）")

    def _upload_oss(self, image_bytes: bytes, storage_path: str, content_type: str) -> tuple[str, str]:
        """上传到阿里云 OSS。"""
        buf = io.BytesIO(image_bytes)
        self.oss_client.put_object(storage_path, buf, headers={"Content-Type": content_type})

        # 拼接公共 URL：https://{bucket}.{endpoint}/{path}
        endpoint = self.s.oss_endpoint.replace("https://", "").replace("http://", "")
        public_url = f"https://{self.s.oss_bucket_name}.{endpoint}/{storage_path}"
        logger.info("OSS 上传成功: %s", public_url)
        return public_url, storage_path

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
