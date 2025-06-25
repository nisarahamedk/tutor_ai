"use client"

import React, { useState, useOptimistic, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { OptimisticMessage, OptimisticMessageInputProps, MessageStatus } from './types';

// Generate unique temporary ID for optimistic messages
const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Optimistic reducer for message input state
function optimisticInputReducer(
  state: OptimisticMessage[],
  optimisticValue: OptimisticMessage
): OptimisticMessage[] {
  return [...state, optimisticValue];
}

export const OptimisticMessageInput: React.FC<OptimisticMessageInputProps> = ({
  onSendMessage,
  activeTab,
  placeholder = "Type your message...",
  maxLength = 2000,
  disabled = false,
  error = null,
  multiline = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Use React 19's useOptimistic for instant message feedback
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    [] as OptimisticMessage[],
    optimisticInputReducer
  );

  // Clear local error when user starts typing
  const handleInputChange = useCallback((value: string) => {
    if (localError) {
      setLocalError(null);
    }
    
    // Enforce max length
    if (maxLength && value.length > maxLength) {
      setInputValue(value.slice(0, maxLength));
    } else {
      setInputValue(value);
    }
  }, [localError, maxLength]);

  // Create optimistic message for instant feedback
  const createOptimisticMessage = useCallback((content: string): OptimisticMessage => {
    const tempId = generateTempId();
    return {
      id: tempId,
      tempId,
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'pending' as MessageStatus,
    };
  }, []);

  // Send message with optimistic update
  const handleSend = useCallback(async () => {
    const trimmedContent = inputValue.trim();
    
    // Validation
    if (!trimmedContent || isSending || disabled) {
      return;
    }

    // Create optimistic message for instant feedback
    const optimisticMessage = createOptimisticMessage(trimmedContent);
    
    // Clear input immediately for instant feedback
    setInputValue('');
    setLocalError(null);
    setIsSending(true);

    try {
      // Add optimistic message immediately (0ms perceived delay)
      addOptimisticMessage(optimisticMessage);

      // Call the actual send function
      await onSendMessage(trimmedContent, optimisticMessage);
      
      // Success - the parent component will handle updating the real message list
    } catch (err) {
      // Error handling - restore input value and show error
      setInputValue(trimmedContent);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setLocalError(errorMessage);
      
      // The optimistic message will be automatically rolled back by React
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
      
      // Re-focus input for better UX
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [inputValue, isSending, disabled, onSendMessage, createOptimisticMessage, addOptimisticMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter behavior
        if (multiline) {
          // Allow new line in multiline mode
          return;
        } else {
          // Prevent send in single-line mode
          e.preventDefault();
          return;
        }
      } else {
        // Send on Enter (without Shift)
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend, multiline]);

  // Determine if send button should be enabled
  const canSend = !isSending && !disabled && inputValue.trim().length > 0;

  // Display error (local error takes precedence over prop error)
  const displayError = localError || error;

  // Input component based on multiline prop
  const InputComponent = multiline ? 'textarea' : Input;
  const inputProps = multiline 
    ? {
        rows: 3,
        className: cn(
          "resize-none bg-white border-gray-200 focus:border-blue-500 rounded-lg",
          "min-h-[2.5rem] max-h-[6rem]"
        )
      }
    : {
        className: "bg-white border-gray-200 focus:border-blue-500"
      };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error Display */}
      {displayError && (
        <div 
          role="alert" 
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" data-testid="alert-icon" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        role="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-3"
      >
        <div className="flex-1">
          <InputComponent
            ref={inputRef as any}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending || disabled}
            maxLength={maxLength}
            aria-label="Type your message"
            aria-describedby={displayError ? "message-error" : undefined}
            {...inputProps}
          />
          
          {/* Character count for long messages */}
          {maxLength && inputValue.length > maxLength * 0.8 && (
            <div className="text-xs text-gray-500 mt-1 text-right">
              {inputValue.length}/{maxLength}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!canSend}
          className={cn(
            "bg-blue-600 hover:bg-blue-700 disabled:opacity-50",
            "transition-colors duration-200"
          )}
          aria-label={`Send message${inputValue ? ': ' + inputValue.slice(0, 50) + (inputValue.length > 50 ? '...' : '') : ''}`}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" data-testid="loader-icon" />
          ) : (
            <Send className="h-4 w-4" data-testid="send-icon" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </form>

      {/* Visual feedback for rapid sending */}
      {optimisticMessages.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          <span>Sending {optimisticMessages.length} message{optimisticMessages.length !== 1 ? 's' : ''}...</span>
        </div>
      )}

      {/* Accessibility: Live region for status updates */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {isSending && "Sending message..."}
        {displayError && `Error: ${displayError}`}
        {!isSending && !displayError && inputValue.length > 0 && "Ready to send"}
      </div>
    </div>
  );
};

export default OptimisticMessageInput;