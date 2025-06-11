import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveLessonComponent } from '../InteractiveLessonComponent'; // Named import

// Mock ResizeObserver for Radix UI components (e.g., Progress)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/navigation (not directly used, but good practice)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock @/lib/utils (used by child UI components)
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock Next.js Image component (not used)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} alt={props.alt || ''} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: (props) => <svg data-testid="play-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
}));

// Mock the mockApi
const mockRunCode = jest.fn();
const mockSubmitCode = jest.fn();
// Path adjusted to be discoverable via moduleDirectories
jest.mock('@/lib/api-mocks', () => ({
  mockApi: {
    runCode: (code) => mockRunCode(code),
    submitCode: (lessonId, code) => mockSubmitCode(lessonId, code),
  },
}));

// Mock window.alert
global.alert = jest.fn();

describe('InteractiveLessonComponent', () => {
  beforeEach(() => {
    mockRunCode.mockClear();
    mockSubmitCode.mockClear();
    (global.alert as jest.Mock).mockClear();
  });

  it('renders initial lesson content, task, and code editor', () => {
    render(<InteractiveLessonComponent />);
    expect(screen.getByText(/Interactive Lesson: JavaScript Functions/i)).toBeInTheDocument();
    expect(screen.getByText(/Understanding Functions/i)).toBeInTheDocument(); // Step title
    expect(screen.getByText(/Functions are reusable blocks of code/i)).toBeInTheDocument(); // Step content
    expect(screen.getByText(/Task: Complete the greet function/i)).toBeInTheDocument(); // Step task
    expect(screen.getByRole('textbox')).toBeInTheDocument(); // Textarea for code
    expect(screen.getByRole('textbox')).toHaveValue('function greet(name) {\n  // Your code here\n}');
  });

  it('allows user to type in the code editor', () => {
    render(<InteractiveLessonComponent />);
    const codeEditor = screen.getByRole('textbox');
    fireEvent.change(codeEditor, { target: { value: 'console.log("hello");' } });
    expect(codeEditor).toHaveValue('console.log("hello");');
  });

  it('calls mockApi.runCode and alerts result on "Run Code" button click (success)', async () => {
    mockRunCode.mockResolvedValue({ output: 'Hello, Test!' });
    render(<InteractiveLessonComponent />);
    const codeEditor = screen.getByRole('textbox');
    const newCode = 'function greet(name) { return `Hello, ${name}!`; } greet("Test");';
    fireEvent.change(codeEditor, { target: { value: newCode } });

    const runButton = screen.getByRole('button', { name: /Run Code/i });
    fireEvent.click(runButton);

    await waitFor(() => expect(mockRunCode).toHaveBeenCalledWith(newCode));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Output: Hello, Test!'));
  });

  it('calls mockApi.runCode and alerts error on "Run Code" button click (error)', async () => {
    mockRunCode.mockResolvedValue({ error: 'Syntax Error' });
    render(<InteractiveLessonComponent />);
    const codeEditor = screen.getByRole('textbox');
    const errorCode = 'function greet(name) { return Hello, ${name}!; }'; // Syntax error
    fireEvent.change(codeEditor, { target: { value: errorCode } });

    const runButton = screen.getByRole('button', { name: /Run Code/i });
    fireEvent.click(runButton);

    await waitFor(() => expect(mockRunCode).toHaveBeenCalledWith(errorCode));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Error: Syntax Error'));
  });

  it('calls mockApi.submitCode and alerts feedback on "Submit" button click (correct)', async () => {
    mockSubmitCode.mockResolvedValue({ correct: true, feedback: 'Well done!' });
    render(<InteractiveLessonComponent />);
    const codeEditor = screen.getByRole('textbox');
    const correctCode = 'function greet(name) { return `Hello, ${name}!`; }';
    fireEvent.change(codeEditor, { target: { value: correctCode } });

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(mockSubmitCode).toHaveBeenCalledWith('jsFunctionsIntro', correctCode));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Feedback: Well done!'));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Correct! You can move to the next part of the lesson (if available).'));
  });

  it('calls mockApi.submitCode and alerts feedback on "Submit" button click (incorrect)', async () => {
    mockSubmitCode.mockResolvedValue({ correct: false, feedback: 'Try again.' });
    render(<InteractiveLessonComponent />);
    const codeEditor = screen.getByRole('textbox');
    const incorrectCode = 'function greet(name) { return "Hi"; }';
    fireEvent.change(codeEditor, { target: { value: incorrectCode } });

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(mockSubmitCode).toHaveBeenCalledWith('jsFunctionsIntro', incorrectCode));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Feedback: Try again.'));
    // Ensure the "Correct!" alert is not called
    await waitFor(() => expect(global.alert).not.toHaveBeenCalledWith(expect.stringContaining('Correct!')));
  });
});
