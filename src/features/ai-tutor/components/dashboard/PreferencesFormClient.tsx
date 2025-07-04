'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Code, BookOpen, Target, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import type { LearningPreferences } from '../../queries';

interface PreferencesFormClientProps {
  isOnboarding: boolean;
  initialPreferences?: LearningPreferences;
}

// Client Component for preferences form interactions
export function PreferencesFormClient({ isOnboarding, initialPreferences }: PreferencesFormClientProps) {
  const [isEditing, setIsEditing] = useState(isOnboarding);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [timeAvailability, setTimeAvailability] = useState([
    initialPreferences?.timeAvailability || 10
  ]);
  const [learningStyle, setLearningStyle] = useState<string>(
    initialPreferences?.learningStyle || ''
  );
  const [goals, setGoals] = useState<string[]>(
    initialPreferences?.goals || []
  );

  const learningStyles = [
    { 
      id: 'visual', 
      title: 'Visual Learner', 
      description: 'Learn best with diagrams, videos, and visual aids', 
      icon: <Lightbulb className="w-5 h-5" /> 
    },
    { 
      id: 'hands-on', 
      title: 'Hands-on Learner', 
      description: 'Prefer coding exercises and practical projects', 
      icon: <Code className="w-5 h-5" /> 
    },
    { 
      id: 'reading', 
      title: 'Reading/Writing', 
      description: 'Learn through documentation and written materials', 
      icon: <BookOpen className="w-5 h-5" /> 
    }
  ];

  const goalOptions = [
    'Get a job as a developer',
    'Build personal projects',
    'Advance in current role',
    'Start a tech business',
    'Learn for fun',
    'Switch careers',
    'Improve existing skills',
    'Freelance development'
  ];

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Track analytics
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'preferences_updated', {
        event_category: 'user_profile',
        event_label: isOnboarding ? 'onboarding' : 'settings_update',
        learning_style: learningStyle,
        time_availability: timeAvailability[0],
        goals_count: goals.length
      });
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSaving(false);
    setIsEditing(false);

    if (isOnboarding) {
      // Redirect to getting started or track selection
      router.push('/ai-tutor/explore');
    } else {
      // Show success message or refresh data
      console.log('Preferences updated successfully');
    }
  };

  const isFormValid = learningStyle && goals.length > 0;

  if (!isEditing && !isOnboarding) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Preferences
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Time Availability Section */}
      <div className="space-y-4">
        <label className="text-sm font-medium block">
          How many hours per week can you dedicate to learning?
        </label>
        <div className="space-y-2">
          <Slider
            value={timeAvailability}
            onValueChange={setTimeAvailability}
            max={40}
            min={1}
            step={1}
            className="w-full"
          />
          <motion.div 
            className="text-center text-sm text-muted-foreground"
            key={timeAvailability[0]}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {timeAvailability[0]} hours per week
          </motion.div>
        </div>
      </div>

      {/* Learning Style Section */}
      <div className="space-y-4">
        <label className="text-sm font-medium block">What&apos;s your learning style?</label>
        <div className="grid gap-3">
          {learningStyles.map((style) => (
            <motion.div
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-colors ${
                  learningStyle === style.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setLearningStyle(style.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-0.5">{style.icon}</div>
                    <div>
                      <h4 className="font-medium text-sm">{style.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                    </div>
                    {learningStyle === style.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-4">
        <label className="text-sm font-medium block">
          What are your goals? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {goalOptions.map((goal) => (
            <motion.div
              key={goal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={goals.includes(goal) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGoal(goal)}
                className="justify-start h-auto p-3 w-full text-left"
              >
                <Target className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{goal}</span>
              </Button>
            </motion.div>
          ))}
        </div>
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-muted-foreground"
          >
            {goals.length} goal{goals.length !== 1 ? 's' : ''} selected
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </motion.div>
            ) : (
              <motion.div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>
                  {isOnboarding ? 'Start My Learning Journey' : 'Save Preferences'}
                </span>
              </motion.div>
            )}
          </Button>
        </motion.div>
        
        {!isOnboarding && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Form validation hint */}
      {!isFormValid && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground text-center"
        >
          Please select a learning style and at least one goal to continue
        </motion.div>
      )}
    </motion.div>
  );
}