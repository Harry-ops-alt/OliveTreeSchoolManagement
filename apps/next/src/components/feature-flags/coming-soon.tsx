'use client';

import React, { type ErrorInfo, type ReactNode } from 'react';
import { isApiNotFoundError } from '../../lib/api/fetch-json';

export interface ComingSoonBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ComingSoonState {
  hasError: boolean;
}

export class ComingSoonBoundary extends React.Component<ComingSoonBoundaryProps, ComingSoonState> {
  constructor(props: ComingSoonBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ComingSoonState {
    if (isApiNotFoundError(error)) {
      return { hasError: true };
    }

    throw error;
  }

  override componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    // No-op, handled in render via state
  }

  override componentDidUpdate(prevProps: ComingSoonBoundaryProps): void {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
            Feature coming soon. Check back shortly!
          </div>
        )
      );
    }

    return this.props.children;
  }
}
