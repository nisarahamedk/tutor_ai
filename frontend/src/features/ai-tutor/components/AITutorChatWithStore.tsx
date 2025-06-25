"use client"

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
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
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import store hooks (TASK-009 implementation)
import { useMessageDisplay, useMessageInput, useTabManager } from '../stores/chatStore';
import { useChatActions } from '../stores/chatStore';
import type { TabType, OptimisticMessage } from '../types';

// Import previously created components for interactive content
import { TrackExplorationComponent, LearningTrack } from './learning/TrackExplorationComponent';
import { SkillAssessmentComponent, SkillAssessment } from './learning/SkillAssessmentComponent';
import { LearningPreferencesComponent } from './dashboard/LearningPreferencesComponent';
import { InteractiveLessonComponent } from './learning/InteractiveLessonComponent';
import { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
import { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';

/**
 * Enhanced Message Display Component
 * Uses store selectors for performance optimization (no prop drilling)
 */
const MessageListWithStore: React.FC<{ tab: TabType }> = ({ tab }) => {
  const { messages, isTyping, error, pendingCount, failedCount } = useMessageDisplay(tab);
  const { retryMessage } = useChatActions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRetry = async (message: OptimisticMessage) => {
    if (message.tempId) {
      await retryMessage(tab, message);
    }
  };

  return (
    <ScrollArea className="flex-1 p-6 h-0">
      <div className="space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={message.type === 'user' ? 'bg-green-100 text-green-600 border-2 border-green-300' : 'bg-blue-100 text-blue-600'}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-2 min-w-0 flex-1">
                  <Card className={`${message.type === 'user' ? 'bg-green-500 text-white border-2 border-green-400' : 'bg-gray-50'} shadow-sm ${
                    'status' in message && message.status === 'failed' ? 'border-red-300 bg-red-50' : ''
                  } ${
                    'status' in message && message.status === 'pending' ? 'opacity-70' : ''
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Optimistic status indicators */}
                      {'status' in message && message.status === 'pending' && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Sending...
                        </div>
                      )}
                      
                      {'status' in message && message.status === 'failed' && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-red-600">
                            {message.error || 'Failed to send'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(message as OptimisticMessage)}
                            className="h-6 text-xs"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
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
                  
                  <span className={`text-xs ${message.type === 'user' ? 'text-right text-white/70' : 'text-left text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-[80%]">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-gray-50 shadow-sm">
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
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

/**
 * Enhanced Message Input Component  
 * Uses store actions directly (no prop drilling)
 */
const MessageInputWithStore: React.FC = () => {
  const { sendMessage, isDisabled, error } = useMessageInput();
  const [inputValue, setInputValue] = React.useState('');

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isDisabled) return;

    const content = inputValue;
    setInputValue('');
    
    try {
      await sendMessage(content);
    } catch (err) {
      // Error handling is done in the store
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask me anything..."
        className="flex-1 bg-white border-gray-200 focus:border-blue-500"
        disabled={isDisabled}
      />
      <Button 
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isDisabled}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isDisabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

/**
 * Enhanced Tab Manager with Store Integration
 * Shows message counts and status indicators
 */
const TabManagerWithStore: React.FC = () => {
  const { activeTab, setActiveTab, tabStats } = useTabManager();

  return (
    <div className="border-b px-6">
      <TabsList className="grid w-full grid-cols-4 bg-gray-50">
        <TabsTrigger 
          value="home" 
          className="flex items-center gap-2 relative"
          onClick={() => setActiveTab('home')}
        >
          <Home className="h-4 w-4" />
          Home
          {tabStats.home.failedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {tabStats.home.failedCount}
            </Badge>
          )}
          {tabStats.home.pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full"></div>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="progress" 
          className="flex items-center gap-2 relative"
          onClick={() => setActiveTab('progress')}
        >
          <TrendingUp className="h-4 w-4" />
          Progress
          {tabStats.progress.failedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {tabStats.progress.failedCount}
            </Badge>
          )}
          {tabStats.progress.pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full"></div>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="review" 
          className="flex items-center gap-2 relative"
          onClick={() => setActiveTab('review')}
        >
          <RotateCcw className="h-4 w-4" />
          Review
          {tabStats.review.failedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {tabStats.review.failedCount}
            </Badge>
          )}
          {tabStats.review.pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full"></div>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="explore" 
          className="flex items-center gap-2 relative"
          onClick={() => setActiveTab('explore')}
        >
          <BookOpen className="h-4 w-4" />
          Explore
          {tabStats.explore.failedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {tabStats.explore.failedCount}
            </Badge>
          )}
          {tabStats.explore.pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full"></div>
          )}
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

/**
 * Main AITutorChat component refactored with Zustand store (TASK-009)
 * 
 * Key improvements from TASK-009:
 * - Eliminated all local useState calls (was 8+, now 0)
 * - No prop drilling - components access store directly  
 * - Performance optimized with selective subscriptions
 * - Integrated optimistic updates from TASK-007
 * - Simplified component logic - no state management concerns
 * - Better error handling with centralized state
 * - Maintains all existing functionality
 */
export const AITutorChatWithStore: React.FC = () => {
  const { activeTab } = useTabManager();
  const { error, isTyping, isLoading } = useMessageInput();
  const { sendMessageToTab, sendAIMessage } = useChatActions();

  // Handler functions now use store actions directly (no local state)
  const handleTrackSelection = async (track: LearningTrack) => {
    const content = `Excellent choice! The ${track.title} track is perfect for your goals. Before we start, let me assess your current skill level:`;
    const component = <SkillAssessmentComponent onComplete={handleAssessmentComplete} />;
    
    sendAIMessage('explore', content, { trackId: track.id }, component);
  };

  const handleAssessmentComplete = async (skills: SkillAssessment[]) => {
    const avgLevel = skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length;
    const levelText = avgLevel >= 4 ? 'advanced' : avgLevel >= 2.5 ? 'intermediate' : 'beginner';
    const content = `Based on your assessment, you're at ${levelText} level. Now let's customize your learning experience:`;
    const component = <LearningPreferencesComponent onComplete={handlePreferencesComplete} />;
    
    sendAIMessage(activeTab, content, { assessmentLevel: levelText }, component);
  };

  const handlePreferencesComplete = async () => {
    const content = "Perfect! Your learning plan is ready. Let's start with an interactive lesson:";
    const component = <InteractiveLessonComponent />;
    
    sendAIMessage(activeTab, content, { step: 'lesson-start' }, component);
  };

  const handleReviewComplete = async () => {
    const content = "Great job on the review! You're making excellent progress. What would you like to do next?";
    sendAIMessage(activeTab, content, { step: 'review-complete' });
  };

  const handleShowProgress = async () => {
    const content = "Here's your current learning progress:";
    const component = (
      <ProgressDashboardComponent
        onContinueLearning={() => handleContinueLearning()}
        onSelectTrack={() => handleContinueLearning()}
      />
    );
    
    await sendMessageToTab('progress', content, component);
  };

  const handleContinueLearning = async () => {
    const content = "Welcome back! Let's continue where you left off:";
    const component = <InteractiveLessonComponent />;
    
    sendAIMessage(activeTab, content, { step: 'continue-learning' }, component);
  };

  const handleStartReview = async () => {
    const content = "Let's review what you've learned with some flashcards:";
    const component = <FlashcardReviewComponent onComplete={handleReviewComplete} />;
    
    await sendMessageToTab('review', content, component);
  };

  // Quick actions using store methods (no local state needed)
  const quickActions = [
    { 
      icon: Zap, 
      label: "Show Progress", 
      action: handleShowProgress,
    },
    { 
      icon: Target, 
      label: "Get Help", 
      action: () => sendMessageToTab(activeTab, "help")
    },
    { 
      icon: BookOpen, 
      label: "What's Next?", 
      action: () => sendMessageToTab(activeTab, "what should I learn next?")
    },
    { 
      icon: Award, 
      label: "Review Concepts", 
      action: handleStartReview
    }
  ];

  return (
    <div className="flex flex-col min-h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border">
      {/* Chat Header with Store-based Status */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-900">AI Tutor (Enhanced)</h2>
            <p className="text-sm text-gray-600">Store-powered with optimistic updates</p>
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

      {/* Enhanced Tabs with Store Integration */}
      <Tabs value={activeTab} className="flex-1 flex flex-col">
        <TabManagerWithStore />

        {/* Messages Area for each tab using Store Components */}
        {(['home', 'progress', 'review', 'explore'] as TabType[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="flex-1 flex flex-col m-0 overflow-hidden">
            {/* Store-powered Message List (no props needed) */}
            <MessageListWithStore tab={tab} />

            {/* Input Area with Store Integration */}
            <div className="border-t bg-gray-50 p-4 flex-shrink-0">
              <MessageInputWithStore />
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3 max-w-full overflow-x-auto">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    disabled={isLoading || isTyping}
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50"
                  >
                    <action.icon className="h-4 w-4" />
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

export default AITutorChatWithStore;