// frontend/src/components/ai-tutor/ProgressDashboardComponent.tsx
"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Award, CheckCircle, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ProgressDashboardComponentProps {
  onContinueLearning: () => void;
  onSelectTrack: (trackName: string) => void;
}

export const ProgressDashboardComponent: React.FC<ProgressDashboardComponentProps> = ({
  onContinueLearning,
  onSelectTrack,
}) => {
  const tracks = [
    { name: 'Frontend Development', progress: 65, status: 'active' as 'active' | 'paused' | 'planned' },
    { name: 'UX/UI Design', progress: 30, status: 'paused' as 'active' | 'paused' | 'planned' },
    { name: 'Backend Development', progress: 0, status: 'planned' as 'active' | 'paused' | 'planned' }
  ];

  const achievements = [
    { id: '1', text: 'Completed React Basics', icon: <CheckCircle className="w-3 h-3 text-green-500" /> },
    { id: '2', text: 'Perfect score on JavaScript Quiz', icon: <Star className="w-3 h-3 text-yellow-500" /> },
  ];

  return (
    <div className="space-y-3 max-w-md">
      <h3 className="text-base font-semibold text-foreground">Your Learning Progress</h3>

      <div className="space-y-3">
        {tracks.map((track, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelectTrack(track.name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-xs">{track.name}</span>
                  <Badge
                    variant={track.status === 'active' ? 'default' : track.status === 'paused' ? 'secondary' : 'outline'}
                    className="text-xs px-1 py-0"
                  >
                    {track.status}
                  </Badge>
                </div>
                <Progress value={track.progress} className="mb-1 h-1" />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{track.progress}% complete</span>
                  {track.status === 'active' && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      On track
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-xs">Recent Achievements</span>
          </div>
          <div className="space-y-1">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-2 text-xs">
                {achievement.icon}
                <span>{achievement.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={onContinueLearning} className="w-full" size="sm">
        Continue Learning
        <ArrowRight className="w-3 h-3 ml-2" />
      </Button>
    </div>
  );
};
