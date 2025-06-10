// frontend/src/components/ai-tutor/HomePageComponent.tsx
"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, TrendingUp, Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button' // Assuming this is the correct path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // Assuming this is the correct path
import { Badge } from '@/components/ui/badge' // Assuming this is the correct path

interface HomePageComponentProps {
  onStartNewTrack: () => void;
  onContinueLearning: () => void;
  onStartReview: () => void;
}

export const HomePageComponent: React.FC<HomePageComponentProps> = ({
  onStartNewTrack,
  onContinueLearning,
  onStartReview,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Welcome to your AI Tutor!</h3>
      <p className="text-sm text-muted-foreground">
        I'm here to guide you on your learning journey. What would you like to do today?
      </p>

      <div className="grid grid-cols-1 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer border-border hover:border-primary/50 transition-colors"
            onClick={onStartNewTrack}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">Start a New Learning Track</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Explore new topics and begin a personalized learning path.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer border-border hover:border-primary/50 transition-colors"
            onClick={onContinueLearning}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">Continue My Learning</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Pick up where you left off and check your progress.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer border-border hover:border-primary/50 transition-colors"
            onClick={onStartReview}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm">Review & Practice</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      12 cards due
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Spaced repetition
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Review flashcards and reinforce your knowledge with spaced repetition.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
