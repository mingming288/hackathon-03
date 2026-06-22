"""Supabase 连接测试脚本。

用法：
    cd server
    python scripts/check_supabase.py

预期输出：
    [OK] Supabase 连接成功
    [OK] posters 表存在，当前记录数: X
    [OK] Storage bucket 'posters' 存在
"""
from __future__ import annotations

import os
import sys

# 添加项目根目录到 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from app.config import get_settings


def check_supabase():
    settings = get_settings()

    print("=" * 50)
    print("Supabase 连接检查")
    print("=" * 50)

    # 1. 检查环境变量
    print("\n1. 检查环境变量...")
    if not settings.supabase_url:
        print("[FAIL] SUPABASE_URL 未配置")
        return False
    print(f"[OK] SUPABASE_URL: {settings.supabase_url}")

    if not settings.supabase_service_key:
        print("[FAIL] SUPABASE_SERVICE_KEY 未配置")
        return False
    print("[OK] SUPABASE_SERVICE_KEY: 已配置")

    if not settings.supabase_anon_key:
        print("[WARN] SUPABASE_ANON_KEY 未配置（可选，前端读取需要）")
    else:
        print("[OK] SUPABASE_ANON_KEY: 已配置")

    # 2. 连接 Supabase
    print("\n2. 连接 Supabase...")
    try:
        from supabase import create_client

        client = create_client(settings.supabase_url, settings.supabase_service_key)
        print("[OK] Supabase 客户端创建成功")
    except Exception as e:
        print(f"[FAIL] Supabase 连接失败: {e}")
        return False

    # 3. 检查 posters 表
    print("\n3. 检查 posters 表...")
    try:
        resp = client.table("posters").select("*", count="exact").limit(1).execute()
        count = resp.count if hasattr(resp, "count") else len(resp.data)
        print(f"[OK] posters 表存在，当前记录数: {count}")
    except Exception as e:
        print(f"[FAIL] posters 表查询失败: {e}")
        print("   请确保已执行 supabase/migrations/0001_posters_table.sql")
        print("   SQL 内容：")
        print("   create table if not exists public.posters (")
        print("     id uuid primary key default gen_random_uuid(),")
        print("     created_at timestamptz default now(),")
        print("     user_ref text, project_name text, team_name text,")
        print("     style text not null, layout_used text,")
        print("     poster_copy jsonb not null, image_url text not null,")
        print("     image_storage_path text, generation_meta jsonb,")
        print("     status text not null default 'success'")
        print("   );")
        return False

    # 4. 检查 Storage bucket
    print("\n4. 检查 Storage bucket...")
    try:
        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if "posters" in bucket_names:
            print("[OK] Storage bucket 'posters' 存在")
        else:
            print(f"[FAIL] Storage bucket 'posters' 不存在")
            print(f"   现有 buckets: {bucket_names}")
            print("   请执行以下 SQL 创建 bucket：")
            print("   insert into storage.buckets (id, name, public)")
            print("     values ('posters', 'posters', true)")
            print("     on conflict (id) do nothing;")
            return False
    except Exception as e:
        print(f"[FAIL] Storage 检查失败: {e}")
        return False

    print("\n" + "=" * 50)
    print("[SUCCESS] 所有检查通过！Supabase 配置正确。")
    print("=" * 50)
    return True


if __name__ == "__main__":
    success = check_supabase()
    sys.exit(0 if success else 1)
