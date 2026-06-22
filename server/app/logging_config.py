"""结构化日志配置模块。"""
from __future__ import annotations

import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """JSON 格式化器，用于生产环境结构化日志。"""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # 添加异常信息
        if record.exc_info and record.exc_info[1]:
            log_data["exception"] = {
                "type": type(record.exc_info[1]).__name__,
                "message": str(record.exc_info[1]),
            }
            if record.exc_info[2]:
                log_data["exception"]["traceback"] = self.formatException(record.exc_info)

        # 添加额外字段
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data

        # 添加请求信息（如果有）
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "client_ip"):
            log_data["client_ip"] = record.client_ip

        return json.dumps(log_data, ensure_ascii=False)


class HumanReadableFormatter(logging.Formatter):
    """人类可读格式化器，用于开发环境。"""

    # 颜色代码
    COLORS = {
        "DEBUG": "\033[36m",    # 青色
        "INFO": "\033[32m",     # 绿色
        "WARNING": "\033[33m",  # 黄色
        "ERROR": "\033[31m",    # 红色
        "CRITICAL": "\033[35m", # 紫色
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        reset = self.RESET

        # 时间戳
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 格式化消息
        msg = (
            f"{color}{timestamp} - {record.levelname:8s}{reset} - "
            f"{record.name} - {record.getMessage()}"
        )

        # 添加异常信息
        if record.exc_info and record.exc_info[1]:
            msg += f"\n{color}{self.formatException(record.exc_info)}{reset}"

        return msg


def setup_logging(
    level: str = "INFO",
    json_output: bool = False,
    log_file: str | None = None,
) -> None:
    """配置应用日志。

    Args:
        level: 日志级别（DEBUG, INFO, WARNING, ERROR, CRITICAL）
        json_output: 是否使用 JSON 格式输出（生产环境推荐）
        log_file: 日志文件路径（可选）
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # 清除现有处理器
    root_logger.handlers.clear()

    # 选择格式化器
    if json_output:
        formatter: logging.Formatter = JSONFormatter()
    else:
        formatter = HumanReadableFormatter()

    # 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 文件输出（可选）
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(JSONFormatter())  # 文件始终用 JSON
        root_logger.addHandler(file_handler)

    # 设置第三方库日志级别
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """获取命名日志器。"""
    return logging.getLogger(name)
