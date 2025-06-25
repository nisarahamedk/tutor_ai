// src/features/ai-tutor/utils/learningAnalytics.ts
// Learning Analytics Utilities for TASK-010

import type {
  LearningStats,
  WeeklyProgress,
  StreakInfo,
  LearningAnalytics,
  LearningPattern,
  DifficultyAnalysis,
  TimeAnalysis,
  SkillProgression,
  LearningRecommendation,
  TrackProgress,
  LessonProgress,
  AssessmentResult,
  LearningPreferences,
  LearningTrack,
  Achievement
} from '../types/learning';

// Statistics computation
export const computeLearningStats = (
  enrolledTracks: string[],
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>,
  achievements: Achievement[]
): LearningStats => {
  const totalLessonsCompleted = Object.values(lessonProgress)
    .filter(lesson => lesson.progress === 100).length;
  
  const totalTracksCompleted = Object.values(progress)
    .filter(track => track.status === 'completed').length;
  
  const totalTimeSpent = Object.values(progress)
    .reduce((total, track) => total + track.timeSpent, 0) +
    Object.values(lessonProgress)
    .reduce((total, lesson) => total + lesson.timeSpent, 0);
  
  const assessmentScores = Object.values(assessmentResults)
    .filter(result => result.passed)
    .map(result => result.score);
  
  const averageScore = assessmentScores.length > 0 
    ? assessmentScores.reduce((sum, score) => sum + score, 0) / assessmentScores.length
    : 0;
  
  const currentStreak = calculateCurrentStreak(progress);
  const longestStreak = calculateLongestStreak(progress);
  
  const weeklyProgress = calculateWeeklyProgress(progress, lessonProgress);
  const learningVelocity = calculateLearningVelocity(weeklyProgress);
  
  const skills = extractSkillsFromProgress(progress, lessonProgress);
  const strongestSkills = getStrongestSkills(skills);
  const improvementAreas = getImprovementAreas(skills, assessmentResults);
  
  const completionRate = enrolledTracks.length > 0 
    ? (totalTracksCompleted / enrolledTracks.length) * 100
    : 0;
  
  return {
    totalTracksEnrolled: enrolledTracks.length,
    totalTracksCompleted,
    totalLessonsCompleted,
    totalTimeSpent,
    averageScore,
    currentStreak,
    longestStreak,
    totalAchievements: achievements.length,
    learningVelocity,
    strongestSkills,
    improvementAreas,
    weeklyProgress,
    completionRate
  };
};

// Streak calculation
export const calculateCurrentStreak = (progress: Record<string, TrackProgress>): number => {
  const sortedActivities = Object.values(progress)
    .map(track => new Date(track.lastAccessedAt))
    .sort((a, b) => b.getTime() - a.getTime());
  
  if (sortedActivities.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const activityDate of sortedActivities) {
    const activityDay = new Date(activityDate);
    activityDay.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - activityDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === streak) {
      streak++;
    } else if (dayDiff > streak) {
      break;
    }
  }
  
  return streak;
};

