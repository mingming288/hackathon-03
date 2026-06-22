"""poster-agent FastAPI 入口。

本地：uvicorn app.main:app --reload --port 8766
"""
from __future__ import annotations

import base64
import json
import logging
import time
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .db import DBError, PosterDB
from .logging_config import setup_logging, get_logger
from .cache import get_image_cache
from .models import GenerateResponse, PosterListItem
from .orchestrator import run_pipeline
from .storage import PosterStorage, StorageError
from .styles import list_styles, style_to_public_dict
from .upload_helpers import validate_and_save_image, validate_and_save_qr_code, save_local_image
from .rate_limit import RateLimitMiddleware
from .security import SecurityHeadersMiddleware
from .websocket import get_manager

app = FastAPI(
    title="Poster Director Agent",
    version="0.1.0",
    description="""
## AI 驱动的中文报纸风格海报生成器

输入项目 PRD + 0-3 张照片 + 6 种风格之一，自动生成一张中文报纸头版图片。

### 功能特性

- 🎨 **6 种报纸风格**：经典日报、未来赛博、娱乐头条、3D人物、漫画分镜、魔法学院
- 📝 **智能文案生成**：基于 DeepSeek 自动生成新闻风格文案
- 🖼️ **AI 生图**：使用 gpt-image-2 生成高质量报纸海报
- 📱 **双模式支持**：选手模式（基于PRD）和观众模式（基于现场体验）
- 💾 **云端存储**：Supabase 数据库 + Storage 持久化

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| `IMAGE_GENERATION_FAILED` | 图像生成失败 |
| `IMAGE_REFERENCE_LOST` | 参考图丢失 |
| `COPY_GENERATION_FAILED` | 文案生成失败 |
| `DATABASE_ERROR` | 数据库操作失败 |

### 限流说明

生产环境限制：每分钟最多 10 次请求（可通过环境变量配置）。
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    openapi_tags=[
        {
            "name": "生成",
            "description": "海报生成相关接口",
        },
        {
            "name": "查询",
            "description": "海报历史查询接口",
        },
        {
            "name": "系统",
            "description": "系统状态和配置接口",
        },
    ],
)

settings = get_settings()

# 配置结构化日志
setup_logging(
    level=settings.log_level,
    json_output=settings.env == "production",
)
logger = get_logger(__name__)

# ── 静态测试页面 ──
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

# ── 前端构建产物目录（Render 部署时由 buildCommand 复制） ──
DIST_DIR = Path(__file__).resolve().parent.parent / "static" / "dist"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 限流中间件（生产环境：每分钟最多 10 次请求）
if settings.env == "production":
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=settings.rate_limit_max_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )

# 安全头中间件（生产环境）
if settings.env == "production":
    app.add_middleware(SecurityHeadersMiddleware)


@app.get("/", response_class=HTMLResponse)
async def index():
    """返回 Web 测试页面（优先前端 dist，否则回退 static）。"""
    # 优先返回前端构建产物
    dist_index = DIST_DIR / "index.html"
    if dist_index.exists():
        return dist_index.read_text(encoding="utf-8")
    # 回退到 static 测试页面
    html_path = STATIC_DIR / "index.html"
    if html_path.exists():
        return html_path.read_text(encoding="utf-8")
    return "<h1>static/index.html not found</h1>"


# ── 挂载前端静态文件（dist/assets、图片等） ──
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="frontend-assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_frontend(request: Request, full_path: str):
        """SPA catch-all：非 /api/ 和 /outputs/ 的请求都返回 index.html。"""
        # 不拦截 API 和 outputs 路由
        if full_path.startswith("api/") or full_path.startswith("outputs/"):
            raise HTTPException(status_code=404, detail="Not found")
        # 尝试返回 dist 中的静态文件
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # 兜底返回 index.html（SPA 路由）
        index_html = DIST_DIR / "index.html"
        if index_html.exists():
            return index_html.read_text(encoding="utf-8")
        return "<h1>Frontend not built</h1>"


@app.get("/outputs/{filename}")
async def serve_output(filename: str):
    """返回本地生成的海报图片。"""
    safe_name = Path(filename).name  # 防路径穿越
    img_path = STATIC_DIR.parent / "outputs" / safe_name
    if img_path.exists():
        return FileResponse(img_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="图片不存在")


@app.get("/api/health")
async def health() -> dict:
    """健康检查 + 配置就绪状态（不泄露任何 key）。"""
    return {
        "status": "ok",
        "service": "poster-agent",
        "env": settings.env,
        "deepseek_ready": settings.deepseek_ready,
        "image_ready": settings.image_ready,
        "supabase_ready": settings.supabase_ready,
        "image_model": settings.image_model,
    }


@app.get("/api/styles")
async def get_styles() -> dict:
    """返回 6 种风格元数据（供前端选择器展示）。"""
    return {
        "styles": [style_to_public_dict(s) for s in list_styles()],
        "count": len(list_styles()),
    }


@app.get("/api/cache/stats")
async def cache_stats() -> dict:
    """返回图片缓存统计信息。"""
    cache = get_image_cache()
    return {
        "status": "ok",
        "cache": cache.stats,
    }


@app.post("/api/cache/clear")
async def clear_cache() -> dict:
    """清空图片缓存。"""
    cache = get_image_cache()
    cleared = cache.clear()
    return {
        "status": "ok",
        "cleared_count": cleared,
    }


@app.websocket("/ws/generate/{client_id}")
async def websocket_generate(websocket: WebSocket, client_id: str):
    """WebSocket 端点：实时推送生成进度。

    连接后，客户端会收到各阶段的进度更新：
    - init: 初始化
    - parsing: 解析 PRD
    - copywriting: 生成文案
    - image_generating: 生成图片
    - completed: 完成
    - failed: 失败
    """
    manager = get_manager()
    await manager.connect(websocket, client_id)

    try:
        while True:
            # 保持连接，等待客户端消息或断开
            data = await websocket.receive_text()
            # 客户端可以发送 ping 保持连接
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(client_id)


@app.post("/api/generate-poster")
async def generate_poster(
    prd: str = Form("", description="项目 PRD / 描述（选手模式必填，观众模式可省略）", max_length=5000),
    style: str = Form(..., description="daily/cyber/entertainment/character3d/comic/magic"),
    project_name: str = Form(""),
    team_name: str = Form(""),
    event_name: str = Form(""),
    layout_mode: str = Form("fixed", description="fixed / random(需seed) / generate"),
    user_ref: str = Form(""),
    options: str = Form("", description='可选 JSON，如 {"event_name":"..."}'),
    images: list[UploadFile] = File(default=[]),
    qr_code: UploadFile | None = File(default=None, description="可选二维码图片，程序化贴入右下角"),
    mode: str = Form("participant", description="participant=选手模式, audience=观众模式"),
    user_name: str = Form("", description="观众姓名/昵称（audience 模式使用）"),
    impression: str = Form("", description="观众感受/印象（audience 模式使用）"),
) -> dict:
    """主接口：PRD + 照片 + 风格 → 生成报纸海报。

    流程：Step1 解析 → Step2 文案 → Step3 prompt → Step4 生图 → Step5 校验 → Step6 持久化。
    mode=audience 时，跳过 Step1，直接生成观众专属文案。
    """
    # 校验：选手模式必须有 PRD
    if mode != "audience" and not prd:
        raise HTTPException(status_code=400, detail="选手模式必须提供项目描述或 PRD")

    # 限制图片 0-3 张
    image_files = [img for img in images if img.filename]
    if len(image_files) > 3:
        raise HTTPException(status_code=400, detail="最多上传 3 张图片")

    # 合并 options JSON 里的 event_name 等字段
    extra: dict[str, Any] = {}
    if options:
        try:
            extra = json.loads(options)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="options 不是合法 JSON")
    eff_event = event_name or extra.get("event_name", "")

    # 保存用户上传图片（使用辅助函数）
    image_count = len(image_files)
    user_image_paths: list[str] = []
    if image_files:
        uploads_dir = STATIC_DIR.parent / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        for img in image_files:
            path = await validate_and_save_image(
                img,
                max_size_mb=settings.image_max_size_mb,
                allowed_mimes=settings.image_allowed_mime_list,
                max_dimension=settings.image_max_dimension,
                uploads_dir=uploads_dir,
            )
            user_image_paths.append(path)

    # 保存二维码图片（使用辅助函数）
    qr_code_path: str | None = None
    if qr_code and qr_code.filename:
        uploads_dir = STATIC_DIR.parent / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        qr_code_path = await validate_and_save_qr_code(qr_code, uploads_dir=uploads_dir)

    # 跑工作流
    try:
        orch = await run_pipeline(
            prd=prd,
            style_key=style,
            project_name=project_name,
            team_name=team_name,
            event_name=eff_event,
            image_count=image_count,
            user_image_paths=user_image_paths or None,
            qr_code_path=qr_code_path,
            layout_mode=layout_mode,
            user_ref=user_ref,
            mode=mode,
            user_name=user_name,
            impression=impression,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("工作流执行失败")
        raise HTTPException(status_code=500, detail=f"生成失败: {exc}") from exc

    resp = orch.response

    # Step6：持久化（图入 Storage，记录入 DB）
    image_url = ""
    storage_path = None
    poster_id = None

    if orch.image_bytes:
        # 先存一份到本地 outputs（无论 Supabase 是否可用都有保底）
        local_filename = await save_local_image(orch.image_bytes, STATIC_DIR.parent / "outputs")

        # 尝试上传到 Supabase Storage
        try:
            storage = PosterStorage()
            image_url, storage_path = storage.upload_poster_image(orch.image_bytes)
        except StorageError as exc:
            logger.error("图片上传 Storage 失败，回退本地/base64: %s", exc)
            # Supabase 不可用 → 回退：本地 URL + base64 data URI
            if local_filename:
                image_url = f"/outputs/{local_filename}"
            else:
                # 最终兜底：base64 直接塞进 response
                b64 = base64.b64encode(orch.image_bytes).decode("ascii")
                image_url = f"data:image/png;base64,{b64}"

    # 落库（即使生图/上传失败，文案也落库以便排查）
    record = {
        "user_ref": user_ref or None,
        "project_name": project_name or None,
        "team_name": team_name or None,
        "style": style,
        "layout_used": resp.layout_used,
        "poster_copy": resp.poster_copy.model_dump(),
        "image_url": image_url,
        "image_storage_path": storage_path,
        "generation_meta": resp.generation_meta.model_dump(),
        "status": resp.status if image_url else "failed",
    }
    try:
        db = PosterDB()
        saved = db.save_poster(record)
        poster_id = saved.get("id")
    except DBError as exc:
        logger.error("落库失败（不影响返回图片）: %s", exc)

    resp.poster_id = poster_id
    resp.image_url = image_url
    return resp.model_dump()


@app.get("/api/posters")
async def list_posters(
    user_ref: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """查询海报历史列表（前端共享 DB，也可直接用 supabase-js 查 posters 表）。"""
    try:
        db = PosterDB()
        rows = db.list_posters(user_ref=user_ref, limit=limit, offset=offset)
    except DBError as exc:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {exc}") from exc
    return {
        "items": [PosterListItem.from_row(r).model_dump() for r in rows],
        "count": len(rows),
    }


@app.get("/api/posters/{poster_id}")
async def get_poster(poster_id: str) -> dict:
    """查询单张海报详情。"""
    try:
        db = PosterDB()
        row = db.get_poster(poster_id)
    except DBError as exc:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {exc}") from exc
    if not row:
        raise HTTPException(status_code=404, detail="海报不存在")
    return row


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
