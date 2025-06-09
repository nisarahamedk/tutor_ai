"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  BookOpen, 
  Target, 
  Calendar, 
  Clock, 
  Star, 
  Play, 
  CheckCircle, 
  TrendingUp,
  Lightbulb,
  Award,
  ChevronRight,
  Palette,
  Database,
  Smartphone,
  Home,
  ArrowRight,
  RotateCcw,
  Brain,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  component?: React.ReactNode
}

interface LearningTrack {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  skills: string[]
}

interface SkillAssessment {
  skill: string
  level: number
}

const TrackExplorationComponent = ({ onTrackSelect }: { onTrackSelect: (track: LearningTrack) => void }) => {
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

const SkillAssessmentComponent = ({ onComplete }: { onComplete: (skills: SkillAssessment[]) => void }) => {
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

const LearningPreferencesComponent = ({ onComplete }: { onComplete: (preferences: any) => void }) => {
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

const InteractiveLessonComponent = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [userCode, setUserCode] = useState('function greet(name) {\n  // Your code here\n}')

  const steps = [
    {
      title: 'Understanding Functions',
      content: 'Functions are reusable blocks of code that perform specific tasks.',
      task: 'Complete the greet function to return "Hello, [name]!"'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interactive Lesson: JavaScript Functions</h3>
        <Badge variant="secondary">Lesson 1 of 5</Badge>
      </div>
      
      <Progress value={20} className="w-full" />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{steps[currentStep].content}</p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Task: {steps[currentStep].task}</label>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none"
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Run Code
            </Button>
            <Button size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ProgressDashboardComponent = ({ onContinueLearning, onSelectTrack }: { onContinueLearning: () => void, onSelectTrack: (trackName: string) => void }) => {
  const tracks = [
    { name: 'Frontend Development', progress: 65, status: 'active' },
    { name: 'UX/UI Design', progress: 30, status: 'paused' },
    { name: 'Backend Development', progress: 0, status: 'planned' }
  ]

  return (
    <div className="space-y-3 max-w-md">
      <h3 className="text-base font-semibold">Your Learning Progress</h3>
      
      <div className="space-y-3">
                {tracks.map((track, index) => (
          <Card 
            key={index} 
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
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-xs">Recent Achievements</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Completed React Basics</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>Perfect score on JavaScript Quiz</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onContinueLearning} className="w-full" size="sm">
        Continue Learning
        <ArrowRight className="w-3 h-3 ml-2" />
      </Button>
    </div>
  )
}

const FlashcardReviewComponent = ({ onComplete }: { onComplete: () => void }) => {
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewedCards, setReviewedCards] = useState(0)

  const flashcards = [
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
  ]

  const handleNext = (difficulty: 'easy' | 'medium' | 'hard') => {
    setReviewedCards(prev => prev + 1)
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(prev => prev + 1)
      setShowAnswer(false)
    } else {
      onComplete()
    }
  }

  const progress = ((reviewedCards) / flashcards.length) * 100

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flashcard Review</h3>
        <Badge variant="secondary">{currentCard + 1} of {flashcards.length}</Badge>
      </div>
      
      <Progress value={progress} className="w-full" />
      
      <Card className="min-h-[200px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {flashcards[currentCard].track}
            </Badge>
            <Badge 
              variant={flashcards[currentCard].difficulty === 'Easy' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {flashcards[currentCard].difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="w-full"
              variant="outline"
            >
              Show Answer
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">How well did you know this?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNext('hard')}
                  className="text-red-600 border-red-200"
                >
                  Hard
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNext('medium')}
                  className="text-yellow-600 border-yellow-200"
                >
                  Medium
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNext('easy')}
                  className="text-green-600 border-green-200"
                >
                  Easy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const HomePageComponent = ({ onStartNewTrack, onContinueLearning, onStartReview }: { onStartNewTrack: () => void, onContinueLearning: () => void, onStartReview: () => void }) => {
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

const AITutorChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI tutor. I'm here to help you learn and grow in tech. What would you like to explore today?",
      timestamp: new Date(),
            component: <HomePageComponent onStartNewTrack={() => handleStartNewTrack()} onContinueLearning={() => handleContinueLearning()} onStartReview={() => handleStartReview()} />
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [currentStep, setCurrentStep] = useState<'home' | 'exploration' | 'assessment' | 'preferences' | 'learning' | 'progress'>('home')
  const [activeTab, setActiveTab] = useState('home')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartNewTrack = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great! Let's find a new learning track for you.",
      timestamp: new Date(),
      component: <TrackExplorationComponent onTrackSelect={(track) => handleTrackSelect(track)} />
    }
    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('exploration')
  }

    const handleContinueLearning = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Welcome back! Here's your current progress. Let's continue where you left off.",
      timestamp: new Date(),
      component:       <ProgressDashboardComponent 
        onContinueLearning={() => handleContinueFromProgress()} 
        onSelectTrack={(trackName) => handleSelectTrackFromProgress(trackName)}
      />
    }
    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('progress')
  }

  const handleStartReview = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Great choice! Let's review some key concepts with flashcards. This uses spaced repetition to help cement your knowledge.",
      timestamp: new Date(),
      component: <FlashcardReviewComponent onComplete={() => handleReviewComplete()} />
    }
    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('learning')
  }

  const handleReviewComplete = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Excellent work! You've completed your flashcard review. Regular review sessions like this will help strengthen your long-term retention. What would you like to do next?",
      timestamp: new Date(),
      component: <HomePageComponent onStartNewTrack={() => handleStartNewTrack()} onContinueLearning={() => handleContinueLearning()} onStartReview={() => handleStartReview()} />
    }
    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('home')
  }

    const handleContinueFromProgress = () => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Alright, let's jump back into your interactive lesson!",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    }
    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('learning')
  }

  const handleSelectTrackFromProgress = (trackName: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `I want to continue with ${trackName}`,
      timestamp: new Date()
    }

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Great! Let's continue with your ${trackName} track. Here's your next lesson:`,
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    }

    setMessages(prev => [...prev, userMessage, aiResponse])
    setCurrentStep('learning')
  }

  const handleTrackSelect = (track: LearningTrack) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `I'm interested in ${track.title}`,
      timestamp: new Date()
    }

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Great choice! ${track.title} is an excellent path. Let me assess your current skills to personalize your learning journey.`,
      timestamp: new Date(),
      component: <SkillAssessmentComponent onComplete={handleSkillAssessment} />
    }

    setMessages(prev => [...prev, newMessage, aiResponse])
    setCurrentStep('assessment')
  }

  const handleSkillAssessment = (skills: SkillAssessment[]) => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Perfect! Now let's understand your learning preferences and goals to create the best experience for you.",
      timestamp: new Date(),
      component: <LearningPreferencesComponent onComplete={handlePreferencesComplete} />
    }

    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('preferences')
  }

  const handlePreferencesComplete = (preferences: any) => {
    const aiResponse: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: "Excellent! I've created a personalized learning plan for you. Let's start with your first interactive lesson!",
      timestamp: new Date(),
      component: <InteractiveLessonComponent />
    }

    setMessages(prev => [...prev, aiResponse])
    setCurrentStep('learning')
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Simulate AI response
    setTimeout(() => {
      let aiResponse: Message

      if (inputValue.toLowerCase().includes('progress')) {
                aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Here's your current learning progress across all tracks:",
          timestamp: new Date(),
          component: <ProgressDashboardComponent 
            onContinueLearning={() => handleContinueFromProgress()} 
            onSelectTrack={(trackName) => handleSelectTrackFromProgress(trackName)}
          />
        }
        setCurrentStep('progress')
      } else if (inputValue.toLowerCase().includes('help')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "I'm here to help! What specific problem are you facing or what concept do you need clarification on?",
          timestamp: new Date()
        }
            } else if (inputValue.toLowerCase().includes('next')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Based on your progress, your next step is to dive deeper into React Hooks. Would you like to start that lesson now?",
          timestamp: new Date()
        }
      } else if (inputValue.toLowerCase().includes('review') || inputValue.toLowerCase().includes('flashcard')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Perfect! Let's start a flashcard review session to reinforce your learning:",
          timestamp: new Date(),
          component: <FlashcardReviewComponent onComplete={() => handleReviewComplete()} />
        }
        setCurrentStep('learning')
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "I understand! Let me help you with that. Is there anything specific you'd like to focus on?",
          timestamp: new Date()
        }
      }

      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

        return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground">AI Tutor</h2>
          <p className="text-xs text-muted-foreground">Your personal learning assistant</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent">
            <TabsTrigger 
              value="home" 
              className="flex items-center gap-2 text-xs data-[state=active]:bg-primary/10"
              onClick={() => {
                setActiveTab('home')
                const aiResponse: Message = {
                  id: Date.now().toString(),
                  type: 'ai',
                  content: "Welcome back! What would you like to do today?",
                  timestamp: new Date(),
                  component: <HomePageComponent onStartNewTrack={() => handleStartNewTrack()} onContinueLearning={() => handleContinueLearning()} onStartReview={() => handleStartReview()} />
                }
                setMessages(prev => [...prev, aiResponse])
                setCurrentStep('home')
              }}
            >
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="flex items-center gap-2 text-xs data-[state=active]:bg-primary/10"
              onClick={() => {
                setActiveTab('progress')
                handleContinueLearning()
              }}
            >
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger 
              value="review" 
              className="flex items-center gap-2 text-xs data-[state=active]:bg-primary/10"
              onClick={() => {
                setActiveTab('review')
                handleStartReview()
              }}
            >
              <Brain className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger 
              value="explore" 
              className="flex items-center gap-2 text-xs data-[state=active]:bg-primary/10"
              onClick={() => {
                setActiveTab('explore')
                handleStartNewTrack()
              }}
            >
              <BookOpen className="w-4 h-4" />
              Explore
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

            {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                                <div className={`max-w-[70%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                                    {message.component && (
                    <div className="mt-3 max-w-full overflow-hidden">
                      {message.component}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your learning journey..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => handleContinueLearning()}>
            Show Progress
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputValue("I need help with this lesson")}>
            Get Help
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputValue("What should I learn next?")}>
            What's Next?
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleStartReview()}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Review
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AITutorChatDemo() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Tutor Chat</h1>
          <p className="text-muted-foreground">
            Experience personalized learning through intelligent conversations
          </p>
        </div>
        <AITutorChat />
      </div>
    </div>
  )
}
