import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressDashboardComponent } from '../ProgressDashboardComponent'; // Named import

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
  default: (props) => <img {...props} alt={props.alt || ''} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: (props) => <svg data-testid="trending-up-icon" {...props} />,
  Award: (props) => <svg data-testid="award-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  Star: (props) => <svg data-testid="star-icon" {...props} />,
  ArrowRight: (props) => <svg data-testid="arrow-right-icon" {...props} />,
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

// Data similar to what's hardcoded in the component for consistent testing
const tracksData = [
  { name: 'Frontend Development', progress: 65, status: 'active' },
  { name: 'UX/UI Design', progress: 30, status: 'paused' },
  { name: 'Backend Development', progress: 0, status: 'planned' }
];
const achievementsData = [
  { id: '1', text: 'Completed React Basics' },
  { id: '2', text: 'Perfect score on JavaScript Quiz' },
];


describe('ProgressDashboardComponent', () => {
  beforeEach(() => {
    mockOnContinueLearning.mockClear();
    mockOnSelectTrack.mockClear();
  });

  it('renders without crashing and displays the main title', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    expect(screen.getByText(/Your Learning Progress/i)).toBeInTheDocument();
  });

  it('displays all tracks with their names, progress, and status', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    tracksData.forEach(track => {
      expect(screen.getByText(track.name)).toBeInTheDocument();
      expect(screen.getByText(`${track.progress}% complete`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(track.status, "i"))).toBeInTheDocument();
    });
    // Check that correct number of progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar'); // Assuming Progress component has this role
    expect(progressBars.length).toBe(tracksData.length);
  });

  it('displays recent achievements', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    expect(screen.getByText(/Recent Achievements/i)).toBeInTheDocument();
    achievementsData.forEach(achievement => {
      expect(screen.getByText(achievement.text)).toBeInTheDocument();
    });
  });

  it('calls onSelectTrack with the track name when a track card is clicked', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    const frontendTrackCard = screen.getByText(tracksData[0].name).closest('div.cursor-pointer');
    expect(frontendTrackCard).toBeInTheDocument();
    fireEvent.click(frontendTrackCard);
    expect(mockOnSelectTrack).toHaveBeenCalledTimes(1);
    expect(mockOnSelectTrack).toHaveBeenCalledWith(tracksData[0].name);
  });

  it('calls onContinueLearning when the "Continue Learning" button is clicked', () => {
    render(
      <ProgressDashboardComponent
        onContinueLearning={mockOnContinueLearning}
        onSelectTrack={mockOnSelectTrack}
      />
    );
    const continueButton = screen.getByRole('button', { name: /Continue Learning/i });
    fireEvent.click(continueButton);
    expect(mockOnContinueLearning).toHaveBeenCalledTimes(1);
  });
});
