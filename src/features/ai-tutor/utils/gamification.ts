// src/features/ai-tutor/utils/gamification.ts
// Gamification Utilities for TASK-010

import type {
  Achievement,
  AchievementType,
  AchievementCriteria,
  StreakInfo,
  LearningGoal,
  TrackProgress,
  LessonProgress,
  AssessmentResult
} from '../types/learning';

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<Achievement, 'id' | 'earnedAt'>> = {
  // Streak achievements
  'first-day': {
    type: 'streak',
    title: 'Getting Started',
    description: 'Complete your first learning session',
    icon: '🎯',
    criteria: { type: 'daily-streak', value: 1, comparison: 'greater-equal' },
    points: 10,
    rarity: 'common'
  },
  'week-warrior': {
    type: 'streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    criteria: { type: 'daily-streak', value: 7, comparison: 'greater-equal' },
    points: 50,
    rarity: 'uncommon'
  },
  'month-master': {
    type: 'streak',
    title: 'Month Master',
    description: 'Maintain a 30-day learning streak',
    icon: '⭐',
    criteria: { type: 'daily-streak', value: 30, comparison: 'greater-equal' },
    points: 200,
    rarity: 'rare'
  },
  'streak-legend': {
    type: 'streak',
    title: 'Streak Legend',
    description: 'Maintain a 100-day learning streak',
    icon: '👑',
    criteria: { type: 'daily-streak', value: 100, comparison: 'greater-equal' },
    points: 1000,
    rarity: 'legendary'
  },

  // Completion achievements
  'first-lesson': {
    type: 'completion',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '📚',
    criteria: { type: 'lessons-completed', value: 1, comparison: 'greater-equal' },
    points: 15,
    rarity: 'common'
  },
  'lesson-enthusiast': {
    type: 'completion',
    title: 'Lesson Enthusiast',
    description: 'Complete 10 lessons',
    icon: '📖',
    criteria: { type: 'lessons-completed', value: 10, comparison: 'greater-equal' },
    points: 75,
    rarity: 'uncommon'
  },
  'lesson-master': {
    type: 'completion',
    title: 'Lesson Master',
    description: 'Complete 50 lessons',
    icon: '🎓',
    criteria: { type: 'lessons-completed', value: 50, comparison: 'greater-equal' },
    points: 300,
    rarity: 'rare'
  },
  'track-finisher': {
    type: 'completion',
    title: 'Track Finisher',
    description: 'Complete your first learning track',
    icon: '🏆',
    criteria: { type: 'tracks-completed', value: 1, comparison: 'greater-equal' },
    points: 100,
    rarity: 'uncommon'
  },
  'multi-track-master': {
    type: 'completion',
    title: 'Multi-Track Master',
    description: 'Complete 5 learning tracks',
    icon: '🌟',
    criteria: { type: 'tracks-completed', value: 5, comparison: 'greater-equal' },
    points: 500,
    rarity: 'epic'
  },

  // Speed achievements
  'speed-learner': {
    type: 'speed',
    title: 'Speed Learner',
    description: 'Complete a lesson in under 15 minutes',
    icon: '⚡',
    criteria: { type: 'lesson-time', value: 15 * 60 * 1000, comparison: 'less' },
    points: 25,
    rarity: 'common'
  },
  'lightning-fast': {
    type: 'speed',
    title: 'Lightning Fast',
    description: 'Complete 5 lessons in one day',
    icon: '⚡⚡',
    criteria: { type: 'daily-lessons', value: 5, comparison: 'greater-equal' },
    points: 75,
    rarity: 'uncommon'
  },

  // Accuracy achievements
  'perfectionist': {
    type: 'accuracy',
    title: 'Perfectionist',
    description: 'Score 100% on an assessment',
    icon: '💯',
    criteria: { type: 'assessment-score', value: 100, comparison: 'greater-equal' },
    points: 50,
    rarity: 'uncommon'
  },
  'consistent-performer': {
    type: 'accuracy',
    title: 'Consistent Performer',
    description: 'Maintain 90%+ average score across 10 assessments',
    icon: '🎯',
    criteria: { type: 'average-score', value: 90, comparison: 'greater-equal' },
    points: 150,
    rarity: 'rare'
  },

  // Dedication achievements
  'night-owl': {
    type: 'dedication',
    title: 'Night Owl',
    description: 'Learn for 3+ hours after 9 PM',
    icon: '🦉',
    criteria: { type: 'late-night-hours', value: 3, comparison: 'greater-equal' },
    points: 40,
    rarity: 'uncommon'
  },
  'early-bird': {
    type: 'dedication',
    title: 'Early Bird',
    description: 'Learn for 2+ hours before 7 AM',
    icon: '🌅',
    criteria: { type: 'early-morning-hours', value: 2, comparison: 'greater-equal' },
    points: 40,
    rarity: 'uncommon'
  },
  'marathon-learner': {
    type: 'dedication',
    title: 'Marathon Learner',
    description: 'Study for 8+ hours in a single day',
    icon: '🏃',
    criteria: { type: 'daily-hours', value: 8, comparison: 'greater-equal' },
    points: 100,
    rarity: 'rare'
  },

  // Explorer achievements
  'curious-mind': {
    type: 'explorer',
    title: 'Curious Mind',
    description: 'Enroll in 3 different tracks',
    icon: '🔍',
    criteria: { type: 'tracks-enrolled', value: 3, comparison: 'greater-equal' },
    points: 60,
    rarity: 'common'
  },
  'knowledge-seeker': {
    type: 'explorer',
    title: 'Knowledge Seeker',
    description: 'Explore 5 different skill categories',
    icon: '🗺️',
    criteria: { type: 'categories-explored', value: 5, comparison: 'greater-equal' },
    points: 120,
    rarity: 'uncommon'
  },

  // Milestone achievements
  'century-club': {
    type: 'milestone',
    title: 'Century Club',
    description: 'Complete 100 lessons',
    icon: '💯',
    criteria: { type: 'lessons-completed', value: 100, comparison: 'greater-equal' },
    points: 750,
    rarity: 'epic'
  },
  'time-invested': {
    type: 'milestone',
    title: 'Time Invested',
    description: 'Spend 100+ hours learning',
    icon: '⏰',
    criteria: { type: 'total-hours', value: 100, comparison: 'greater-equal' },
    points: 400,
    rarity: 'rare'
  }
};

