// src/components/ai-tutor/ProgressDashboardComponent.tsx
"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Award, CheckCircle, Star, ArrowRight, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProgressDashboardComponentProps {
  onContinueLearning: () => void;
  onSelectTrack: (trackName: string) => void;
}

export const ProgressDashboardComponent: React.FC<ProgressDashboardComponentProps> = ({
  onContinueLearning,
  onSelectTrack,
}) => {
  const tracks = [
    { 
      name: 'Frontend Development', 
      progress: 65, 
      status: 'active' as 'active' | 'paused' | 'planned',
      timeSpent: '24h 30m',
      nextLesson: 'React Hooks Deep Dive'
    },
    { 
      name: 'UX/UI Design', 
      progress: 30, 
      status: 'paused' as 'active' | 'paused' | 'planned',
      timeSpent: '8h 15m',
      nextLesson: 'Design Systems'
    },
    { 
      name: 'Backend Development', 
      progress: 0, 
      status: 'planned' as 'active' | 'paused' | 'planned',
      timeSpent: '0h',
      nextLesson: 'Node.js Fundamentals'
    }
  ];

  const achievements = [
    { id: '1', text: 'Completed React Basics', icon: <CheckCircle className="w-4 h-4 text-green-500" />, date: '2 days ago' },
    { id: '2', text: 'Perfect score on JavaScript Quiz', icon: <Star className="w-4 h-4 text-yellow-500" />, date: '1 week ago' },
    { id: '3', text: 'Finished CSS Flexbox Module', icon: <Target className="w-4 h-4 text-blue-500" />, date: '2 weeks ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'planned': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto space-y-4 overflow-hidden"
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Your Learning Progress</h3>
        <p className="text-sm text-gray-600">Track your journey across all learning paths</p>
      </div>

      {/* Learning Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {tracks.map((track, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 h-full"
              onClick={() => onSelectTrack(track.name)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                    {track.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(track.status)}`} />
                    <Badge
                      variant={track.status === 'active' ? 'default' : track.status === 'paused' ? 'secondary' : 'outline'}
                      className="text-xs capitalize"
                    >
                      {track.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 pb-3">
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{track.progress}% complete</span>
                      {track.status === 'active' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium">On track</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className={`h-2 rounded-full ${getProgressColor(track.progress)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${track.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time and Next Lesson */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{track.timeSpent} spent</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Next: </span>
                      <span>{track.nextLesson}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm"
                >
                  {achievement.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {achievement.text}
                    </p>
                    <p className="text-xs text-gray-500">{achievement.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex justify-center mt-4"
      >
        <Button 
          onClick={onContinueLearning} 
          size="default"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continue Learning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
};