export const calculateLongestStreak = (progress: Record<string, TrackProgress>): number => {
  const activities = Object.values(progress)
    .map(track => new Date(track.lastAccessedAt))
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (activities.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < activities.length; i++) {
    const prevDay = new Date(activities[i - 1]);
    const currentDay = new Date(activities[i]);
    
    prevDay.setHours(0, 0, 0, 0);
    currentDay.setHours(0, 0, 0, 0);
    
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

// StreakInfo calculation
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

// Weekly progress calculation
export const calculateWeeklyProgress = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): WeeklyProgress[] => {
  const weeklyData = new Map<string, WeeklyProgress>();
  
  // Process track progress
  Object.values(progress).forEach(track => {
    const week = getISOWeek(new Date(track.lastAccessedAt));
    const existing = weeklyData.get(week) || {
      week,
      lessonsCompleted: 0,
      timeSpent: 0,
      averageScore: 0,
      tracksStarted: 0,
      tracksCompleted: 0
    };
    
    existing.timeSpent += track.timeSpent;
    existing.tracksStarted += 1;
    if (track.status === 'completed') {
      existing.tracksCompleted += 1;
    }
    
    weeklyData.set(week, existing);
  });
  
  // Process lesson progress
  Object.values(lessonProgress).forEach(lesson => {
    if (lesson.completedAt) {
      const week = getISOWeek(new Date(lesson.completedAt));
      const existing = weeklyData.get(week);
      if (existing) {
        existing.lessonsCompleted += 1;
        existing.timeSpent += lesson.timeSpent;
        
        if (lesson.scores.length > 0) {
          const avgScore = lesson.scores.reduce((sum, score) => sum + score, 0) / lesson.scores.length;
          existing.averageScore = (existing.averageScore + avgScore) / 2;
        }
      }
    }
  });
  
  return Array.from(weeklyData.values()).sort((a, b) => a.week.localeCompare(b.week));
};

// Learning velocity calculation
export const calculateLearningVelocity = (weeklyProgress: WeeklyProgress[]): number => {
  if (weeklyProgress.length === 0) return 0;
  
  const recentWeeks = weeklyProgress.slice(-4); // Last 4 weeks
  const totalLessons = recentWeeks.reduce((sum, week) => sum + week.lessonsCompleted, 0);
  
  return totalLessons / Math.max(recentWeeks.length, 1);
};

// Skill analysis
export const extractSkillsFromProgress = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): Record<string, { experience: number; score: number }> => {
  const skills: Record<string, { experience: number; score: number }> = {};
  
  // This would be enhanced with actual track/lesson skill data
  // For now, return a basic structure
  return skills;
};

export const getStrongestSkills = (skills: Record<string, { experience: number; score: number }>): string[] => {
  return Object.entries(skills)
    .sort(([, a], [, b]) => (b.experience * b.score) - (a.experience * a.score))
    .slice(0, 5)
    .map(([skill]) => skill);
};

export const getImprovementAreas = (
  skills: Record<string, { experience: number; score: number }>,
  assessmentResults: Record<string, AssessmentResult>
): string[] => {
  const lowPerformingSkills = Object.entries(skills)
    .filter(([, data]) => data.score < 70)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([skill]) => skill);
  
  return lowPerformingSkills;
};

// Advanced analytics
export const generateLearningAnalytics = (
  tracks: LearningTrack[],
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  assessmentResults: Record<string, AssessmentResult>,
  preferences: LearningPreferences
): LearningAnalytics => {
  const learningPatterns = identifyLearningPatterns(progress, lessonProgress);
  const difficultyAnalysis = analyzeDifficultyPreferences(progress, assessmentResults, tracks);
  const timeAnalysis = analyzeTimePatterns(progress, lessonProgress);
  const skillProgression = analyzeSkillProgression(progress, lessonProgress, tracks);
  const recommendations = generateRecommendations(tracks, progress, preferences, skillProgression);
  
  return {
    learningPatterns,
    difficultyAnalysis,
    timeAnalysis,
    skillProgression,
    recommendations
  };
};

export const identifyLearningPatterns = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): LearningPattern[] => {
  const patterns: LearningPattern[] = [];
  
  // Analyze session timing patterns
  const sessionTimes = Object.values(progress)
    .map(track => new Date(track.lastAccessedAt).getHours());
  
  const timeDistribution = sessionTimes.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const peakHour = Object.entries(timeDistribution)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (peakHour) {
    patterns.push({
      pattern: 'peak-learning-time',
      frequency: peakHour[1],
      confidence: peakHour[1] / sessionTimes.length,
      description: `Most active learning happens at ${peakHour[0]}:00`,
      recommendations: [`Schedule important lessons during ${peakHour[0]}:00 hour`]
    });
  }
  
  // Analyze completion patterns
  const completionTimes = Object.values(lessonProgress)
    .filter(lesson => lesson.completedAt)
    .map(lesson => lesson.timeSpent);
  
  if (completionTimes.length > 0) {
    const avgTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const isQuickLearner = avgTime < 30 * 60 * 1000; // Less than 30 minutes average
    
    patterns.push({
      pattern: isQuickLearner ? 'quick-learner' : 'thorough-learner',
      frequency: completionTimes.length,
      confidence: 0.8,
      description: isQuickLearner 
        ? 'Tends to complete lessons quickly'
        : 'Takes time to thoroughly understand concepts',
      recommendations: isQuickLearner
        ? ['Consider more challenging content', 'Add depth to lessons']
        : ['Break lessons into smaller chunks', 'Add more practice exercises']
    });
  }
  
  return patterns;
};

