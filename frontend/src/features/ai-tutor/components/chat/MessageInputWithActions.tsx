'use client';

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useMessageAction } from '../../hooks/useMessageAction';
import { useRetryMessage } from '../../hooks/useRetryMessage';
import { MessageError } from './MessageError';
import { MessageInputErrorBoundary } from './ErrorBoundary';
import type { TabType } from '../../actions/types';
import type { QuickAction } from './types';

interface MessageInputWithActionsProps {
  activeTab?: TabType;
  placeholder?: string;
  maxLength?: number;
  quickActions?: QuickAction[];
  className?: string;
  disabled?: boolean;
  onMessageSent?: (message: string) => void;
}

export function MessageInputWithActions({
  activeTab = 'home',
  placeholder = 'Ask me anything...',
  maxLength,
  quickActions = [],
  className = '',
  disabled = false,
  onMessageSent,
}: MessageInputWithActionsProps) {
  const [inputValue, setInputValue] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { state, sendMessage, isPending } = useMessageAction();
  const { 
    retryMessage, 
    recordFailedMessage, 
    resetRetryState, 
    canRetry, 
    isRetrying,
    retryCount,
    maxRetries 
  } = useRetryMessage();

  // Clear input on successful send and reset retry state
  useEffect(() => {
    if (state.success && state.message) {
      setInputValue('');
      resetRetryState();
    }
  }, [state.success, state.message, resetRetryState]);

  // Record failed message for retry
  useEffect(() => {
    if (state.error && inputValue.trim()) {
      recordFailedMessage(inputValue.trim(), activeTab);
    }
  }, [state.error, inputValue, activeTab, recordFailedMessage]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isPending || disabled) {
      return;
    }

    const messageText = inputValue.trim();
    
    // Notify parent component that a message was sent
    onMessageSent?.(messageText);

    const formData = new FormData();
    formData.set('message', messageText);
    formData.set('tabType', activeTab);
    
    sendMessage(formData);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  const handleRetry = async () => {
    await retryMessage(undefined, undefined, onMessageSent);
  };

  const isInputDisabled = isPending || isRetrying || disabled;
  const isSendDisabled = !inputValue.trim() || isPending || isRetrying || disabled;
  
  const characterCount = inputValue.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <MessageInputErrorBoundary>
      <div className={`space-y-2 ${className}`}>
        {/* Enhanced Error Display */}
        {state.error && (
          <MessageError
            error={state.error}
            canRetry={canRetry || false}
            isRetrying={isRetrying}
            retryCount={retryCount}
            maxRetries={maxRetries}
            onRetry={handleRetry}
            onDismiss={resetRetryState}
          />
        )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div 
          data-testid="quick-actions"
          className="flex flex-wrap gap-2 sm:flex-nowrap"
        >
          {quickActions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={action.action}
              disabled={action.loading || isPending}
              aria-label={action.label}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {action.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                React.createElement(action.icon, { className: "h-4 w-4" })
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit}
        aria-label="Send message form"
        role="form"
        className="relative flex items-end gap-2 p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      >
        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isInputDisabled}
            maxLength={maxLength}
            aria-label="Type your message"
            aria-required="true"
            className="w-full min-h-[2.5rem] max-h-32 resize-none border-0 p-0 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 disabled:bg-transparent disabled:cursor-not-allowed"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '2.5rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSendDisabled}
          aria-label="Send message"
          className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
        >
          {isPending || isRetrying ? (
            <Loader2 className="h-5 w-5 animate-spin" data-testid="loader-icon" />
          ) : (
            <Send className="h-5 w-5" data-testid="send-icon" />
          )}
        </button>
      </form>

      {/* Character Count */}
      {maxLength && (
        <div 
          className={`text-xs text-right ${
            isOverLimit 
              ? 'text-red-500' 
              : isNearLimit 
                ? 'text-orange-500' 
                : 'text-gray-400'
          }`}
          aria-live="polite"
          aria-label={`${characterCount} out of ${maxLength} characters used`}
        >
          {characterCount}/{maxLength}
        </div>
      )}
      </div>
    </MessageInputErrorBoundary>
  );
}