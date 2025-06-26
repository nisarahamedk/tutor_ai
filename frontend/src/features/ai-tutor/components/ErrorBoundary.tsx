'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Learning component error:', error, errorInfo);
    
    // Track error analytics
    if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag === 'function') {
      (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-red-700">
            We encountered an error while loading this learning component. 
            This might be a temporary issue.
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={reset}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Server Component Error Fallback for data fetching failures
export function ServerComponentErrorFallback({ reset }: { error?: Error; reset: () => void }) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          Content Temporarily Unavailable
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-yellow-700">
            We&apos;re having trouble loading your learning content right now. 
            This could be due to a network issue or temporary server problem.
          </p>
          
          <div className="bg-yellow-100 p-3 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-1">What you can do:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Wait a moment and try again</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={reset}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Loading
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/ai-tutor'}
              variant="outline" 
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}