// src/components/ai-tutor/TrackExplorationComponent.tsx
"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Code, Palette, Database, Smartphone, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface LearningTrack {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  skills: string[]
}

interface TrackExplorationComponentProps {
  onTrackSelect: (track: LearningTrack) => void;
}

export const TrackExplorationComponent: React.FC<TrackExplorationComponentProps> = ({ onTrackSelect }) => {
  const tracks: LearningTrack[] = [
    {
      id: '1',
      title: 'Frontend Development',
      description: 'Master React, TypeScript, and modern web development',
      icon: <Code className="w-6 h-6" />,
      progress: 0,
      difficulty: 'Beginner',
      duration: '12 weeks',
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript']
    },
    {
      id: '2',
      title: 'UX/UI Design',
      description: 'Learn user experience design and interface creation',
      icon: <Palette className="w-6 h-6" />,
      progress: 0,
      difficulty: 'Beginner',
      duration: '10 weeks',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping']
    },
    {
      id: '3',
      title: 'Backend Development',
      description: 'Build scalable server-side applications',
      icon: <Database className="w-6 h-6" />,
      progress: 0,
      difficulty: 'Intermediate',
      duration: '14 weeks',
      skills: ['Node.js', 'APIs', 'Databases', 'Authentication']
    },
    {
      id: '4',
      title: 'Mobile Development',
      description: 'Create native and cross-platform mobile apps',
      icon: <Smartphone className="w-6 h-6" />,
      progress: 0,
      difficulty: 'Intermediate',
      duration: '16 weeks',
      skills: ['React Native', 'Flutter', 'iOS', 'Android']
    }
  ]

  return (
    <div className="space-y-4 max-w-full">
      <h3 className="text-lg font-semibold text-foreground">Choose Your Learning Path</h3>
      <div className="grid grid-cols-1 gap-3">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer border-border hover:border-primary/50 transition-colors"
              onClick={() => onTrackSelect(track)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {track.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{track.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {track.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {track.duration}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{track.description}</p>
                <div className="flex flex-wrap gap-1">
                  {track.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {track.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{track.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
