"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatContainerProps } from './types';

export const ChatContainer: React.FC<ChatContainerProps> = ({
  children,
  isTyping = false,
  error,
  onErrorDismiss,
  className = ''
}) => {
  const handleErrorDismiss = () => {
    if (onErrorDismiss) {
      onErrorDismiss();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && error && onErrorDismiss) {
      handleErrorDismiss();
    }
  };

  return (
    <main 
      className={`flex flex-col h-full max-w-4xl mx-auto w-full ${className}`}
      aria-label="Chat interface"
    >
      {/* Header */}
      <header 
        className="border-b bg-white/80 backdrop-blur-sm p-4 sm:p-6"
        role="banner"
        aria-label="Chat header"
      >
        <div className="flex items-center justify-between">
          {/* AI Tutor Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Brain 
                className="h-6 w-6 text-blue-600" 
                data-testid="brain-icon"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Tutor</h1>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  data-testid="status-indicator"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-600">Online</span>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center space-x-1 text-sm text-blue-600"
                    data-testid="typing-indicator"
                    data-animate="fade-in"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>AI is typing...</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
              data-animate="slide-down"
            >
              <div 
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
                {onErrorDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleErrorDismiss}
                    onKeyDown={handleKeyDown}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                    aria-label="Dismiss error message"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </main>
  );
};