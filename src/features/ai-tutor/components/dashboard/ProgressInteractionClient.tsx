'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { UserProgress } from '../../queries';

interface ProgressInteractionClientProps {
  track: UserProgress;
}

// Client Component for progress interactions (animations, hover effects, etc.)
export function ProgressInteractionClient({ track }: ProgressInteractionClientProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleTrackAction = () => {
    if (track.status === 'active') {
      // Continue learning
      router.push(`/ai-tutor/tracks/${track.trackId}/continue`);
    } else if (track.status === 'paused') {
      // Resume learning
      router.push(`/ai-tutor/tracks/${track.trackId}/resume`);
    } else {
      // Start learning
      router.push(`/ai-tutor/tracks/${track.trackId}/start`);
    }

    // Track analytics
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'track_action', {
        event_category: 'learning',
        event_label: track.trackName,
        track_id: track.trackId,
        action_type: track.status === 'active' ? 'continue' : track.status === 'paused' ? 'resume' : 'start'
      });
    }
  };

  const getActionText = () => {
    switch (track.status) {
      case 'active': return 'Continue';
      case 'paused': return 'Resume';
      case 'planned': return 'Start';
      case 'completed': return 'Review';
      default: return 'Start';
    }
  };

  const getActionIcon = () => {
    switch (track.status) {
      case 'active': return ArrowRight;
      case 'paused': return Play;
      case 'planned': return Play;
      case 'completed': return ArrowRight;
      default: return Play;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Track action button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleTrackAction}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <span>{getActionText()}</span>
          <motion.div
            animate={{ x: isHovered ? 2 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ActionIcon className="w-4 h-4 ml-1" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Track options - only visible on hover */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          height: isHovered ? 'auto' : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            // Show track options menu
            console.log('Show track options for:', track.trackName);
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Separate component for the continue learning button
export function ContinueLearningButton() {
  const router = useRouter();

  const handleContinueLearning = () => {
    router.push('/ai-tutor/dashboard');
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'continue_learning_clicked', {
        event_category: 'navigation',
        event_label: 'progress_dashboard'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        onClick={handleContinueLearning} 
        size="default"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Continue Learning
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <ArrowRight className="w-5 h-5 ml-2" />
        </motion.div>
      </Button>
    </motion.div>
  );
};