export const analyzeDifficultyPreferences = (
  progress: Record<string, TrackProgress>,
  assessmentResults: Record<string, AssessmentResult>,
  tracks: LearningTrack[]
): DifficultyAnalysis => {
  const difficultyProgress = tracks.reduce((acc, track) => {
    const trackProgress = progress[track.id];
    if (trackProgress) {
      acc[track.difficulty] = acc[track.difficulty] || { completed: 0, total: 0, timeSpent: 0 };
      acc[track.difficulty].total += 1;
      acc[track.difficulty].timeSpent += trackProgress.timeSpent;
      if (trackProgress.status === 'completed') {
        acc[track.difficulty].completed += 1;
      }
    }
    return acc;
  }, {} as Record<string, { completed: number; total: number; timeSpent: number }>);
  
  const completionRateByDifficulty = Object.entries(difficultyProgress).reduce((acc, [difficulty, data]) => {
    acc[difficulty] = data.total > 0 ? (data.completed / data.total) * 100 : 0;
    return acc;
  }, {} as Record<string, number>);
  
  const timeSpentByDifficulty = Object.entries(difficultyProgress).reduce((acc, [difficulty, data]) => {
    acc[difficulty] = data.timeSpent;
    return acc;
  }, {} as Record<string, number>);
  
  const preferredDifficulty = Object.entries(completionRateByDifficulty)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as 'beginner' | 'intermediate' | 'advanced' || 'beginner';
  
  return {
    preferredDifficulty,
    completionRateByDifficulty,
    timeSpentByDifficulty,
    recommendedProgression: generateDifficultyProgression(completionRateByDifficulty)
  };
};

