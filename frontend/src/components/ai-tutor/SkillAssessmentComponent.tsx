// frontend/src/components/ai-tutor/SkillAssessmentComponent.tsx
"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export interface SkillAssessment {
  skill: string
  level: number
}

interface SkillAssessmentComponentProps {
  onComplete: (skills: SkillAssessment[]) => void;
}

export const SkillAssessmentComponent: React.FC<SkillAssessmentComponentProps> = ({ onComplete }) => {
  const [skills, setSkills] = useState<SkillAssessment[]>([
    { skill: 'HTML/CSS', level: 3 },
    { skill: 'JavaScript', level: 2 },
    { skill: 'React', level: 1 },
    { skill: 'TypeScript', level: 1 },
    { skill: 'Node.js', level: 1 }
  ])

  const updateSkillLevel = (index: number, level: number) => {
    const newSkills = [...skills]
    newSkills[index].level = level
    setSkills(newSkills)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Rate Your Current Skills</h3>
        <p className="text-sm text-muted-foreground">
          Help me understand your current level so I can personalize your learning journey
        </p>
      </div>

      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={skill.skill} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{skill.skill}</span>
              <span className="text-xs text-muted-foreground">
                {skill.level === 1 ? 'Beginner' : skill.level === 2 ? 'Some Experience' : skill.level === 3 ? 'Intermediate' : skill.level === 4 ? 'Advanced' : 'Expert'}
              </span>
            </div>
            <Slider
              value={[skill.level]}
              onValueChange={(value) => updateSkillLevel(index, value[0])}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <Button onClick={() => onComplete(skills)} className="w-full">
        Continue Assessment
      </Button>
    </div>
  )
}
