"""同步图片 URL 到 Supabase 数据库。

将本地图片的 Supabase Storage URL 更新到 newspapers 表的 image_url 字段。
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from app.config import get_settings


def sync_image_urls():
    settings = get_settings()

    print("=" * 60)
    print("同步图片 URL 到 Supabase 数据库")
    print("=" * 60)

    if not settings.supabase_ready:
        print("[FAIL] Supabase 未配置")
        return False

    try:
        from supabase import create_client
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        print("[OK] Supabase 连接成功")
    except Exception as e:
        print(f"[FAIL] 连接失败: {e}")
        return False

    # 1. 获取所有 newspapers 记录
    print("\n[INFO] 获取 newspapers 记录...")
    try:
        resp = client.table("newspapers").select("*").execute()
        newspapers = resp.data
        print(f"  找到 {len(newspapers)} 条记录")
    except Exception as e:
        print(f"  [FAIL] 查询失败: {e}")
        return False

    # 2. 获取 Storage 中的所有图片
    print("\n[INFO] 获取 Supabase Storage 中的图片...")
    try:
        bucket = client.storage.from_(settings.supabase_bucket)
        files = bucket.list("2026/06")
        poster_files = [f for f in files if f["name"].startswith("poster_")]
        print(f"  找到 {len(poster_files)} 张海报图片")
    except Exception as e:
        print(f"  [WARN] 无法列出文件: {e}")
        poster_files = []

    # 3. 更新 newspapers 的 image_url
    print("\n[INFO] 更新 newspapers.image_url...")
    bucket_url = f"https://{settings.supabase_url.split('//')[1]}/storage/v1/object/public/{settings.supabase_bucket}"

    updated_count = 0
    for paper in newspapers:
        paper_id = paper.get("newspaper_id", "")
        current_url = paper.get("image_url", "")

        # 如果已经有 URL，跳过
        if current_url and current_url.startswith("http"):
            print(f"  [SKIP] {paper_id} - 已有 URL")
            continue

        # 根据 newspaper_id 匹配本地文件
        # newspaper_id 格式: n-daily, n-universe 等
        # 本地文件格式: poster_*.png
        # 我们使用第一张可用的图片作为默认
        if poster_files:
            first_file = poster_files[0]
            new_url = f"{bucket_url}/2026/06/{first_file['name']}"

            try:
                client.table("newspapers").update({"image_url": new_url}).eq("newspaper_id", paper_id).execute()
                print(f"  [OK] {paper_id} -> {new_url[:60]}...")
                updated_count += 1
            except Exception as e:
                print(f"  [FAIL] {paper_id}: {e}")

    # 4. 同时检查 posters 表（AI 生成的海报）
    print("\n[INFO] 检查 posters 表...")
    try:
        resp = client.table("posters").select("*").execute()
        posters = resp.data
        print(f"  找到 {len(posters)} 条 poster 记录")

        poster_updated = 0
        for poster in posters:
            poster_id = poster.get("id", "")
            current_url = poster.get("image_url", "")

            if current_url and current_url.startswith("http"):
                print(f"  [SKIP] {poster_id[:8]}... - 已有 URL")
                continue

            # 匹配本地 poster 文件
            for pf in poster_files:
                if pf.get("metadata", {}).get("size", 0) > 0:
                    new_url = f"{bucket_url}/2026/06/{pf['name']}"
                    try:
                        client.table("posters").update({"image_url": new_url}).eq("id", poster_id).execute()
                        print(f"  [OK] {poster_id[:8]}... -> {pf['name']}")
                        poster_updated += 1
                        break
                    except Exception as e:
                        print(f"  [FAIL] {poster_id[:8]}...: {e}")
        print(f"  更新了 {poster_updated} 条 poster 记录")
    except Exception as e:
        print(f"  [WARN] posters 表查询失败: {e}")

    print("\n" + "=" * 60)
    print(f"[SUCCESS] 完成！更新了 {updated_count} 条 newspaper 记录")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = sync_image_urls()
    sys.exit(0 if success else 1)
