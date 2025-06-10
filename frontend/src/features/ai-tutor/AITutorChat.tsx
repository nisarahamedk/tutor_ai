// frontend/src/features/ai-tutor/AITutorChat.tsx
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
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // TabsContent might not be directly used here if content is managed by messages
import { ScrollArea } from '@/components/ui/scroll-area';

// Import previously created components
import { HomePageComponent } from '@/components/ai-tutor/HomePageComponent';
import { TrackExplorationComponent, LearningTrack } from '@/components/ai-tutor/TrackExplorationComponent';
import { SkillAssessmentComponent, SkillAssessment } from '@/components/ai-tutor/SkillAssessmentComponent';
import { LearningPreferencesComponent } from '@/components/ai-tutor/LearningPreferencesComponent';
import { InteractiveLessonComponent } from '@/components/ai-tutor/InteractiveLessonComponent';
import { ProgressDashboardComponent } from '@/components/ai-tutor/ProgressDashboardComponent';
import { FlashcardReviewComponent } from '@/components/ai-tutor/FlashcardReviewComponent';

export interface Message { // Ensure this is exported
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
}

export const AITutorChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI tutor. I'm here to help you learn and grow in tech. What would you like to explore today?",
      timestamp: new Date(),
      component: <HomePageComponent onStartNewTrack={() => handleStartNewTrack()} onContinueLearning={() => handleContinueLearning()} onStartReview={() => handleStartReview()} />
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<'home' | 'exploration' | 'assessment' | 'preferences' | 'learning' | 'progress'>('home');
  const [activeTab, setActiveTab] = useState('home');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Handler functions from twentyfirstdev.js ---
  const handleStartNewTrack = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great! Let's find a new learning track for you.",
      timestamp: new Date(),
      component: <TrackExplorationComponent onTrackSelect={(track) => handleTrackSelect(track)} />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('exploration');
    setActiveTab('explore');
  };

  const handleContinueLearning = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Welcome back! Here's your current progress. Let's continue where you left off.",
      timestamp: new Date(),
      component: <ProgressDashboardComponent
        onContinueLearning={() => handleContinueFromProgress()}
        onSelectTrack={(trackName) => handleSelectTrackFromProgress(trackName)}
      />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('progress');
    setActiveTab('progress');
  };

  const handleStartReview = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great choice! Let's review some key concepts with flashcards. This uses spaced repetition to help cement your knowledge.",
      timestamp: new Date(),
      component: <FlashcardReviewComponent onComplete={() => handleReviewComplete()} />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('learning'); // Or a dedicated 'review' step if preferred
    setActiveTab('review');
  };

  const handleReviewComplete = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Excellent work! You've completed your flashcard review. What would you like to do next?",
      timestamp: new Date(),
      component: <HomePageComponent onStartNewTrack={handleStartNewTrack} onContinueLearning={handleContinueLearning} onStartReview={handleStartReview} />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('home');
    setActiveTab('home');
  };

  const handleContinueFromProgress = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Alright, let's jump back into your interactive lesson!",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('learning');
  };

  const handleSelectTrackFromProgress = (trackName: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `I want to continue with ${trackName}`,
      timestamp: new Date()
    };
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Great! Let's continue with your ${trackName} track. Here's your next lesson:`,
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    setMessages(prev => [...prev, userMessage, aiResponse]);
    setCurrentStep('learning');
  };

  const handleTrackSelect = (track: LearningTrack) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `I'm interested in ${track.title}`,
      timestamp: new Date()
    };
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Great choice! ${track.title} is an excellent path. Let me assess your current skills to personalize your learning journey.`,
      timestamp: new Date(),
      component: <SkillAssessmentComponent onComplete={handleSkillAssessmentComplete} />
    };
    setMessages(prev => [...prev, userMessage, aiResponse]);
    setCurrentStep('assessment');
  };

  const handleSkillAssessmentComplete = (skills: SkillAssessment[]) => {
    // Log assessment for now
    console.log("Skill Assessment Completed:", skills);
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Perfect! Now let's understand your learning preferences and goals to create the best experience for you.",
      timestamp: new Date(),
      component: <LearningPreferencesComponent onComplete={handlePreferencesComplete} />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('preferences');
  };

  const handlePreferencesComplete = (preferences: any) => {
    // Log preferences for now
    console.log("Learning Preferences Completed:", preferences);
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Excellent! I've created a personalized learning plan for you. Let's start with your first interactive lesson!",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    };
    setMessages(prev => [...prev, aiResponse]);
    setCurrentStep('learning');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    // Simulate AI response (mock API call)
    setTimeout(() => {
      let aiResponse: Message;
      // Basic keyword-based responses for now
      if (currentInput.toLowerCase().includes('progress')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Here's your current learning progress across all tracks:",
          timestamp: new Date(),
          component: <ProgressDashboardComponent
            onContinueLearning={handleContinueFromProgress}
            onSelectTrack={handleSelectTrackFromProgress}
          />
        };
        setCurrentStep('progress');
        setActiveTab('progress');
      } else if (currentInput.toLowerCase().includes('help')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "I'm here to help! What specific problem are you facing or what concept do you need clarification on?",
          timestamp: new Date()
        };
      } else if (currentInput.toLowerCase().includes('next')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Based on your progress, your next step is to dive deeper into React Hooks. Would you like to start that lesson now?",
          timestamp: new Date(),
          component: <InteractiveLessonComponent /> // Example: direct to a lesson
        };
        setCurrentStep('learning');
      } else if (currentInput.toLowerCase().includes('review') || currentInput.toLowerCase().includes('flashcard')) {
         aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Perfect! Let's start a flashcard review session to reinforce your learning:",
          timestamp: new Date(),
          component: <FlashcardReviewComponent onComplete={handleReviewComplete} />
        };
        setCurrentStep('learning'); // or 'review'
        setActiveTab('review');
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I received your message: "${currentInput}". How can I assist you further?`,
          timestamp: new Date()
        };
      }
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const createAiMessageWithComponent = (content: string, component: React.ReactNode) => {
    const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: content,
        timestamp: new Date(),
        component: component,
    };
    setMessages(prev => [...prev, aiMessage]);
  };


  // --- JSX Structure ---
  return (
    <div className="flex flex-col h-[700px] max-h-[80vh] w-full max-w-2xl mx-auto bg-background border border-border rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground">AI Tutor</h2>
          <p className="text-xs text-muted-foreground">Your personal learning assistant</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent px-0">
            <TabsTrigger
              value="home"
              className="flex-1 flex items-center justify-center gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
              onClick={() => {
                setActiveTab('home');
                createAiMessageWithComponent("Welcome back to the Home screen! What would you like to do?", <HomePageComponent onStartNewTrack={handleStartNewTrack} onContinueLearning={handleContinueLearning} onStartReview={handleStartReview} />);
                setCurrentStep('home');
              }}
            >
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex-1 flex items-center justify-center gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
              onClick={() => {
                setActiveTab('progress');
                handleContinueLearning(); // This already creates a message with ProgressDashboardComponent
              }}
            >
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="flex-1 flex items-center justify-center gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
              onClick={() => {
                setActiveTab('review');
                handleStartReview(); // This already creates a message with FlashcardReviewComponent
              }}
            >
              <Brain className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger
              value="explore"
              className="flex-1 flex items-center justify-center gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
              onClick={() => {
                setActiveTab('explore');
                handleStartNewTrack(); // This already creates a message with TrackExplorationComponent
              }}
            >
              <BookOpen className="w-4 h-4" />
              Explore
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className={`flex gap-3 items-end ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <Avatar className="w-8 h-8 self-start">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg p-3 text-sm shadow-md ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  {message.component && (
                    <div className="mt-2 w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-md">
                      {message.component}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.type === 'user' && (
                  <Avatar className="w-8 h-8 self-start">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1"
            aria-label="Chat input"
          />
          <Button onClick={handleSendMessage} size="icon" aria-label="Send message">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => { setActiveTab('progress'); handleContinueLearning(); }}>
            <TrendingUp className="w-3 h-3 mr-1.5" /> Show Progress
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputValue("I need help with this lesson")}>
            Get Help
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputValue("What should I learn next?")}>
            What's Next?
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setActiveTab('review'); handleStartReview(); }}>
            <RotateCcw className="w-3 h-3 mr-1.5" /> Review Concepts
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export default for page usage or if it's the main feature component
export default AITutorChat;
