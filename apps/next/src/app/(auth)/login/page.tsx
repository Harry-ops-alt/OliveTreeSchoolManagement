import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '../../../lib/constants';
import { login } from '../../../lib/auth';
import { Button } from '@olive/ui';
import { Suspense } from 'react';
import { LoginError } from './login-error';

export const metadata = {
  title: 'Olive Tree | Login',
};

export default function LoginPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    redirect('/app');
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          Sign in to continue to the Olive Tree School Management Platform.
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginError />
      </Suspense>
      <LoginForm />

      <p className="text-center text-xs text-emerald-100/70">
        Need an account?{' '}
        <Link href="/contact" className="font-medium text-white underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}

function LoginForm() {
  return (
    <form action={login} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-emerald-50">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-lg border border-emerald-500/30 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/40"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm text-emerald-50">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="w-full rounded-lg border border-emerald-500/30 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/40"
          required
        />
      </div>

      <Button type="submit" className="w-full bg-emerald-500 text-white hover:bg-emerald-400">
        Sign in
      </Button>
    </form>
  );
}
