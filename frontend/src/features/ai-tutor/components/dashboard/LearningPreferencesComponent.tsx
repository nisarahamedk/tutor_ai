// frontend/src/components/ai-tutor/LearningPreferencesComponent.tsx
"use client"

import React, { useState } from 'react'
import { Lightbulb, Code, BookOpen, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'

interface LearningPreferencesComponentProps {
  onComplete: (preferences: any) => void;
}

export const LearningPreferencesComponent: React.FC<LearningPreferencesComponentProps> = ({ onComplete }) => {
  const [timeAvailability, setTimeAvailability] = useState([10])
  const [learningStyle, setLearningStyle] = useState<string>('')
  const [goals, setGoals] = useState<string[]>([])

  const learningStyles = [
    { id: 'visual', title: 'Visual Learner', description: 'Learn best with diagrams, videos, and visual aids', icon: <Lightbulb className="w-5 h-5" /> },
    { id: 'hands-on', title: 'Hands-on Learner', description: 'Prefer coding exercises and practical projects', icon: <Code className="w-5 h-5" /> },
    { id: 'reading', title: 'Reading/Writing', description: 'Learn through documentation and written materials', icon: <BookOpen className="w-5 h-5" /> }
  ]

  const goalOptions = [
    'Get a job as a developer',
    'Build personal projects',
    'Advance in current role',
    'Start a tech business',
    'Learn for fun'
  ]

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Learning Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Let's customize your learning experience
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
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
            <div className="text-center text-sm text-muted-foreground">
              {timeAvailability[0]} hours per week
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">What's your learning style?</label>
          <div className="grid gap-3">
            {learningStyles.map((style) => (
              <Card
                key={style.id}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">What are your goals? (Select all that apply)</label>
          <div className="grid gap-2">
            {goalOptions.map((goal) => (
              <Button
                key={goal}
                variant={goals.includes(goal) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGoal(goal)}
                className="justify-start h-auto p-3"
              >
                <Target className="w-4 h-4 mr-2" />
                {goal}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={() => onComplete({ timeAvailability: timeAvailability[0], learningStyle, goals })}
        className="w-full"
        disabled={!learningStyle || goals.length === 0}
      >
        Start My Learning Journey
      </Button>
    </div>
  )
}
