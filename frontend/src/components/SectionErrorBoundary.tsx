"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SectionErrorBoundary] Error in section ${this.props.sectionName || "unknown"}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full py-12 px-4 flex flex-col items-center justify-center bg-amber-50/50 border border-amber-200/60 rounded-3xl text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">
            Khu vực nội dung đang được cập nhật
          </h3>
          <p className="text-xs text-stone-600 max-w-md mb-4">
            Đã xảy ra sự cố hiển thị ở phần {this.props.sectionName || "này"}. Các khu vực khác của trang vẫn hoạt động bình thường.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tải lại khu vực</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