export const analyzeTimePatterns = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>
): TimeAnalysis => {
  const sessionLengths = Object.values(lessonProgress).map(lesson => lesson.timeSpent);
  const averageSessionLength = sessionLengths.length > 0 
    ? sessionLengths.reduce((sum, time) => sum + time, 0) / sessionLengths.length
    : 0;
  
  const activityTimes = Object.values(progress)
    .map(track => new Date(track.lastAccessedAt).getHours());
  
  const timeDistribution = activityTimes.reduce((acc, hour) => {
    const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostProductiveTime = Object.entries(timeDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'morning';
  
  const weeklyDistribution = Object.values(progress).reduce((acc, track) => {
    const dayOfWeek = new Date(track.lastAccessedAt).toLocaleDateString('en-US', { weekday: 'long' });
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const optimalSessionLength = calculateOptimalSessionLength(sessionLengths);
  const focusScore = calculateFocusScore(lessonProgress);
  
  return {
    averageSessionLength,
    mostProductiveTime,
    weeklyDistribution,
    optimalSessionLength,
    focusScore
  };
};

export const analyzeSkillProgression = (
  progress: Record<string, TrackProgress>,
  lessonProgress: Record<string, LessonProgress>,
  tracks: LearningTrack[]
): SkillProgression[] => {
  const skillData = new Map<string, {
    totalTime: number;
    completedLessons: number;
    averageScore: number;
    trackCount: number;
  }>();
  
  tracks.forEach(track => {
    const trackProgress = progress[track.id];
    if (trackProgress) {
      track.skills.forEach(skill => {
        const existing = skillData.get(skill) || {
          totalTime: 0,
          completedLessons: 0,
          averageScore: 0,
          trackCount: 0
        };
        
        existing.totalTime += trackProgress.timeSpent;
        existing.completedLessons += trackProgress.completedLessons.length;
        existing.trackCount += 1;
        
        skillData.set(skill, existing);
      });
    }
  });
  
  return Array.from(skillData.entries()).map(([skill, data]) => ({
    skill,
    currentLevel: Math.min(Math.floor(data.completedLessons / 5), 10), // Basic level calculation
    progression: Math.min((data.completedLessons / 20) * 100, 100), // Progress to mastery
    timeToMastery: Math.max(0, (100 - data.completedLessons) * 2), // Estimated days
    relatedSkills: getRelatedSkills(skill, tracks),
    masteryCriteria: [`Complete 20+ lessons in ${skill}`, `Maintain 80%+ accuracy`, `Apply in real projects`]
  }));
};

export const generateRecommendations = (
  tracks: LearningTrack[],
  progress: Record<string, TrackProgress>,
  preferences: LearningPreferences,
  skillProgression: SkillProgression[]
): LearningRecommendation[] => {
  const recommendations: LearningRecommendation[] = [];
  
  // Recommend tracks based on difficulty preference
  const availableTracks = tracks.filter(track => 
    !progress[track.id] && track.difficulty === preferences.difficultyPreference
  );
  
  availableTracks.slice(0, 3).forEach((track, index) => {
    recommendations.push({
      id: `track-rec-${track.id}`,
      type: 'track',
      title: `Try ${track.title}`,
      description: track.description,
      reasoning: `Matches your ${preferences.difficultyPreference} difficulty preference`,
      priority: index === 0 ? 'high' : 'medium',
      estimatedTime: track.estimatedHours * 60,
      targetId: track.id,
      confidence: 0.8
    });
  });
  
  // Recommend skill development
  const improvingSkills = skillProgression
    .filter(skill => skill.progression < 80)
    .sort((a, b) => b.progression - a.progression)
    .slice(0, 2);
  
  improvingSkills.forEach(skill => {
    const relatedTracks = tracks.filter(track => 
      track.skills.includes(skill.skill) && !progress[track.id]
    );
    
    if (relatedTracks.length > 0) {
      recommendations.push({
        id: `skill-rec-${skill.skill}`,
        type: 'track',
        title: `Advance in ${skill.skill}`,
        description: `Continue developing your ${skill.skill} skills`,
        reasoning: `You're ${skill.progression.toFixed(0)}% towards mastery`,
        priority: 'medium',
        estimatedTime: relatedTracks[0].estimatedHours * 60,
        targetId: relatedTracks[0].id,
        confidence: 0.7
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Helper functions
export const getISOWeek = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export const calculateOptimalSessionLength = (sessionLengths: number[]): number => {
  if (sessionLengths.length === 0) return 30 * 60 * 1000; // Default 30 minutes
  
  const sortedLengths = sessionLengths.sort((a, b) => a - b);
  const median = sortedLengths[Math.floor(sortedLengths.length / 2)];
  
  // Optimal length is typically around the median, adjusted for productivity
  return Math.min(Math.max(median, 15 * 60 * 1000), 90 * 60 * 1000); // Between 15-90 minutes
};

export const calculateFocusScore = (lessonProgress: Record<string, LessonProgress>): number => {
  const lessons = Object.values(lessonProgress);
  if (lessons.length === 0) return 0;
  
  const focusScores = lessons.map(lesson => {
    // Higher score for lessons completed in fewer attempts
    const attemptScore = Math.max(0, 100 - (lesson.attempts - 1) * 20);
    
    // Higher score for consistent progress
    const consistencyScore = lesson.scores.length > 1 
      ? Math.max(0, 100 - (Math.max(...lesson.scores) - Math.min(...lesson.scores)))
      : 50;
    
    return (attemptScore + consistencyScore) / 2;
  });
  
  return focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length;
};

export const generateDifficultyProgression = (completionRates: Record<string, number>): string => {
  const beginner = completionRates.beginner || 0;
  const intermediate = completionRates.intermediate || 0;
  const advanced = completionRates.advanced || 0;
  
  if (beginner < 70) {
    return 'Focus on beginner content to build foundation';
  } else if (intermediate < 70) {
    return 'Ready for intermediate challenges';
  } else if (advanced < 70) {
    return 'Advance to expert-level content';
  } else {
    return 'Maintain skill balance across all levels';
  }
};

export const getRelatedSkills = (skill: string, tracks: LearningTrack[]): string[] => {
  const relatedSkills = new Set<string>();
  
  tracks.forEach(track => {
    if (track.skills.includes(skill)) {
      track.skills.forEach(s => {
        if (s !== skill) {
          relatedSkills.add(s);
        }
      });
    }
  });
  
  return Array.from(relatedSkills).slice(0, 5);
};

// Helper functions for streak calculation
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