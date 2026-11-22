import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع في تشغيل المتجر.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-[#18181B]"
        >
          <div className="max-w-lg w-full bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold mb-3 font-display">تعذر إتمام العملية</h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              واجه المتجر مشكلة تقنية مؤقتة أثناء الاتصال بالبيانات. يمكنك إعادة تحميل الصفحة للمحاولة من جديد.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#15803D] text-white text-sm font-semibold rounded-lg hover:bg-[#166534] transition-colors cursor-pointer"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
