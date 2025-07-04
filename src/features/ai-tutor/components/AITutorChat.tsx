"use client"

import React, { useState, useRef, useEffect } from 'react';
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

// Import previously created components - using direct imports to avoid circular dependencies
import { TrackExplorationComponent } from './learning/TrackExplorationComponent';
import { InteractiveLessonComponent } from './learning/InteractiveLessonComponent';
import { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
import { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
}

type TabType = 'home' | 'progress' | 'review' | 'explore';

// Tab-specific initial messages
const getInitialMessages = (tab: TabType): Message[] => {
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

export const AITutorChat: React.FC = () => {
  // Separate message states for each tab
  const [tabMessages, setTabMessages] = useState<Record<TabType, Message[]>>({
    home: getInitialMessages('home'),
    progress: getInitialMessages('progress'),
    review: getInitialMessages('review'),
    explore: getInitialMessages('explore'),
  });
  
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current tab's messages
  const currentMessages = tabMessages[activeTab];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeTab]);


  // Add message to current tab
  const addMessageToCurrentTab = (message: Message) => {
    setTabMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], message]
    }));
  };

  // Handler functions




  const handleContinueLearning = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Welcome back! Let's continue where you left off:",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleStartReview = () => {
    const newMessage: Message = {
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
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great job on the review! You're making excellent progress. What would you like to do next?",
      timestamp: new Date()
    };
    addMessageToCurrentTab(newMessage);
  };

  const handleShowProgress = () => {
    setIsLoading(true);
    setActiveTab('progress');
    
    setTimeout(() => {
      const newMessage: Message = {
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
      setIsLoading(false);
    }, 500);
  };

  const simulateAPICall = async (input: string): Promise<Message> => {
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Simulate 10% failure rate for testing
    if (Math.random() < 0.1 && retryCount < 2) {
      throw new Error('Network connection failed. Please try again.');
    }
    
    // Generate AI response based on input
    if (input.toLowerCase().includes('progress')) {
      throw new Error('Use progress button instead');
    } else if (input.toLowerCase().includes('help')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm here to help! What specific topic would you like assistance with?",
        timestamp: new Date()
      };
    } else if (input.toLowerCase().includes('review')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Let's start a review session:",
        timestamp: new Date(),
        component: <FlashcardReviewComponent onComplete={handleReviewComplete} />
      };
    } else {
      return {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I understand you're interested in that topic. Let me help you with personalized guidance based on your learning path.",
        timestamp: new Date()
      };
    }
  };

  const handleRetry = async (originalInput: string) => {
    if (retryCount >= 2) {
      setError('Unable to connect. Please check your connection and try again later.');
      setIsLoading(false);
      setIsTyping(false);
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    
    try {
      setIsTyping(true);
      const aiResponse = await simulateAPICall(originalInput);
      
      if (aiResponse.content.includes("review")) {
        setActiveTab('review');
      }
      
      addMessageToCurrentTab(aiResponse);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    addMessageToCurrentTab(userMessage);
    const currentInput = inputValue;
    setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      const aiResponse = await simulateAPICall(currentInput);
      
      if (aiResponse.content.includes("review")) {
        setActiveTab('review');
      }
      
      addMessageToCurrentTab(aiResponse);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      // Auto-retry for certain errors
      if (errorMessage.includes('Network') && retryCount < 2) {
        setTimeout(() => handleRetry(currentInput), 1500);
        return;
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const quickActions = [
    { 
      icon: Zap, 
      label: "Show Progress", 
      action: handleShowProgress,
      loading: isLoading && activeTab === 'progress'
    },
    { 
      icon: Target, 
      label: "Get Help", 
      action: () => {
        setInputValue("help");
        handleSendMessage();
      }
    },
    { 
      icon: BookOpen, 
      label: "What's Next?", 
      action: () => {
        setInputValue("what should I learn next?");
        handleSendMessage();
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
        {['home', 'progress', 'review', 'explore'].map((tab) => (
          <TabsContent key={tab} value={tab} className="flex-1 flex flex-col m-0 overflow-hidden">
            <ScrollArea className="flex-1 p-6 h-0">
              <div className="space-y-6">
                <AnimatePresence>
                  {tabMessages[tab as TabType].map((message) => (
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

            {/* Input Area */}
            <div className="border-t bg-gray-50 p-4 flex-shrink-0">
              <div className="flex items-center space-x-3 mb-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white border-gray-200 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50"
                  >
                    {action.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <action.icon className="h-4 w-4" />
                    )}
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

export default AITutorChat;