"use client"

import React, { useOptimistic, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { OptimisticMessage, OptimisticMessageListProps } from './types';

// Optimistic reducer for useOptimistic
function optimisticReducer(
  state: OptimisticMessage[],
  optimisticValue: OptimisticMessage
): OptimisticMessage[] {
  return [...state, optimisticValue];
}

// Message Bubble component for individual messages
const MessageBubble: React.FC<{
  message: OptimisticMessage;
  onRetry?: (message: OptimisticMessage) => void;
}> = ({ message, onRetry }) => {
  const isUser = message.type === 'user';
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';
  const isSent = message.status === 'sent';

  // Status icon based on message state
  const getStatusIcon = () => {
    if (isPending) {
      return <Loader2 className="h-3 w-3 animate-spin" data-testid="spinner-icon" />;
    }
    if (isFailed) {
      return <XCircle className="h-3 w-3 text-red-500" data-testid="error-icon" />;
    }
    if (isSent && isUser) {
      return <CheckCircle className="h-3 w-3 text-green-500" data-testid="check-icon" />;
    }
    return null;
  };

  // Visual styling based on message state
  const getMessageStyles = () => {
    let baseStyles = isUser 
      ? 'bg-blue-500 text-white border-2 border-blue-400' 
      : 'bg-gray-50 border border-gray-200';

    if (isPending) {
      baseStyles += ' opacity-70';
    } else if (isFailed) {
      baseStyles += ' bg-red-50 border-red-200 text-red-800';
    }

    return baseStyles;
  };

  const statusIcon = getStatusIcon();

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full",
        isUser ? 'justify-end' : 'justify-start'
      )}
      role="article"
      aria-label={`${isUser ? 'User' : 'AI'} message: ${message.content}`}
      data-message-status={message.status}
    >
      <div className={cn(
        "flex items-start space-x-3 max-w-[80%]",
        isUser ? 'flex-row-reverse space-x-reverse' : ''
      )}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={cn(
            isUser 
              ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' 
              : 'bg-gray-100 text-gray-600'
          )}>
            {isUser ? <User className="h-4 w-4" data-testid="user-icon" /> : <Bot className="h-4 w-4" data-testid="bot-icon" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col space-y-2 min-w-0 flex-1">
          <Card className={cn("shadow-sm", getMessageStyles())}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1">
                  {message.content || 'Message content unavailable'}
                </p>
                {statusIcon && (
                  <div className="flex-shrink-0 mt-0.5">
                    {statusIcon}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error message and retry button for failed messages */}
          {isFailed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between text-sm"
            >
              <div 
                role="status" 
                aria-live="polite"
                className="text-red-600 flex items-center gap-1"
              >
                <span>{message.error || 'Failed to send message'}</span>
              </div>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(message)}
                  disabled={message.retrying}
                  className="text-red-600 hover:text-red-700 h-6 px-2"
                  aria-label={`Retry sending message: ${message.content}`}
                >
                  {message.retrying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" data-testid="retry-icon" />
                  )}
                  <span className="ml-1">Retry</span>
                </Button>
              )}
            </motion.div>
          )}

          {/* Component rendering for interactive content */}
          {message.component && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2"
            >
              {message.component}
            </motion.div>
          )}

          {/* Timestamp and status info */}
          <div 
            className={cn(
              "text-xs flex items-center gap-2",
              isUser ? 'text-right justify-end' : 'text-left justify-start'
            )}
            id={`message-${message.id}-status`}
          >
            <span className={cn(
              isUser ? 'text-blue-300' : 'text-gray-400'
            )}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {isPending && (
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" data-testid="clock-icon" />
                Sending...
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const OptimisticMessageList: React.FC<OptimisticMessageListProps> = ({
  messages,
  onRetry,
  isTyping = false,
  className,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use React 19's useOptimistic hook for optimistic updates
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    optimisticReducer
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages.length]);

  // Handle retry action
  const handleRetry = (message: OptimisticMessage) => {
    if (onRetry && !message.retrying) {
      onRetry(message);
    }
  };

  // Empty state
  if (optimisticMessages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center text-gray-500",
        className
      )}>
        <div className="text-center space-y-2">
          <Bot className="h-12 w-12 mx-auto text-gray-300" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs text-gray-400">Start a conversation to begin</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea 
      className={cn("flex-1 p-6 h-0", className)}
      data-testid="scroll-container"
    >
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {optimisticMessages.map((message) => (
            <MessageBubble
              key={message.tempId || message.id}
              message={message}
              onRetry={handleRetry}
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-[80%]">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-gray-50 border border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default OptimisticMessageList;