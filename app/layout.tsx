import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Virtual Try On | Fabric Design Studio',
  description: 'Interactive virtual try-on for traditional South Asian garments with AI-powered fabric replacement, PDF catalog support, and custom design controls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Virtual Try-On</h1>
                <p className="text-xs text-gray-500">AI Fabric Design Studio</p>
              </div>
            </div>
            <div className="text-xs text-gray-400">Powered by AI</div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
