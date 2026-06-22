"""临时文件清理模块。"""
from __future__ import annotations

import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)

# 默认保留时间：7 天
DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 3600


def cleanup_old_files(
    directory: Path,
    *,
    max_age_seconds: int = DEFAULT_MAX_AGE_SECONDS,
    pattern: str = "*",
) -> int:
    """清理指定目录下的过期文件。

    返回清理的文件数量。
    """
    if not directory.exists():
        return 0

    now = time.time()
    cleaned = 0

    for file_path in directory.glob(pattern):
        if file_path.is_file():
            try:
                file_age = now - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_path.unlink()
                    cleaned += 1
                    logger.info("清理过期文件: %s (已存在 %.1f 天)", file_path.name, file_age / 86400)
            except Exception as exc:
                logger.warning("清理文件失败 %s: %s", file_path.name, exc)

    return cleaned


def cleanup_uploads_and_outputs(project_root: Path, max_age_seconds: int = DEFAULT_MAX_AGE_SECONDS) -> dict[str, int]:
    """清理 uploads 和 outputs 目录中的过期文件。"""
    uploads_dir = project_root / "uploads"
    outputs_dir = project_root / "outputs"

    results = {
        "uploads": cleanup_old_files(uploads_dir, max_age_seconds=max_age_seconds),
        "outputs": cleanup_old_files(outputs_dir, max_age_seconds=max_age_seconds),
    }

    if any(v > 0 for v in results.values()):
        logger.info("文件清理完成: uploads=%d, outputs=%d", results["uploads"], results["outputs"])

    return results
