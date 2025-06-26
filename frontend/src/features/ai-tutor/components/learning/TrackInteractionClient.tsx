'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { LearningTrack } from './TrackExplorationComponent';

interface TrackInteractionClientProps {
  track: LearningTrack;
}

// Client Component for track interactions (animations, hover effects, etc.)
export function TrackInteractionClient({ track }: TrackInteractionClientProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleTrackSelect = () => {
    // Navigate to track detail page
    router.push(`/ai-tutor/tracks/${track.id}`);
    
    // Optional: Track analytics
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'track_selected', {
        event_category: 'learning',
        event_label: track.title,
        track_id: track.id,
        track_difficulty: track.difficulty
      });
    }
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
      {/* Track Stats - Only visible on hover for better UX */}
      <motion.div
        className="grid grid-cols-3 gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          height: isHovered ? 'auto' : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          <span>12 modules</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>2.3k learners</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>4.8 rating</span>
        </div>
      </motion.div>

      {/* Action Button with Animation */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleTrackSelect}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <span>Start Learning</span>
          <motion.div
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 ml-1" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Progress Indicator (if user has started this track) */}
      {track.progress > 0 && (
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{track.progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <motion.div
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${track.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}