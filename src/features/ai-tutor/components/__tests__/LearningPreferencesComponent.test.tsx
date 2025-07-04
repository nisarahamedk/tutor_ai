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

// Mock the Slider component
let mockSliderOnValueChangeCallback;
jest.mock('@/components/ui/slider', () => ({
  Slider: jest.fn(({ value, onValueChange, max, min }) => {
    mockSliderOnValueChangeCallback = onValueChange; // Capture the callback
    return (
      <div role="slider" aria-valuenow={value[0]} aria-valuemin={min} aria-valuemax={max} data-testid="mock-slider">
        Mock Slider
      </div>
    );
  }),
}));

describe('LearningPreferencesComponent', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockSliderOnValueChangeCallback = null;
  });

  it('renders main title as a heading and all sections correctly', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByRole('heading', { name: /Learning Preferences/i })).toBeInTheDocument();
    expect(screen.getByText(/Let's customize your learning experience/i)).toBeInTheDocument();

    // Time Availability
    expect(screen.getByText(/How many hours per week can you dedicate to learning?/i)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText("10 hours per week")).toBeInTheDocument(); // Default

    // Learning Style
    expect(screen.getByText(/What's your learning style?/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Learner/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-lightbulb')).toBeInTheDocument();

    // Goals
    expect(screen.getByText(/What are your goals?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get a job as a developer/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-target').length).toBeGreaterThan(0); // Checks Target icon is present for goals
  });

  it('updates time availability text and value when slider changes', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    expect(screen.getByText("10 hours per week")).toBeInTheDocument();

    // Simulate slider change using the captured callback
    if (mockSliderOnValueChangeCallback) {
      mockSliderOnValueChangeCallback([25]);
    }
    expect(screen.getByText("25 hours per week")).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25');

    // Submit to check payload
    // Need to select style and goals first for button to be enabled
    fireEvent.click(screen.getByText(/Visual Learner/i).closest('.cursor-pointer'));
    fireEvent.click(screen.getByRole('button', { name: /Learn for fun/i }));
    fireEvent.click(screen.getByRole('button', { name: /Start My Learning Journey/i }));

    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({ timeAvailability: 25 }));
  });

  it('allows selecting one learning style and reflects selection visually', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const visualStyleCard = screen.getByText(/Visual Learner/i).closest('div.cursor-pointer');
    const handsOnStyleCard = screen.getByText(/Hands-on Learner/i).closest('div.cursor-pointer');

    fireEvent.click(visualStyleCard);
    expect(visualStyleCard).toHaveClass('border-primary');
    expect(handsOnStyleCard).not.toHaveClass('border-primary');

    fireEvent.click(handsOnStyleCard);
    expect(handsOnStyleCard).toHaveClass('border-primary');
    expect(visualStyleCard).not.toHaveClass('border-primary');

    // Submit to check payload
    fireEvent.click(screen.getByRole('button', { name: /Learn for fun/i }));
    fireEvent.click(screen.getByRole('button', { name: /Start My Learning Journey/i }));
    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({ learningStyle: 'hands-on' }));
  });

  it('allows selecting and deselecting multiple goals and reflects selection visually', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const jobGoalButton = screen.getByRole('button', { name: /Get a job as a developer/i });
    const projectGoalButton = screen.getByRole('button', { name: /Build personal projects/i });

    // Select job goal
    fireEvent.click(jobGoalButton);
    // Assuming 'variant="default"' adds a specific class like 'bg-primary' or similar not 'bg-slate-900' (depends on actual Button impl.)
    // For ShadCN, active outline button might be `bg-accent text-accent-foreground`
    // And default variant might be `bg-primary text-primary-foreground`
    // We need to check the actual class names from the component's 'Button' variant implementation or use aria-pressed.
    // For now, we check if it's NOT outline (default variant means selected)
    expect(jobGoalButton).not.toHaveClass('border-border'); // Approximation for selected state (not outline)

    // Select project goal
    fireEvent.click(projectGoalButton);
    expect(projectGoalButton).not.toHaveClass('border-border');

    // Deselect job goal
    fireEvent.click(jobGoalButton);
    expect(jobGoalButton).toHaveClass('border-border'); // Approximation for outline state (deselected)

    // Submit to check payload
    fireEvent.click(screen.getByText(/Visual Learner/i).closest('.cursor-pointer'));
    fireEvent.click(screen.getByRole('button', { name: /Start My Learning Journey/i }));
    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({ goals: ['Build personal projects'] }));
  });

  it('submit button enables only when learning style and at least one goal are selected', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);
    const submitButton = screen.getByRole('button', { name: /Start My Learning Journey/i });
    const visualStyle = screen.getByText(/Visual Learner/i).closest('.cursor-pointer');
    const jobGoal = screen.getByRole('button', { name: /Get a job as a developer/i });

    expect(submitButton).toBeDisabled();

    fireEvent.click(visualStyle);
    expect(submitButton).toBeDisabled(); // Only style selected

    fireEvent.click(jobGoal);
    expect(submitButton).toBeEnabled(); // Both selected

    fireEvent.click(jobGoal); // Deselect goal
    expect(submitButton).toBeDisabled(); // Goal deselected
  });

  it('calls onComplete with all selected preferences on submit', () => {
    render(<LearningPreferencesComponent onComplete={mockOnComplete} />);

    // Set time (using mock)
    if (mockSliderOnValueChangeCallback) mockSliderOnValueChangeCallback([15]);

    // Select style
    fireEvent.click(screen.getByText(/Hands-on Learner/i).closest('.cursor-pointer'));

    // Select goals
    fireEvent.click(screen.getByRole('button', { name: /Build personal projects/i }));
    fireEvent.click(screen.getByRole('button', { name: /Learn for fun/i }));

    fireEvent.click(screen.getByRole('button', { name: /Start My Learning Journey/i }));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith({
      timeAvailability: 15,
      learningStyle: 'hands-on',
      goals: ['Build personal projects', 'Learn for fun'],
    });
  });
});

