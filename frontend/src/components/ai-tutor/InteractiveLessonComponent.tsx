// frontend/src/components/ai-tutor/InteractiveLessonComponent.tsx
"use client"

import React, { useState } from 'react'
import { Play, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { mockApi } from '../../../lib/api-mocks'; // Adjusted path for this component


export const InteractiveLessonComponent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0) // For future expansion to multiple steps
  const [userCode, setUserCode] = useState('function greet(name) {\n  // Your code here\n}')

  const steps = [
    {
      title: 'Understanding Functions',
      content: 'Functions are reusable blocks of code that perform specific tasks.',
      task: 'Complete the greet function to return "Hello, [name]!"'
    }
    // Add more steps here for a complete lesson
  ]

  const handleRunCode = async () => {
    const result = await mockApi.runCode(userCode);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert(`Output: ${result.output}`);
    }
    console.log(result);
  };

  const handleSubmitCode = async () => {
    // Assume a mock lessonId for now
    const lessonId = "jsFunctionsIntro";
    const result = await mockApi.submitCode(lessonId, userCode);
    alert(`Feedback: ${result.feedback}`);
    console.log(result);
    if (result.correct) {
      // Add logic to advance or show completion
      // For example, setCurrentStep(prev => prev + 1) if there's a next step
      alert("Correct! You can move to the next part of the lesson (if available).");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interactive Lesson: JavaScript Functions</h3>
        <Badge variant="secondary">Lesson 1 of 5</Badge> {/* Mocked lesson count */}
      </div>

      <Progress value={(currentStep + 1) / 5 * 100} className="w-full" /> {/* Mocked progress based on 5 steps */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{steps[currentStep].content}</p>

          <div className="space-y-2">
            <label htmlFor="code-editor" className="text-sm font-medium">Task: {steps[currentStep].task}</label>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <textarea
                id="code-editor"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                rows={6}
                spellCheck="false"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRunCode}>
              <Play className="w-4 h-4 mr-2" />
              Run Code
            </Button>
            <Button size="sm" onClick={handleSubmitCode}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