// Streak calculation functions
export const calculateCurrentStreak = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): number => {
  const activities = [
    ...Object.values(progress).map(p => new Date(p.lastAccessedAt)),
    ...Object.values(lessonProgress)
      .filter(l => l.completedAt)
      .map(l => new Date(l.completedAt!))
  ].sort((a, b) => b.getTime() - a.getTime());

  if (activities.length === 0) return 0;

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const uniqueDays = new Set<string>();
  activities.forEach(date => {
    const dayKey = date.toDateString();
    uniqueDays.add(dayKey);
  });

  const sortedDays = Array.from(uniqueDays)
    .map(day => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  for (let i = 0; i < sortedDays.length; i++) {
    const dayDiff = Math.floor((currentDate.getTime() - sortedDays[i].getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === i) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export const calculateLongestStreak = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): number => {
  const activities = [
    ...Object.values(progress).map(p => new Date(p.lastAccessedAt)),
    ...Object.values(lessonProgress)
      .filter(l => l.completedAt)
      .map(l => new Date(l.completedAt!))
  ];

  if (activities.length === 0) return 0;

  const uniqueDays = new Set<string>();
  activities.forEach(date => {
    const dayKey = date.toDateString();
    uniqueDays.add(dayKey);
  });

  const sortedDays = Array.from(uniqueDays)
    .map(day => new Date(day))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i - 1];
    const currentDay = sortedDays[i];
    const dayDiff = Math.floor((currentDay.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(longestStreak, currentStreak);
};

export const getStreakInfo = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): StreakInfo => {
  const current = calculateCurrentStreak(progress, lessonProgress);
  const longest = calculateLongestStreak(progress, lessonProgress);
  
  const now = new Date();
  const thisWeek = getWeekActivities(progress, lessonProgress, now);
  const weeklyTarget = 5; // Default weekly target
  
  return {
    current,
    longest,
    lastActiveDate: getLastActiveDate(progress, lessonProgress),
    daysThisWeek: thisWeek.length,
    weeklyTarget,
    isOnTrack: thisWeek.length >= Math.ceil((now.getDay() / 7) * weeklyTarget)
  };
};

// Achievement checking functions
export const checkForNewAchievements = (
  currentAchievements: Achievement[],
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>
): Achievement[] => {
  const newAchievements: Achievement[] = [];
  const currentAchievementIds = new Set(currentAchievements.map(a => a.id));

  // Calculate current stats
  const stats = calculateLearningStats(progress, lessonProgress, assessmentResults);

  // Check each achievement definition
  Object.entries(ACHIEVEMENT_DEFINITIONS).forEach(([key, definition]) => {
    if (currentAchievementIds.has(key)) return; // Already earned

    if (checkAchievementCriteria(definition.criteria, stats, progress, lessonProgress, assessmentResults)) {
      newAchievements.push({
        ...definition,
        id: key,
        earnedAt: new Date().toISOString()
      });
    }
  });

  return newAchievements;
};

export const checkAchievementCriteria = (
  criteria: AchievementCriteria,
  stats: Record<string, unknown>,
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>
): boolean => {
  let actualValue: number;

  switch (criteria.type) {
    case 'daily-streak':
      actualValue = calculateCurrentStreak(progress, lessonProgress);
      break;
    case 'lessons-completed':
      actualValue = Object.values(lessonProgress).filter(l => l.progress === 100).length;
      break;
    case 'tracks-completed':
      actualValue = Object.values(progress).filter(p => p.status === 'completed').length;
      break;
    case 'tracks-enrolled':
      actualValue = Object.keys(progress).length;
      break;
    case 'assessment-score':
      actualValue = Math.max(...Object.values(assessmentResults).map(a => a.score), 0);
      break;
    case 'average-score':
      const scores = Object.values(assessmentResults).map(a => a.score);
      actualValue = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      break;
    case 'total-hours':
      actualValue = (Object.values(progress).reduce((sum, p) => sum + p.timeSpent, 0) +
        Object.values(lessonProgress).reduce((sum, l) => sum + l.timeSpent, 0)) / (1000 * 60 * 60);
      break;
    case 'daily-lessons':
      actualValue = getDailyLessonsCompleted(lessonProgress, new Date());
      break;
    case 'lesson-time':
      const fastestLesson = Math.min(...Object.values(lessonProgress).map(l => l.timeSpent), Infinity);
      actualValue = fastestLesson === Infinity ? 0 : fastestLesson;
      break;
    case 'categories-explored':
      actualValue = getCategoriesExplored(progress);
      break;
    case 'late-night-hours':
      actualValue = getLateNightHours();
      break;
    case 'early-morning-hours':
      actualValue = getEarlyMorningHours();
      break;
    case 'daily-hours':
      actualValue = getMaxDailyHours(progress, lessonProgress);
      break;
    default:
      actualValue = 0;
  }

  return compareValues(actualValue, criteria.value, criteria.comparison);
};

// Goal management functions
export const createLearningGoal = (
  type: LearningGoal['type'],
  target: number,
  deadline: string,
  description: string
): Omit<LearningGoal, 'id' | 'current' | 'achieved'> => ({
  type,
  target,
  deadline,
  description
});

export const updateGoalProgress = (
  goal: LearningGoal,
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>
): LearningGoal => {
  let current: number;

  switch (goal.type) {
    case 'lessons':
      current = Object.values(lessonProgress).filter(l => l.progress === 100).length;
      break;
    case 'tracks':
      current = Object.values(progress).filter(p => p.status === 'completed').length;
      break;
    case 'time':
      current = Math.floor((Object.values(progress).reduce((sum, p) => sum + p.timeSpent, 0) +
        Object.values(lessonProgress).reduce((sum, l) => sum + l.timeSpent, 0)) / (1000 * 60 * 60));
      break;
    case 'score':
      const scores = Object.values(assessmentResults).map(a => a.score);
      current = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
      break;
    default:
      current = 0;
  }

  return {
    ...goal,
    current,
    achieved: current >= goal.target
  };
};

// Utility functions
const calculateLearningStats = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>
) => ({
  totalLessons: Object.keys(lessonProgress).length,
  completedLessons: Object.values(lessonProgress).filter(l => l.progress === 100).length,
  totalTracks: Object.keys(progress).length,
  completedTracks: Object.values(progress).filter(p => p.status === 'completed').length,
  totalTime: Object.values(progress).reduce((sum, p) => sum + p.timeSpent, 0) +
    Object.values(lessonProgress).reduce((sum, l) => sum + l.timeSpent, 0),
  averageScore: calculateAverageScore(assessmentResults)
});

const calculateAverageScore = (assessmentResults: Record<string, AssessmentResult>): number => {
  const scores = Object.values(assessmentResults).map(a => a.score);
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
};

const compareValues = (actual: number, target: number, comparison: string): boolean => {
  switch (comparison) {
    case 'equal': return actual === target;
    case 'greater': return actual > target;
    case 'less': return actual < target;
    case 'greater-equal': return actual >= target;
    case 'less-equal': return actual <= target;
    default: return false;
  }
};

const getLastActiveDate = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): string => {
  const dates = [
    ...Object.values(progress).map(p => p.lastAccessedAt),
    ...Object.values(lessonProgress)
      .filter(l => l.completedAt)
      .map(l => l.completedAt!)
  ];

  return dates.length > 0 ? 
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : 
    '';
};

const getWeekActivities = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  weekDate: Date
): string[] => {
  const weekStart = new Date(weekDate);
  weekStart.setDate(weekDate.getDate() - weekDate.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const activities = [
    ...Object.values(progress).map(p => new Date(p.lastAccessedAt)),
    ...Object.values(lessonProgress)
      .filter(l => l.completedAt)
      .map(l => new Date(l.completedAt!))
  ];

  const thisWeekActivities = activities.filter(date => 
    date >= weekStart && date <= weekEnd
  );

  const uniqueDays = new Set(thisWeekActivities.map(date => date.toDateString()));
  return Array.from(uniqueDays);
};

const getDailyLessonsCompleted = (
  lessonProgress: Record<string, LessonProgress>,
  date: Date
): number => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return Object.values(lessonProgress).filter(lesson => {
    if (!lesson.completedAt) return false;
    const completedDate = new Date(lesson.completedAt);
    return completedDate >= dayStart && completedDate <= dayEnd;
  }).length;
};

