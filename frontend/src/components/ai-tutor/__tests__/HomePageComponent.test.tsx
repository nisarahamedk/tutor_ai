import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePageComponent from '../HomePageComponent';

// Mock next/navigation - not strictly needed for this version, but good for future
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the utils dependency - not strictly needed for this version, but good for future
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock Next.js Image component - not strictly needed for this version
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

describe('HomePageComponent', () => {
  // Props for the intended component
  const mockOnStartNewTrack = jest.fn();
  const mockOnContinueLearning = jest.fn();
  const mockOnStartReview = jest.fn();

  beforeEach(() => {
    mockOnStartNewTrack.mockClear();
    mockOnContinueLearning.mockClear();
    mockOnStartReview.mockClear();
  });

  // Test for the placeholder version (as currently in HomePageComponent.tsx)
  describe('Current Placeholder Version', () => {
    it('renders without crashing and contains a div element', () => {
      const { container } = render(<HomePageComponent />);
      expect(container.firstChild).toBeInTheDocument();
      // Based on current file, it's a DIV with an H1.
      // If props were passed, it might cause errors with the placeholder.
    });

    it('renders the "Home Page" heading', () => {
      render(<HomePageComponent />);
      const headingElement = screen.getByRole('heading', { name: /Home Page/i, level: 1 });
      expect(headingElement).toBeInTheDocument();
    });
  });

  // Tests for the INTENDED version of HomePageComponent (with props and buttons)
  // These tests will fail if run against the current placeholder component code.
  describe('Intended Functionality (with props and buttons)', () => {
    it('renders action buttons when props are provided', () => {
      render(
        <HomePageComponent
          onStartNewTrack={mockOnStartNewTrack}
          onContinueLearning={mockOnContinueLearning}
          onStartReview={mockOnStartReview}
        />
      );
      // These buttons are expected based on the mock in AITutorChat.test.tsx
      expect(screen.getByRole('button', { name: /Start New Track/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue Learning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Review/i })).toBeInTheDocument();
    });

    it('calls onStartNewTrack when "Start New Track" button is clicked', () => {
      render(
        <HomePageComponent
          onStartNewTrack={mockOnStartNewTrack}
          onContinueLearning={mockOnContinueLearning}
          onStartReview={mockOnStartReview}
        />
      );
      const startNewTrackButton = screen.getByRole('button', { name: /Start New Track/i });
      fireEvent.click(startNewTrackButton);
      expect(mockOnStartNewTrack).toHaveBeenCalledTimes(1);
    });

    it('calls onContinueLearning when "Continue Learning" button is clicked', () => {
      render(
        <HomePageComponent
          onStartNewTrack={mockOnStartNewTrack}
          onContinueLearning={mockOnContinueLearning}
          onStartReview={mockOnStartReview}
        />
      );
      const continueLearningButton = screen.getByRole('button', { name: /Continue Learning/i });
      fireEvent.click(continueLearningButton);
      expect(mockOnContinueLearning).toHaveBeenCalledTimes(1);
    });

    it('calls onStartReview when "Start Review" button is clicked', () => {
      render(
        <HomePageComponent
          onStartNewTrack={mockOnStartNewTrack}
          onContinueLearning={mockOnContinueLearning}
          onStartReview={mockOnStartReview}
        />
      );
      const startReviewButton = screen.getByRole('button', { name: /Start Review/i });
      fireEvent.click(startReviewButton);
      expect(mockOnStartReview).toHaveBeenCalledTimes(1);
    });

    it('renders some introductory text or welcome message (conceptual)', () => {
      // This test is conceptual as the actual content of the intended HomePageComponent is unknown.
      // It should ideally render more than just buttons.
      render(
        <HomePageComponent
          onStartNewTrack={mockOnStartNewTrack}
          onContinueLearning={mockOnContinueLearning}
          onStartReview={mockOnStartReview}
        />
      );
      // Example: expect(screen.getByText(/Welcome to your AI Tutor/i)).toBeInTheDocument();
      // For now, this is a placeholder for content other than the placeholder H1.
      // If the component ONLY renders buttons when props are passed, this test might be removed.
      // If it keeps the "Home Page" H1, then that's covered by the placeholder tests.
      // This test is to highlight that the component should have more content.
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // Check that buttons are there.
    });
  });
});
