"""WebSocket 实时进度推送模块。"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from enum import Enum
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ProgressStage(str, Enum):
    """生成进度阶段。"""
    INIT = "init"
    PARSING = "parsing"
    COPYWRITING = "copywriting"
    COPY_VALIDATION = "copy_validation"
    PROMPT_BUILDING = "prompt_building"
    IMAGE_GENERATING = "image_generating"
    IMAGE_VALIDATING = "image_validating"
    POST_PROCESSING = "post_processing"
    PERSISTING = "persisting"
    COMPLETED = "completed"
    FAILED = "failed"


class ProgressMessage:
    """进度消息。"""

    def __init__(
        self,
        stage: ProgressStage,
        progress: int,  # 0-100
        message: str,
        detail: dict[str, Any] | None = None,
    ):
        self.stage = stage
        self.progress = progress
        self.message = message
        self.detail = detail or {}
        self.request_id = str(uuid.uuid4())[:8]

    def to_dict(self) -> dict[str, Any]:
        return {
            "stage": self.stage.value,
            "progress": self.progress,
            "message": self.message,
            "detail": self.detail,
            "request_id": self.request_id,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


class ConnectionManager:
    """WebSocket 连接管理器。"""

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """接受 WebSocket 连接。"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info("WebSocket 连接已建立: %s", client_id)

    def disconnect(self, client_id: str) -> None:
        """断开 WebSocket 连接。"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info("WebSocket 连接已断开: %s", client_id)

    async def send_progress(self, client_id: str, message: ProgressMessage) -> None:
        """发送进度消息给指定客户端。"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message.to_json())
            except Exception as exc:
                logger.warning("发送进度消息失败: %s", exc)
                self.disconnect(client_id)

    async def broadcast(self, message: ProgressMessage) -> None:
        """广播进度消息给所有客户端。"""
        disconnected = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message.to_json())
            except Exception as exc:
                logger.warning("广播消息失败: %s", exc)
                disconnected.append(client_id)

        for client_id in disconnected:
            self.disconnect(client_id)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# 全局连接管理器
_manager: ConnectionManager | None = None


def get_manager() -> ConnectionManager:
    """获取全局连接管理器。"""
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager


# 预定义的进度阶段和消息
STAGE_MESSAGES = {
    ProgressStage.INIT: (0, "初始化生成流程..."),
    ProgressStage.PARSING: (10, "正在解析项目描述..."),
    ProgressStage.COPYWRITING: (25, "正在生成创意文案..."),
    ProgressStage.COPY_VALIDATION: (35, "正在校验文案质量..."),
    ProgressStage.PROMPT_BUILDING: (45, "正在组装图像提示词..."),
    ProgressStage.IMAGE_GENERATING: (60, "正在生成报纸图片..."),
    ProgressStage.IMAGE_VALIDATING: (80, "正在校验图片质量..."),
    ProgressStage.POST_PROCESSING: (90, "正在进行后处理..."),
    ProgressStage.PERSISTING: (95, "正在保存到数据库..."),
    ProgressStage.COMPLETED: (100, "生成完成！"),
    ProgressStage.FAILED: (0, "生成失败"),
}
