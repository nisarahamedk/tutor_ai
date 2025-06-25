'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronRight, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { SkillAssessmentData } from '../../queries';

interface AssessmentClientProps {
  assessment: SkillAssessmentData;
}

// Client Component for assessment interactions (animations, hover effects, etc.)
export function AssessmentClient({ assessment }: AssessmentClientProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const handleStartAssessment = async () => {
    setIsStarting(true);
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'assessment_started', {
        event_category: 'learning',
        event_label: assessment.title,
        assessment_id: assessment.id,
        assessment_difficulty: assessment.difficulty
      });
    }

    // Simulate brief loading to show state change
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Navigate to assessment
    router.push(`/ai-tutor/assessment/${assessment.id}`);
  };

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Assessment stats - Only visible on hover for better UX */}
      <motion.div
        className="grid grid-cols-2 gap-3 text-xs text-muted-foreground"
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          height: isHovered ? 'auto' : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>1.2k taken</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>4.9 rating</span>
        </div>
      </motion.div>

      {/* Start Assessment Button with Animation */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleStartAssessment}
          disabled={isStarting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="default"
        >
          {isStarting ? (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Starting...</span>
            </motion.div>
          ) : (
            <motion.div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>Start Assessment</span>
              <motion.div
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Preview button - only visible on hover */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isHovered && !isStarting ? 1 : 0, 
          height: isHovered && !isStarting ? 'auto' : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            // Show preview modal or navigate to preview
            console.log('Show preview for:', assessment.title);
          }}
        >
          Preview Questions
        </Button>
      </motion.div>

      {/* Progress indicator if user has started this assessment */}
      {/* This would be populated from user progress data in a real app */}
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }} // Hidden for now, would show if user has progress
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">0%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <motion.div
            className="bg-primary h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '0%' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}