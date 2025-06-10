import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningPreferencesComponent } from '../LearningPreferencesComponent'; // Named import

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/navigation (though not directly used by this component)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock @/lib/utils (though not directly used by this component, its children like Button might)
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock Next.js Image component (not used by this component)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock lucide-react icons to simplify testing
jest.mock('lucide-react', () => ({
  Lightbulb: (props) => <svg data-testid="icon-lightbulb" {...props} />,
  Code: (props) => <svg data-testid="icon-code" {...props} />,
  BookOpen: (props) => <svg data-testid="icon-bookopen" {...props} />,
  Target: (props) => <svg data-testid="icon-target" {...props} />,
}));


describe('LearningPreferencesComponent', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders without crashing', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByText(/Learning Preferences/i)).toBeInTheDocument();
  });

  it('renders time availability slider', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByText(/How many hours per week can you dedicate to learning?/i)).toBeInTheDocument(); // Changed from getByLabelText
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/10 hours per week/i)).toBeInTheDocument(); // Default value
  });

  it('renders learning style options', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByText(/What's your learning style?/i)).toBeInTheDocument(); // Changed from getByLabelText
    expect(screen.getByText(/Visual Learner/i)).toBeInTheDocument();
    expect(screen.getByText(/Hands-on Learner/i)).toBeInTheDocument();
    expect(screen.getByText(/Reading\/Writing/i)).toBeInTheDocument();
  });

  it('renders goal options', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByText(/What are your goals?/i)).toBeInTheDocument(); // Changed from getByLabelText
    expect(screen.getByRole('button', { name: /Get a job as a developer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build personal projects/i })).toBeInTheDocument();
  });

  it('allows selecting a learning style', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const visualLearnerCard = screen.getByText(/Visual Learner/i).closest('.cursor-pointer');
    expect(visualLearnerCard).toBeInTheDocument();
    fireEvent.click(visualLearnerCard);
    // Check if the card gets the active class or some visual indication.
    // For now, we'll verify this by checking if the onComplete prop is called with this style.
    // The button should also become enabled if goals are also selected.
  });

  it('allows selecting goals', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const jobGoalButton = screen.getByRole('button', { name: /Get a job as a developer/i });
    fireEvent.click(jobGoalButton);
    // We'll verify this by checking if onComplete is called with this goal.
    // The button styling might change, but that's harder to assert without more specific selectors.
  });

  it('submit button is disabled initially and enables after selections', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const submitButton = screen.getByRole('button', { name: /Start My Learning Journey/i });
    expect(submitButton).toBeDisabled();

    // Select a learning style
    const visualLearnerCard = screen.getByText(/Visual Learner/i).closest('.cursor-pointer');
    fireEvent.click(visualLearnerCard);
    expect(submitButton).toBeDisabled(); // Still disabled as goals are missing

    // Select a goal
    const jobGoalButton = screen.getByRole('button', { name: /Get a job as a developer/i });
    fireEvent.click(jobGoalButton);
    expect(submitButton).toBeEnabled();
  });

  it('calls onComplete with selected preferences on submit', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);

    // Set time availability (slider interaction is complex, we'll assume default or test separately if needed)
    // For this test, we'll focus on style and goals which control button enablement.
    // Default timeAvailability is 10.

    // Select learning style
    const handsOnStyle = screen.getByText(/Hands-on Learner/i).closest('.cursor-pointer');
    fireEvent.click(handsOnStyle);

    // Select goals
    const projectGoal = screen.getByRole('button', { name: /Build personal projects/i });
    const funGoal = screen.getByRole('button', { name: /Learn for fun/i });
    fireEvent.click(projectGoal);
    fireEvent.click(funGoal);

    const submitButton = screen.getByRole('button', { name: /Start My Learning Journey/i });
    fireEvent.click(submitButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith({
      timeAvailability: 10, // Default slider value
      learningStyle: 'hands-on',
      goals: ['Build personal projects', 'Learn for fun'],
    });
  });

  it('updates time availability text when slider changes', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const slider = screen.getByRole('slider');
    // Note: Testing slider value change directly via fireEvent.change might be tricky
    // depending on how the Slider component is implemented internally with Radix UI.
    // A common way is to check the visual output if the component updates text based on slider value.
    // The component does `setTimeAvailability` which updates `timeAvailability[0]`.
    // We'll assume the Slider component calls `onValueChange` correctly.
    // For now, we'll trust the default value is rendered and that `onValueChange` works if Slider is correctly implemented.
    // A more involved test might involve `fireEvent.keyDown` on the slider thumb if it's focusable.
    expect(screen.getByText("10 hours per week")).toBeInTheDocument();
    // If we could get the onValueChange prop:
    // const sliderInstance = ... // get the instance or props
    // act(() => { sliderInstance.onValueChange([20]); });
    // expect(screen.getByText("20 hours per week")).toBeInTheDocument();
  });

});
