import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * React 错误边界组件
 * 捕获子组件的 JavaScript 错误，防止整个应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // 生产环境上报错误
    if (import.meta.env.PROD) {
      console.error("[ErrorBoundary] 捕获到错误:", error, errorInfo);
      // 这里可以接入 Sentry、Bugsnag 等错误监控服务
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>页面出现了一些问题</h2>
            <p className="error-message">
              {this.state.error?.message || "未知错误"}
            </p>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="error-details">
                <summary>错误详情（开发模式）</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="error-actions">
              <button className="primary" onClick={this.handleReset}>
                重试
              </button>
              <button onClick={() => (window.location.href = "/")}>
                返回首页
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 60vh;
              padding: 20px;
            }
            .error-boundary-content {
              text-align: center;
              max-width: 500px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 16px;
              padding: 40px;
              backdrop-filter: blur(10px);
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .error-boundary h2 {
              margin: 0 0 12px;
              font-size: 20px;
            }
            .error-message {
              color: #ff9b9b;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .error-details {
              text-align: left;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .error-details summary {
              cursor: pointer;
              color: #aaa;
            }
            .error-details pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 12px;
              border-radius: 8px;
              overflow-x: auto;
              margin-top: 8px;
              max-height: 200px;
              overflow-y: auto;
            }
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
            }
            .error-actions button {
              padding: 10px 24px;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              font-size: 14px;
            }
            .error-actions .primary {
              background: #4f46e5;
              color: white;
            }
            .error-actions button:not(.primary) {
              background: rgba(255, 255, 255, 0.1);
              color: #ccc;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
