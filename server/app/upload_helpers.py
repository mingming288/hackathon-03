"""图片上传校验和处理辅助函数。"""
from __future__ import annotations

import logging
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)


async def validate_and_save_image(
    img: UploadFile,
    *,
    max_size_mb: int,
    allowed_mimes: list[str],
    max_dimension: int,
    uploads_dir: Path,
) -> str:
    """校验并保存用户上传的图片，返回保存路径。

    校验内容：大小、MIME、Pillow 解码、EXIF 去除、尺寸缩放。
    """
    raw = await img.read()

    # 1. 大小校验
    if len(raw) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"图片 {img.filename} 超过 {max_size_mb}MB 限制",
        )

    # 2. MIME 校验
    mime = img.content_type or ""
    if mime not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片格式 {mime}，仅允许 {', '.join(allowed_mimes)}",
        )

    # 3. Pillow 解码 + 去 EXIF + 尺寸校验
    try:
        from PIL import Image as PILImage

        pil_img = PILImage.open(BytesIO(raw))
        # 去 EXIF（GPS/设备信息）
        data = list(pil_img.getdata())
        pil_img_no_exif = PILImage.new(pil_img.mode, pil_img.size)
        pil_img_no_exif.putdata(data)
        # 尺寸校验
        w, h = pil_img_no_exif.size
        if max(w, h) > max_dimension:
            ratio = max_dimension / max(w, h)
            new_size = (int(w * ratio), int(h * ratio))
            pil_img_no_exif = pil_img_no_exif.resize(new_size, PILImage.LANCZOS)
            logger.info("图片缩放: %dx%d → %dx%d", w, h, *new_size)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"图片解码失败: {exc}"
        ) from exc

    # 4. UUID 文件名（防路径穿越和重名）
    ext_map = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
    ext = ext_map.get(mime, "png")
    fname = f"{uuid.uuid4().hex}.{ext}"
    fpath = uploads_dir / fname

    # 保存去 EXIF 后的图片
    save_buf = BytesIO()
    pil_img_no_exif.save(save_buf, format="PNG")
    fpath.write_bytes(save_buf.getvalue())

    logger.info("保存用户图片(安全校验通过): %s", fpath)
    return str(fpath)


async def validate_and_save_qr_code(
    qr_code: UploadFile,
    *,
    uploads_dir: Path,
) -> str:
    """校验并保存二维码图片，返回保存路径。"""
    allowed_qr_mimes = {"image/png", "image/jpeg", "image/webp"}

    qr_raw = await qr_code.read()
    qr_mime = qr_code.content_type or ""

    # 大小校验（最大2MB）
    if len(qr_raw) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="二维码图片超过2MB限制")

    # MIME 校验
    if qr_mime not in allowed_qr_mimes:
        raise HTTPException(status_code=400, detail=f"不支持的二维码格式: {qr_mime}")

    # Pillow 解码校验
    try:
        from PIL import Image as PILImage

        qr_img = PILImage.open(BytesIO(qr_raw))
        qr_img.verify()  # 验证图片完整性
    except Exception:
        raise HTTPException(status_code=400, detail="二维码图片解码失败")

    # 使用 UUID 文件名
    qr_ext_map = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
    qr_ext = qr_ext_map.get(qr_mime, "png")
    qr_fname = f"qr_{uuid.uuid4().hex}.{qr_ext}"
    qr_fpath = uploads_dir / qr_fname
    qr_fpath.write_bytes(qr_raw)

    logger.info("保存二维码图片(安全校验通过): %s", qr_fpath)
    return str(qr_fpath)


async def save_local_image(image_bytes: bytes, outputs_dir: Path) -> str | None:
    """保存生成的图片到本地 outputs 目录，返回文件名。"""
    try:
        outputs_dir.mkdir(exist_ok=True)
        import time
        local_filename = f"poster_{int(time.time())}.png"
        local_path = outputs_dir / local_filename
        local_path.write_bytes(image_bytes)
        logger.info("图片已存本地: %s", local_path)
        return local_filename
    except Exception as exc:
        logger.warning("本地保存图片失败: %s", exc)
        return None
