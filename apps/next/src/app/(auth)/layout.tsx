import type { ReactNode } from 'react';
import '../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 text-slate-50">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl bg-white/5 p-8 shadow-xl backdrop-blur">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
