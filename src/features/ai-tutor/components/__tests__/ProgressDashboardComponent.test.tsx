import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressDashboardComponent } from '../ProgressDashboardComponent'; // Named import
import { createMockLearningTrack, createMockAchievement } from '../../../../test-utils/factories';

// Mock ResizeObserver (for Progress component from Radix UI)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Standard mocks
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/utils', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <div data-testid="next-image" {...props} />,
}));

// Mock lucide-react icons (ensure all used icons are mocked)
jest.mock('lucide-react', () => ({
  TrendingUp: (props) => <svg data-testid="trending-up-icon" {...props} />,
  Award: (props) => <svg data-testid="award-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  Star: (props) => <svg data-testid="star-icon" {...props} />,
  ArrowRight: (props) => <svg data-testid="arrow-right-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  Target: (props) => <svg data-testid="target-icon" {...props} />, // Added Target icon
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }) => <div {...rest}>{children}</div>, // Simple div mock
    // Add other motion elements if used, e.g., motion.button
  },
  // Mock other framer-motion exports if necessary, e.g. AnimatePresence
}));


const mockOnContinueLearning = jest.fn();
const mockOnSelectTrack = jest.fn();

// Data matching what's hardcoded in the component for consistent testing
// Note: ProgressDashboardComponent's internal track structure is different from TrackExplorationComponent's
// It uses 'name' instead of 'title', and has 'status', 'timeSpent', 'nextLesson'.
// We use createMockLearningTrack and override/add these specific fields.
const internalTracksData = [
  createMockLearningTrack({
    // id: (default)
    title: 'Frontend Development', // Will be mapped to 'name' if needed by test logic, or use 'name' directly in overrides
    name: 'Frontend Development',
    progress: 65,
    status: 'active' as 'active' | 'paused' | 'planned',
    timeSpent: '24h 30m',
    nextLesson: 'React Hooks Deep Dive',
    // Remove ExplorationLearningTrack specific fields not in ProgressDashboard's version if they cause issues
    icon: undefined, description: undefined, difficulty: undefined, duration: undefined, skills: undefined,
  }),
  createMockLearningTrack({
    name: 'UX/UI Design',
    progress: 30,
    status: 'paused' as 'active' | 'paused' | 'planned',
    timeSpent: '8h 15m',
    nextLesson: 'Design Systems',
    icon: undefined, description: undefined, difficulty: undefined, duration: undefined, skills: undefined,
  }),
  createMockLearningTrack({
    name: 'Backend Development',
    progress: 0,
    status: 'planned' as 'active' | 'paused' | 'planned',
    timeSpent: '0h',
    nextLesson: 'Node.js Fundamentals',
    icon: undefined, description: undefined, difficulty: undefined, duration: undefined, skills: undefined,
  })
];

const internalAchievementsData = [
  createMockAchievement({ id: '1', text: 'Completed React Basics', iconTestId: 'check-circle-icon', date: '2 days ago' }),
  createMockAchievement({ id: '2', text: 'Perfect score on JavaScript Quiz', iconTestId: 'star-icon', date: '1 week ago' }),
  createMockAchievement({ id: '3', text: 'Finished CSS Flexbox Module', iconTestId: 'target-icon', date: '2 weeks ago' }),
];


describe('ProgressDashboardComponent', () => {
  beforeEach(() => {
    mockOnContinueLearning.mockClear();
    mockOnSelectTrack.mockClear();
  });

  it('renders the main title as a heading', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    expect(screen.getByRole('heading', { name: /Your Learning Progress/i, level: 3 })).toBeInTheDocument();
  });

  it('displays all tracks with their full details and correct ARIA attributes for progress bars', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    internalTracksData.forEach(track => {
      const trackCard = screen.getByText(track.name).closest('div[class*="cursor-pointer"]'); // More robust selector for the card
      expect(trackCard).toBeInTheDocument();

      // Check details within the scope of the card
      expect(within(trackCard).getByText(track.name)).toBeInTheDocument();
      expect(within(trackCard).getByText(`${track.progress}% complete`)).toBeInTheDocument();
      expect(within(trackCard).getByText(new RegExp(track.status, "i"))).toBeInTheDocument();
      expect(within(trackCard).getByText(track.timeSpent)).toBeInTheDocument();
      expect(within(trackCard).getByText(track.nextLesson)).toBeInTheDocument();

      if (track.status === 'active') {
        expect(within(trackCard).getByText(/On track/i)).toBeInTheDocument();
        expect(within(trackCard).getByTestId('trending-up-icon')).toBeInTheDocument();
      } else {
        expect(within(trackCard).queryByText(/On track/i)).not.toBeInTheDocument();
        expect(within(trackCard).queryByTestId('trending-up-icon')).not.toBeInTheDocument();
      }

      const progressBar = within(trackCard).getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', track.progress.toString());
    });

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(internalTracksData.length);
  });

  it('displays recent achievements with titles, dates, and icons', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    // Check for section title as a heading (or other landmark)
    expect(screen.getByRole('heading', { name: /Recent Achievements/i })).toBeInTheDocument(); // Assuming CardTitle makes it a heading implicitly or explicitly

    internalAchievementsData.forEach(achievement => {
      const achievementItem = screen.getByText(achievement.text).closest('div[class*="bg-white"]'); // Robust selector for achievement item
      expect(achievementItem).toBeInTheDocument();
      expect(within(achievementItem).getByText(achievement.text)).toBeInTheDocument();
      expect(within(achievementItem).getByText(achievement.date)).toBeInTheDocument();
      expect(within(achievementItem).getByTestId(achievement.iconTestId)).toBeInTheDocument();
    });
  });

  it('calls onSelectTrack with the correct track name when each track card is clicked', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    internalTracksData.forEach(track => {
      const trackCard = screen.getByText(track.name).closest('div[class*="cursor-pointer"]');
      expect(trackCard).toBeInTheDocument();
      fireEvent.click(trackCard);
      expect(mockOnSelectTrack).toHaveBeenCalledWith(track.name);
    });
    expect(mockOnSelectTrack).toHaveBeenCalledTimes(internalTracksData.length);
  });

  it('calls onContinueLearning when the "Continue Learning" button is clicked', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    const continueButton = screen.getByRole('button', { name: /Continue Learning/i });
    expect(continueButton).toBeInTheDocument();
    expect(within(continueButton).getByTestId('arrow-right-icon')).toBeInTheDocument(); // Check icon on button
    fireEvent.click(continueButton);
    expect(mockOnContinueLearning).toHaveBeenCalledTimes(1);
  });
});

// Helper to query within a specific element
import { queries, within as rtlWithin } from '@testing-library/dom';

function within(element) {
  const customQueries = {};
  return rtlWithin(element, { ...queries, ...customQueries });
}
