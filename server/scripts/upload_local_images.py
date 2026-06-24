"""批量上传本地图片到 Supabase Storage。

用法：
    cd server
    python scripts/upload_local_images.py
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# 添加项目根目录到 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from app.config import get_settings


def upload_images():
    settings = get_settings()

    print("=" * 60)
    print("批量上传本地图片到 Supabase Storage")
    print("=" * 60)

    # 检查 Supabase 配置
    if not settings.supabase_ready:
        print("[FAIL] Supabase 未配置，请检查 .env 文件")
        return False

    # 创建客户端
    try:
        from supabase import create_client
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        bucket = client.storage.from_(settings.supabase_bucket)
        print(f"[OK] Supabase 客户端创建成功，bucket: {settings.supabase_bucket}")
    except Exception as e:
        print(f"[FAIL] Supabase 连接失败: {e}")
        return False

    project_root = Path(__file__).parent.parent

    # 1. 上传 outputs 目录的海报图片
    outputs_dir = project_root / "outputs"
    if outputs_dir.exists():
        png_files = list(outputs_dir.glob("*.png"))
        print(f"\n[INFO] 发现 {len(png_files)} 张海报图片 (outputs/)")

        success_count = 0
        for img_path in png_files:
            try:
                ym = time.strftime("%Y/%m", time.gmtime())
                filename = f"{ym}/poster_{img_path.stem}.png"

                with open(img_path, "rb") as f:
                    bucket.upload(
                        file=f,
                        path=filename,
                        file_options={"content-type": "image/png", "upsert": "true"},
                    )

                public_url = bucket.get_public_url(filename)
                print(f"  [OK] {img_path.name} -> {filename}")
                print(f"       URL: {public_url}")
                success_count += 1
            except Exception as e:
                print(f"  [FAIL] {img_path.name}: {e}")

        print(f"  海报上传完成: {success_count}/{len(png_files)}")
    else:
        print("\n[WARN] outputs 目录不存在")

    # 2. 上传 uploads 目录的用户照片
    uploads_dir = project_root / "uploads"
    if uploads_dir.exists():
        jpg_files = list(uploads_dir.glob("*.jpg")) + list(uploads_dir.glob("*.jpeg"))
        print(f"\n[INFO] 发现 {len(jpg_files)} 张用户照片 (uploads/)")

        success_count = 0
        for img_path in jpg_files:
            try:
                ym = time.strftime("%Y/%m", time.gmtime())
                filename = f"{ym}/upload_{img_path.stem}.jpg"

                with open(img_path, "rb") as f:
                    bucket.upload(
                        file=f,
                        path=filename,
                        file_options={"content-type": "image/jpeg", "upsert": "true"},
                    )

                public_url = bucket.get_public_url(filename)
                print(f"  [OK] {img_path.name} -> {filename}")
                print(f"       URL: {public_url}")
                success_count += 1
            except Exception as e:
                print(f"  [FAIL] {img_path.name}: {e}")

        print(f"  照片上传完成: {success_count}/{len(jpg_files)}")
    else:
        print("\n[WARN] uploads 目录不存在")

    # 3. 列出 Storage 中的所有文件
    print("\n[INFO] 当前 Supabase Storage 中的文件:")
    try:
        files = bucket.list("")
        for f in files:
            print(f"  - {f['name']} ({f.get('metadata', {}).get('size', 'unknown')} bytes)")
    except Exception as e:
        print(f"  [WARN] 无法列出文件: {e}")

    print("\n" + "=" * 60)
    print("[SUCCESS] 上传完成！")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = upload_images()
    sys.exit(0 if success else 1)
