// frontend/src/components/ai-tutor/FlashcardReviewComponent.tsx
"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Flashcard {
  question: string;
  answer: string;
  track: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface FlashcardReviewComponentProps {
  onComplete: () => void;
}

export const FlashcardReviewComponent: React.FC<FlashcardReviewComponentProps> = ({ onComplete }) => {
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewedCards, setReviewedCards] = useState(0)

  // Hardcoded flashcards for now
  const flashcards: Flashcard[] = [
    {
      question: "What is a React Hook?",
      answer: "A Hook is a special function that lets you 'hook into' React features. They let you use state and other React features without writing a class.",
      track: "Frontend Development",
      difficulty: "Easy"
    },
    {
      question: "What is the difference between let and const in JavaScript?",
      answer: "let allows you to reassign the variable, while const creates a read-only reference. Both are block-scoped.",
      track: "Frontend Development",
      difficulty: "Easy"
    },
    {
      question: "What is the purpose of useEffect in React?",
      answer: "useEffect lets you perform side effects in function components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount combined.",
      track: "Frontend Development",
      difficulty: "Medium"
    }
  ];

  const handleNext = (difficultyChoice: 'easy' | 'medium' | 'hard') => {
    // In a real app, this choice would affect spaced repetition logic
    console.log(`Card difficulty rated: ${difficultyChoice}`);
    setReviewedCards(prev => prev + 1);
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(prev => prev + 1);
      setShowAnswer(false);
    } else {
      onComplete();
    }
  };

  const progress = ((reviewedCards) / flashcards.length) * 100;

  if (flashcards.length === 0) {
    return (
        <div className="space-y-4 max-w-md text-center">
            <h3 className="text-lg font-semibold">Flashcard Review</h3>
            <p>No flashcards available for review at the moment.</p>
            <Button onClick={onComplete}>Back to Home</Button>
        </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flashcard Review</h3>
        <Badge variant="secondary">{currentCard + 1} of {flashcards.length}</Badge>
      </div>

      <Progress value={progress} className="w-full" />

      <Card className="min-h-[200px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {flashcards[currentCard].track}
            </Badge>
            <Badge
              variant={flashcards[currentCard].difficulty === 'Easy' ? 'secondary' : flashcards[currentCard].difficulty === 'Medium' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {flashcards[currentCard].difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
          <div className="text-center">
            <h4 className="font-medium mb-4">
              {showAnswer ? 'Answer:' : 'Question:'}
            </h4>
            <p className="text-sm">
              {showAnswer ? flashcards[currentCard].answer : flashcards[currentCard].question}
            </p>
          </div>

          {!showAnswer ? (
            <Button
              onClick={() => setShowAnswer(true)}
              className="w-full mt-auto"
              variant="outline"
            >
              Show Answer
            </Button>
          ) : (
            <div className="space-y-2 mt-auto">
              <p className="text-xs text-center text-muted-foreground">How well did you know this?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleNext('hard')}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  Hard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleNext('medium')}
                  className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
                >
                  Medium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleNext('easy')}
                  className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                >
                  Easy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
