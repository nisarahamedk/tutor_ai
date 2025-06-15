"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import chat components
import { MessageInputWithActions } from './chat/MessageInputWithActions';
import { useMessageAction } from '../hooks/useMessageAction';
import type { TabType } from '../actions/types';

// Import previously created components
import { TrackExplorationComponent, LearningTrack } from './learning/TrackExplorationComponent';
import { SkillAssessmentComponent, SkillAssessment } from './learning/SkillAssessmentComponent';
import { LearningPreferencesComponent } from './dashboard/LearningPreferencesComponent';
import { InteractiveLessonComponent } from './learning/InteractiveLessonComponent';
import { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
import { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
}

// Tab-specific initial messages
const getInitialMessages = (tab: TabType): ChatMessage[] => {
  const baseMessage = {
    id: '1',
    type: 'ai' as const,
    timestamp: new Date(),
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

export const AITutorChatWithActions: React.FC = () => {
  // Separate message states for each tab
  const [tabMessages, setTabMessages] = useState<Record<TabType, ChatMessage[]>>({
    home: getInitialMessages('home'),
    progress: getInitialMessages('progress'),
    review: getInitialMessages('review'),
    explore: getInitialMessages('explore'),
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the new useActionState hook for message handling
  const { state: messageState, isPending } = useMessageAction();

  // Get current tab's messages
  const currentMessages = tabMessages[activeTab];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeTab]);

  // Handle successful message response
  useEffect(() => {
    if (messageState.success && messageState.message) {
      // Convert server action response to local message format
      const aiMessage: ChatMessage = {
        id: messageState.message.id,
        type: 'ai',
        content: messageState.message.content,
        timestamp: new Date(messageState.message.timestamp),
      };
      
      // Add AI response to current tab
      setTabMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], aiMessage]
      }));
    }
  }, [messageState.success, messageState.message, activeTab]);

  // Add message to current tab
  const addMessageToCurrentTab = (message: ChatMessage) => {
    setTabMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], message]
    }));
  };

  // Handler functions - keeping existing functionality

  const handleTrackSelection = (track: LearningTrack) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Excellent choice! The ${track.title} track is perfect for your goals. Before we start, let me assess your current skill level:`,
      timestamp: new Date(),
      component: <SkillAssessmentComponent onComplete={handleAssessmentComplete} />
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleAssessmentComplete = (skills: SkillAssessment[]) => {
    const avgLevel = skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length;
    const levelText = avgLevel >= 4 ? 'advanced' : avgLevel >= 2.5 ? 'intermediate' : 'beginner';
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Based on your assessment, you're at ${levelText} level. Now let's customize your learning experience:`,
      timestamp: new Date(),
      component: <LearningPreferencesComponent onComplete={handlePreferencesComplete} />
    };
    addMessageToCurrentTab(newMessage);
  };

  const handlePreferencesComplete = () => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Perfect! Your learning plan is ready. Let's start with an interactive lesson:",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleContinueLearning = () => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Welcome back! Let's continue where you left off:",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleStartReview = () => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Let's review what you've learned with some flashcards:",
      timestamp: new Date(),
      component: <FlashcardReviewComponent onComplete={handleReviewComplete} />
    };
    addMessageToCurrentTab(newMessage);
    setActiveTab('review');
  };

  const handleReviewComplete = () => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great job on the review! You're making excellent progress. What would you like to do next?",
      timestamp: new Date()
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleShowProgress = () => {
    setActiveTab('progress');
    
    setTimeout(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: "Here's your current learning progress:",
        timestamp: new Date(),
        component: <ProgressDashboardComponent
          onContinueLearning={handleContinueLearning}
          onSelectTrack={() => handleContinueLearning()}
        />
      };
      setTabMessages(prev => ({
        ...prev,
        progress: [...prev.progress, newMessage]
      }));
    }, 500);
  };

  // Quick actions using the new server action pattern
  const quickActions = [
    { 
      icon: Zap, 
      label: "Show Progress", 
      action: handleShowProgress,
      loading: isPending && activeTab === 'progress'
    },
    { 
      icon: Target, 
      label: "Get Help", 
      action: () => {
        // This will be handled by the server action
        const helpMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: "help",
          timestamp: new Date()
        };
        addMessageToCurrentTab(helpMessage);
      }
    },
    { 
      icon: BookOpen, 
      label: "What's Next?", 
      action: () => {
        const nextMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: "what should I learn next?",
          timestamp: new Date()
        };
        addMessageToCurrentTab(nextMessage);
      }
    },
    { 
      icon: Award, 
      label: "Review Concepts", 
      action: handleStartReview
    }
  ];

  return (
    <div className="flex flex-col min-h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-900">AI Tutor</h2>
            <p className="text-sm text-gray-600">Your personal learning assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {messageState.error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-sm text-red-500 bg-red-50 px-2 py-1 rounded-md"
            >
              <span>Connection issue</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* Clear error if needed */}}
                className="ml-2 h-4 w-4 p-0 text-red-500 hover:text-red-700"
              >
                ×
              </Button>
            </motion.div>
          )}
          {isPending && !messageState.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center text-sm text-gray-500"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              AI is thinking...
            </motion.div>
          )}
          <Badge variant="secondary" className={messageState.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
            {messageState.error ? "Reconnecting..." : "Online"}
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
            <ScrollArea className="flex-1 p-6 h-0">
              <div className="space-y-6">
                <AnimatePresence>
                  {tabMessages[tab].map((message) => (
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
                          <Card className={`${message.type === 'user' ? 'bg-green-500 text-white border-2 border-green-400' : 'bg-gray-50'} shadow-sm`}>
                            <CardContent className="p-3">
                              <p className="text-sm leading-relaxed">{message.content}</p>
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
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area with new MessageInputWithActions */}
            <div className="border-t bg-gray-50 p-4 flex-shrink-0">
              <MessageInputWithActions
                activeTab={activeTab}
                placeholder="Ask me anything..."
                quickActions={quickActions}
                disabled={isPending}
                className="w-full"
                onMessageSent={(message) => {
                  // Add user message to current tab immediately
                  const userMessage: ChatMessage = {
                    id: Date.now().toString(),
                    type: 'user',
                    content: message,
                    timestamp: new Date()
                  };
                  addMessageToCurrentTab(userMessage);
                }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AITutorChatWithActions;