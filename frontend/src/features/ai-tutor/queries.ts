// Server-side data fetching layer for AI Tutor learning components
import type { LearningTrack } from './components/learning/TrackExplorationComponent';
import type { SkillAssessment } from './components/learning/SkillAssessmentComponent';

// Mock API base URL - in production this would be environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache tags for Next.js revalidation
export const CACHE_TAGS = {
  LEARNING_TRACKS: 'learning-tracks',
  USER_PROGRESS: 'user-progress',
  SKILL_ASSESSMENTS: 'skill-assessments',
  LEARNING_PREFERENCES: 'learning-preferences',
} as const;

export interface UserProgress {
  id: string;
  userId: string;
  trackId: string;
  trackName: string;
  progress: number;
  status: 'active' | 'paused' | 'planned' | 'completed';
  timeSpent: string;
  nextLesson: string;
  lastUpdated: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  text: string;
  iconType: 'check' | 'star' | 'target' | 'award';
  date: string;
  category: string;
}

export interface LearningPreferences {
  id: string;
  userId: string;
  timeAvailability: number;
  learningStyle: 'visual' | 'hands-on' | 'reading';
  goals: string[];
  lastUpdated: string;
}

export interface SkillAssessmentData {
  id: string;
  title: string;
  description: string;
  skills: SkillAssessment[];
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

/**
 * Fetch learning tracks with caching
 * Server Component data fetching with 1 hour cache
 */
export async function getLearningTracks(): Promise<LearningTrack[]> {
  try {
    // Always use mock data for isolated frontend implementation
    // In production, this would connect to actual backend
    return getMockLearningTracks();
  } catch (error) {
    console.error('Error fetching learning tracks:', error);
    // Fallback to mock data on error
    return getMockLearningTracks();
  }
}

/**
 * Fetch user progress with revalidation
 * Server Component data fetching with 5 minute cache
 */
export async function getUserProgress(userId: string): Promise<{
  tracks: UserProgress[];
  achievements: UserAchievement[];
  overallStats: {
    totalTracksStarted: number;
    totalTimeSpent: string;
    completionRate: number;
  };
}> {
  try {
    // Always use mock data for isolated frontend implementation
    // In production, this would connect to actual backend
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      return getMockUserProgress(userId);
    }

    const response = await fetch(`${API_BASE}/api/users/${userId}/progress`, {
      next: { 
        revalidate: 300, // 5 minute cache for progress data
        tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`] 
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user progress: ${response.status}`);
    }

    const progressData = await response.json();
    return progressData;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    // Fallback to mock data on error
    return getMockUserProgress(userId);
  }
}

/**
 * Fetch skill assessments with caching
 * Server Component data fetching with 2 hour cache
 */
export async function getSkillAssessments(): Promise<SkillAssessmentData[]> {
  try {
    // Always use mock data for isolated frontend implementation
    // In production, this would connect to actual backend
    return getMockSkillAssessments();
  } catch (error) {
    console.error('Error fetching skill assessments:', error);
    // Fallback to mock data on error
    return getMockSkillAssessments();
  }
}

/**
 * Fetch learning preferences with caching
 * Server Component data fetching with 30 minute cache
 */
export async function getLearningPreferences(userId: string): Promise<LearningPreferences | null> {
  try {
    // Always use mock data for isolated frontend implementation
    // In production, this would connect to actual backend
    return getMockLearningPreferences(userId);
  } catch (error) {
    console.error('Error fetching learning preferences:', error);
    // Return null for error case - preferences are optional
    return null;
  }
}

// Mock data functions for development and fallbacks
function getMockLearningTracks(): LearningTrack[] {
  return [
    {
      id: '1',
      title: 'Frontend Development',
      description: 'Master React, TypeScript, and modern web development',
      icon: 'Code',
      progress: 0,
      difficulty: 'Beginner',
      duration: '12 weeks',
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Next.js', 'Tailwind CSS']
    },
    {
      id: '2',
      title: 'UX/UI Design',
      description: 'Learn user experience design and interface creation',
      icon: 'Palette',
      progress: 0,
      difficulty: 'Beginner',
      duration: '10 weeks',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Wireframing']
    },
    {
      id: '3',
      title: 'Backend Development',
      description: 'Build scalable server-side applications',
      icon: 'Database',
      progress: 0,
      difficulty: 'Intermediate',
      duration: '14 weeks',
      skills: ['Node.js', 'APIs', 'Databases', 'Authentication', 'Docker', 'AWS']
    },
    {
      id: '4',
      title: 'Mobile Development',
      description: 'Create native and cross-platform mobile apps',
      icon: 'Smartphone',
      progress: 0,
      difficulty: 'Intermediate',
      duration: '16 weeks',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Expo', 'Native Modules']
    },
    {
      id: '5',
      title: 'DevOps & Cloud',
      description: 'Learn deployment, monitoring, and cloud infrastructure',
      icon: 'Cloud',
      progress: 0,
      difficulty: 'Advanced',
      duration: '18 weeks',
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring', 'Terraform']
    },
    {
      id: '6',
      title: 'Data Science',
      description: 'Master data analysis, ML, and statistical modeling',
      icon: 'BarChart',
      progress: 0,
      difficulty: 'Intermediate',
      duration: '20 weeks',
      skills: ['Python', 'Pandas', 'Machine Learning', 'Statistics', 'Jupyter', 'TensorFlow']
    }
  ];
}

function getMockUserProgress(userId: string): {
  tracks: UserProgress[];
  achievements: UserAchievement[];
  overallStats: {
    totalTracksStarted: number;
    totalTimeSpent: string;
    completionRate: number;
  };
} {
  return {
    tracks: [
      {
        id: '1',
        userId,
        trackId: '1',
        trackName: 'Frontend Development',
        progress: 65,
        status: 'active',
        timeSpent: '24h 30m',
        nextLesson: 'React Hooks Deep Dive',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        userId,
        trackId: '2',
        trackName: 'UX/UI Design',
        progress: 30,
        status: 'paused',
        timeSpent: '8h 15m',
        nextLesson: 'Design Systems Fundamentals',
        lastUpdated: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        userId,
        trackId: '3',
        trackName: 'Backend Development',
        progress: 0,
        status: 'planned',
        timeSpent: '0h',
        nextLesson: 'Node.js Fundamentals',
        lastUpdated: new Date().toISOString()
      }
    ],
    achievements: [
      {
        id: '1',
        userId,
        text: 'Completed React Basics Module',
        iconType: 'check',
        date: '2 days ago',
        category: 'milestone'
      },
      {
        id: '2',
        userId,
        text: 'Perfect score on JavaScript Quiz',
        iconType: 'star',
        date: '1 week ago',
        category: 'assessment'
      },
      {
        id: '3',
        userId,
        text: 'Finished CSS Flexbox Module',
        iconType: 'target',
        date: '2 weeks ago',
        category: 'milestone'
      },
      {
        id: '4',
        userId,
        text: 'First Week Streak Achievement',
        iconType: 'award',
        date: '3 weeks ago',
        category: 'streak'
      }
    ],
    overallStats: {
      totalTracksStarted: 2,
      totalTimeSpent: '32h 45m',
      completionRate: 47.5
    }
  };
}

function getMockSkillAssessments(): SkillAssessmentData[] {
  return [
    {
      id: '1',
      title: 'Frontend Foundations Assessment',
      description: 'Evaluate your current knowledge of HTML, CSS, JavaScript, and React fundamentals',
      estimatedTime: '15-20 minutes',
      difficulty: 'Beginner',
      skills: [
        { skill: 'HTML/CSS', level: 3 },
        { skill: 'JavaScript', level: 2 },
        { skill: 'React', level: 1 },
        { skill: 'TypeScript', level: 1 },
        { skill: 'Git/Version Control', level: 2 }
      ]
    },
    {
      id: '2',
      title: 'Advanced Frontend Skills',
      description: 'Test your knowledge of advanced React patterns, state management, and performance optimization',
      estimatedTime: '25-30 minutes',
      difficulty: 'Advanced',
      skills: [
        { skill: 'React Advanced Patterns', level: 1 },
        { skill: 'State Management (Redux/Zustand)', level: 1 },
        { skill: 'Performance Optimization', level: 1 },
        { skill: 'Testing (Jest/RTL)', level: 1 },
        { skill: 'Build Tools (Webpack/Vite)', level: 1 }
      ]
    }
  ];
}

function getMockLearningPreferences(userId: string): LearningPreferences {
  return {
    id: '1',
    userId,
    timeAvailability: 10,
    learningStyle: 'hands-on',
    goals: ['Get a job as a developer', 'Build personal projects'],
    lastUpdated: new Date().toISOString()
  };
}

// Cache revalidation functions for use in Server Actions
export async function revalidateLearningTracks() {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.LEARNING_TRACKS);
}

export async function revalidateUserProgress(userId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.USER_PROGRESS);
  revalidateTag(`user-${userId}`);
}

export async function revalidateLearningPreferences(userId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.LEARNING_PREFERENCES);
  revalidateTag(`user-${userId}`);
}