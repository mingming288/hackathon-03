/**
 * 网络状态检测模块
 *
 * 提供在线/离线状态检测，用于在离线时降级到 localStorage
 */
import { useState, useEffect } from "react";

/** 检查当前是否在线 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/** React Hook：监听网络状态变化 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

/** 网络状态事件回调类型 */
type NetworkCallback = (online: boolean) => void;

const listeners: Set<NetworkCallback> = new Set();

/** 监听网络状态变化 */
export function onNetworkChange(callback: NetworkCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// 初始化全局监听
if (typeof window !== "undefined") {
  window.addEventListener("online", () => listeners.forEach((cb) => cb(true)));
  window.addEventListener("offline", () =>
    listeners.forEach((cb) => cb(false)),
  );
}
