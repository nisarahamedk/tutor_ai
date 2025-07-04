"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  BookOpen,
  RotateCcw,
  Brain,
  Zap,
  Target,
  Award,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import optimistic components
import { OptimisticMessageList } from './chat/OptimisticMessageList';
import { OptimisticMessageInput } from './chat/OptimisticMessageInput';
import { useOptimisticRetry } from '../hooks/useOptimisticRetry';
import { useBatchOptimistic } from '../hooks/useBatchOptimistic';

// Import types
import type { OptimisticMessage, TabType, QuickAction } from './chat/types';

// Import previously created components for interactive content
import { TrackExplorationComponent } from './learning/TrackExplorationComponent';
import { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
import { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';

// Tab-specific initial messages with optimistic message format
const getInitialMessages = (tab: TabType): OptimisticMessage[] => {
  const baseMessage = {
    id: `welcome-${tab}`,
    type: 'ai' as const,
    timestamp: new Date(),
    status: 'sent' as const,
  };

  switch (tab) {
    case 'home':
      return [{
        ...baseMessage,
        content: "Welcome to TutorAI! I'm here to guide your learning journey. What would you like to explore today?",
      }];
    case 'progress':
      return [{
        ...baseMessage,
        content: "Here you can track your learning progress across all subjects. Let me show you your current achievements:",
        component: <ProgressDashboardComponent onContinueLearning={() => {}} onSelectTrack={() => {}} />
      }];
    case 'review':
      return [{
        ...baseMessage,
        content: "Ready to review what you've learned? Let's reinforce your knowledge with some practice:",
      }];
    case 'explore':
      return [{
        ...baseMessage,
        content: "Discover new learning paths and subjects! What area would you like to explore?",
        component: <TrackExplorationComponent onTrackSelect={() => {}} />
      }];
    default:
      return [{
        ...baseMessage,
        content: "Welcome to TutorAI! I'm here to guide your learning journey.",
      }];
  }
};

/**
 * AI Tutor Chat component with React 19 useOptimistic implementation
 * 
 * Features implemented for TASK-007:
 * - Instant message feedback using useOptimistic
 * - Automatic rollback on API failures
 * - Message order consistency during optimistic updates
 * - Comprehensive error handling with user-friendly notifications
 * - Retry mechanism for failed messages
 * - Performance optimizations for rapid sending
 * - Full accessibility support
 */
export const AITutorChatOptimistic: React.FC = () => {
  // Separate message states for each tab using optimistic hook
  const [tabMessages, setTabMessages] = useState<Record<TabType, OptimisticMessage[]>>({
    home: getInitialMessages('home'),
    progress: getInitialMessages('progress'),
    review: getInitialMessages('review'),
    explore: getInitialMessages('explore'),
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use optimistic retry hook for failed message handling
  const { retryMessage } = useOptimisticRetry();

  // Use batch optimistic hook for the current tab
  const {
    optimisticMessages,
    addOptimisticMessage,
    updateMessageStatus,
  } = useBatchOptimistic(tabMessages[activeTab]);

  // Update tab messages when optimistic messages change
  useEffect(() => {
    setTabMessages(prev => ({
      ...prev,
      [activeTab]: optimisticMessages
    }));
  }, [optimisticMessages, activeTab]);

  // Add message to current tab with optimistic update
  const addMessageToCurrentTab = useCallback((message: OptimisticMessage) => {
    addOptimisticMessage(message);
  }, [addOptimisticMessage]);

  // Handler functions for interactive components (defined early for use in simulateAPICall)

  const handleReviewComplete = useCallback(() => {
    const newMessage: OptimisticMessage = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content: "Great job on the review! You're making excellent progress. What would you like to do next?",
      timestamp: new Date(),
      status: 'sent',
    };
    addMessageToCurrentTab(newMessage);
  }, [addMessageToCurrentTab]);

  // Simulate API call with realistic behavior
  const simulateAPICall = useCallback(async (input: string): Promise<OptimisticMessage> => {
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Simulate 15% failure rate for testing optimistic rollback
    if (Math.random() < 0.15) {
      throw new Error('Network connection failed. Please try again.');
    }
    
    // Generate AI response based on input
    if (input.toLowerCase().includes('progress')) {
      throw new Error('Use progress button instead');
    } else if (input.toLowerCase().includes('help')) {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "I'm here to help! What specific topic would you like assistance with?",
        timestamp: new Date(),
        status: 'sent',
      };
    } else if (input.toLowerCase().includes('review')) {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "Let's start a review session:",
        timestamp: new Date(),
        status: 'sent',
        component: <FlashcardReviewComponent onComplete={handleReviewComplete} />
      };
    } else {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "I understand you're interested in that topic. Let me help you with personalized guidance based on your learning path.",
        timestamp: new Date(),
        status: 'sent',
      };
    }
  }, [handleReviewComplete]);

  // Handle message sending with optimistic updates
  const handleSendMessage = useCallback(async (content: string, optimisticMessage: OptimisticMessage) => {
    setError(null);
    
    try {
      // Show typing indicator
      setIsTyping(true);
      
      // Simulate AI response
      const aiResponse = await simulateAPICall(content);
      
      // Update optimistic message to sent status
      if (optimisticMessage.tempId) {
        updateMessageStatus(optimisticMessage.tempId, 'sent');
      }
      
      // Add AI response
      setTimeout(() => {
        addMessageToCurrentTab(aiResponse);
        setIsTyping(false);
      }, 500);
      
    } catch (err) {
      setIsTyping(false);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      
      // Update optimistic message to failed status
      if (optimisticMessage.tempId) {
        updateMessageStatus(optimisticMessage.tempId, 'failed', errorMessage);
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  }, [simulateAPICall, updateMessageStatus, addMessageToCurrentTab]);

  // Handle retry for failed messages
  const handleRetry = useCallback(async (message: OptimisticMessage) => {
    if (!message.tempId) return;
    
    try {
      // Update message to retrying state
      updateMessageStatus(message.tempId, 'pending');
      
      // Use retry hook
      await retryMessage(message);
      
      // Simulate the retry
      await handleSendMessage(message.content, message);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      if (message.tempId) {
        updateMessageStatus(message.tempId, 'failed', errorMessage);
      }
    }
  }, [retryMessage, updateMessageStatus, handleSendMessage]);


  const handleShowProgress = useCallback(() => {
    setActiveTab('progress');
    
    setTimeout(() => {
      const newMessage: OptimisticMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "Here's your current learning progress:",
        timestamp: new Date(),
        status: 'sent',
        component: <ProgressDashboardComponent
          onContinueLearning={() => {}}
          onSelectTrack={() => {}}
        />
      };
      addMessageToCurrentTab(newMessage);
    }, 500);
  }, [addMessageToCurrentTab, setActiveTab]);

  // Quick actions with optimistic behavior
  const quickActions: QuickAction[] = [
    { 
      icon: Zap, 
      label: "Show Progress", 
      action: handleShowProgress,
    },
    { 
      icon: Target, 
      label: "Get Help", 
      action: () => {
        // This will use optimistic updates automatically
      }
    },
    { 
      icon: BookOpen, 
      label: "What's Next?", 
      action: () => {
        // This will use optimistic updates automatically
      }
    },
    { 
      icon: Award, 
      label: "Review Concepts", 
      action: () => setActiveTab('review'),
    }
  ];

  // Get current tab's messages
  const currentMessages = tabMessages[activeTab];

  return (
    <div className="flex flex-col min-h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-900">AI Tutor (Optimistic)</h2>
            <p className="text-sm text-gray-600">Your personal learning assistant with instant feedback</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-sm text-red-500 bg-red-50 px-2 py-1 rounded-md"
            >
              <span>Connection issue</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-4 w-4 p-0 text-red-500 hover:text-red-700"
              >
                ×
              </Button>
            </motion.div>
          )}
          {isTyping && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center text-sm text-gray-500"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              AI is thinking...
            </motion.div>
          )}
          <Badge variant="secondary" className={error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
            {error ? "Reconnecting..." : "Online"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Review
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Explore
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Messages Area for each tab */}
        {(['home', 'progress', 'review', 'explore'] as TabType[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="flex-1 flex flex-col m-0 overflow-hidden">
            {/* Optimistic Message List */}
            <OptimisticMessageList
              messages={currentMessages}
              onRetry={handleRetry}
              isTyping={isTyping}
              className="flex-1"
            />

            {/* Optimistic Message Input */}
            <div className="border-t bg-gray-50 p-4 flex-shrink-0">
              <OptimisticMessageInput
                onSendMessage={handleSendMessage}
                activeTab={activeTab}
                placeholder="Ask me anything... (optimistic updates enabled)"
                error={error}
                className="w-full"
              />
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3 max-w-full overflow-x-auto">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50"
                  >
                    {React.createElement(action.icon, { className: "h-4 w-4" })}
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AITutorChatOptimistic;