const getCategoriesExplored = (progress: Record<string, TrackProgress>): number => {
  // This would need track category data - placeholder for now
  return Math.min(Object.keys(progress).length, 10);
};

const getLateNightHours = (): number => {
  // Simplified calculation - would need detailed time tracking
  return 0;
};

const getEarlyMorningHours = (): number => {
  // Simplified calculation - would need detailed time tracking
  return 0;
};

const getMaxDailyHours = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): number => {
  // Simplified calculation - would need detailed daily time tracking
  const totalHours = (Object.values(progress).reduce((sum, p) => sum + p.timeSpent, 0) +
    Object.values(lessonProgress).reduce((sum, l) => sum + l.timeSpent, 0)) / (1000 * 60 * 60);
  
  // Estimate max daily hours (this would be more accurate with daily tracking)
  return Math.min(totalHours, 24);
};

// Point system
export const calculateTotalPoints = (achievements: Achievement[]): number => {
  return achievements.reduce((total, achievement) => total + achievement.points, 0);
};

export const getAchievementsByRarity = (achievements: Achievement[], rarity: Achievement['rarity']): Achievement[] => {
  return achievements.filter(achievement => achievement.rarity === rarity);
};

export const getAchievementsByType = (achievements: Achievement[], type: AchievementType): Achievement[] => {
  return achievements.filter(achievement => achievement.type === type);
};

// Leaderboard helpers
export const calculateUserLevel = (totalPoints: number): number => {
  // Simple level calculation: 100 points per level, with exponential scaling
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
};

export const getPointsToNextLevel = (totalPoints: number): number => {
  const currentLevel = calculateUserLevel(totalPoints);
  const pointsForNextLevel = Math.pow(currentLevel, 2) * 100;
  return pointsForNextLevel - totalPoints;
};