'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw, X, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MessageErrorProps {
  error: string;
  canRetry?: boolean;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function MessageError({
  error,
  canRetry = false,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  onDismiss,
  className = '',
}: MessageErrorProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('connection')) {
      return 'network';
    }
    if (errorMessage.toLowerCase().includes('timeout')) {
      return 'timeout';
    }
    return 'general';
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network':
        return WifiOff;
      case 'timeout':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  const getErrorSeverity = (retryCount: number, maxRetries: number) => {
    if (retryCount >= maxRetries) return 'destructive';
    if (retryCount >= maxRetries / 2) return 'warning';
    return 'default';
  };

  const errorType = getErrorType(error);
  const ErrorIcon = getErrorIcon(errorType);
  const severity = getErrorSeverity(retryCount, maxRetries);

  const getErrorVariant = () => {
    switch (severity) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'default'; // No warning variant in shadcn Alert
      default:
        return 'default';
    }
  };

  const getRetryButtonText = () => {
    if (isRetrying) return 'Retrying...';
    if (retryCount > 0) return `Retry (${retryCount}/${maxRetries})`;
    return 'Retry';
  };

  const getErrorMessage = () => {
    if (retryCount >= maxRetries) {
      return `${error} After ${maxRetries} attempts, please check your connection or try again later.`;
    }
    return error;
  };

  return (
    <Alert 
      variant={getErrorVariant()}
      className={`${className} transition-all duration-200 ${
        severity === 'destructive' ? 'border-red-200 bg-red-50' : 
        severity === 'warning' ? 'border-orange-200 bg-orange-50' : 
        'border-blue-200 bg-blue-50'
      }`}
    >
      <ErrorIcon className={`h-4 w-4 ${
        severity === 'destructive' ? 'text-red-600' : 
        severity === 'warning' ? 'text-orange-600' : 
        'text-blue-600'
      }`} />
      
      <div className="flex-1 min-w-0">
        <AlertDescription className={`text-sm ${
          severity === 'destructive' ? 'text-red-700' : 
          severity === 'warning' ? 'text-orange-700' : 
          'text-blue-700'
        }`}>
          {getErrorMessage()}
        </AlertDescription>
        
        {(canRetry || onDismiss) && (
          <div className="flex gap-2 mt-3">
            {canRetry && onRetry && retryCount < maxRetries && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
                className={`${
                  severity === 'destructive' ? 'border-red-300 text-red-700 hover:bg-red-100' : 
                  severity === 'warning' ? 'border-orange-300 text-orange-700 hover:bg-orange-100' : 
                  'border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {isRetrying ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {getRetryButtonText()}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className={`${
                  severity === 'destructive' ? 'text-red-700 hover:bg-red-100' : 
                  severity === 'warning' ? 'text-orange-700 hover:bg-orange-100' : 
                  'text-blue-700 hover:bg-blue-100'
                }`}
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        )}

        {retryCount > 0 && retryCount < maxRetries && (
          <div className={`text-xs mt-2 ${
            severity === 'destructive' ? 'text-red-600' : 
            severity === 'warning' ? 'text-orange-600' : 
            'text-blue-600'
          }`}>
            Attempt {retryCount} of {maxRetries}
          </div>
        )}
      </div>
    </Alert>
  );
}