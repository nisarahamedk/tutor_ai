"use client"

import React from 'react';
import { motion } from 'framer-motion';
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
import { cn } from '@/lib/utils';
import type { MessageBubbleProps } from './types';

/**
 * Enhanced Message Bubble component with visual states for optimistic updates
 * 
 * Features:
 * - Visual feedback for pending, sent, and failed states
 * - Retry functionality for failed messages
 * - Accessibility support with proper ARIA labels
 * - Smooth animations for state transitions
 */
export const EnhancedMessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  className,
}) => {
  const isUser = message.type === 'user';
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';
  const isSent = message.status === 'sent';

  // Status icon based on message state
  const getStatusIcon = () => {
    if (isPending || message.retrying) {
      return <Loader2 className="h-3 w-3 animate-spin text-gray-500" data-testid="spinner-icon" />;
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
      baseStyles += ' opacity-70 transition-opacity duration-200';
    } else if (isFailed) {
      baseStyles += ' bg-red-50 border-red-200 text-red-800';
    }

    return baseStyles;
  };

  // Handle retry action
  const handleRetry = () => {
    if (onRetry && !message.retrying) {
      onRetry(message);
    }
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
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
      role="article"
      aria-label={`${isUser ? 'User' : 'AI'} message: ${message.content}`}
      aria-describedby={`status-${message.id}`}
      data-message-status={message.status}
      data-testid="message-bubble"
    >
      <div className={cn(
        "flex items-start space-x-3 max-w-[80%]",
        isUser ? 'flex-row-reverse space-x-reverse' : ''
      )}>
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={cn(
            "border-2",
            isUser 
              ? 'bg-blue-100 text-blue-600 border-blue-300' 
              : 'bg-gray-100 text-gray-600 border-gray-300'
          )}>
            {isUser ? (
              <User className="h-4 w-4" data-testid="user-icon" />
            ) : (
              <Bot className="h-4 w-4" data-testid="bot-icon" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col space-y-2 min-w-0 flex-1">
          {/* Message Content */}
          <Card className={cn("shadow-sm", getMessageStyles())}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1 break-words">
                  {message.content || (
                    <span className="italic text-gray-500">
                      Message content unavailable
                    </span>
                  )}
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
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between text-sm"
            >
              <div 
                role="alert" 
                aria-live="polite"
                className="text-red-600 flex items-center gap-1 flex-1"
              >
                <XCircle className="h-3 w-3 flex-shrink-0" />
                <span className="break-words">
                  {message.error || 'Failed to send message'}
                </span>
              </div>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  disabled={message.retrying}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2 ml-2 flex-shrink-0"
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
            id={`status-${message.id}`}
          >
            <span className={cn(
              isUser ? 'text-blue-300' : 'text-gray-400'
            )}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {/* Status indicators */}
            {isPending && !message.retrying && (
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" data-testid="clock-icon" />
                <span>Sending...</span>
              </span>
            )}
            
            {message.retrying && (
              <span className="text-orange-500 flex items-center gap-1">
                <RotateCcw className="h-3 w-3 animate-spin" />
                <span>Retrying...</span>
              </span>
            )}
            
            {isSent && isUser && (
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Sent</span>
              </span>
            )}
          </div>

          {/* Screen reader status announcements */}
          <div 
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          >
            {isPending && !message.retrying && "Message is being sent"}
            {message.retrying && "Retrying message"}
            {isFailed && `Message failed: ${message.error || 'Unknown error'}`}
            {isSent && "Message sent successfully"}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedMessageBubble;