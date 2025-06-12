# Component Testing Guidelines

## Testing Philosophy
- Test behavior, not implementation
- Use TDD approach: Red → Green → Refactor
- Focus on user interactions and outcomes
- Mock external dependencies

## Example Test Structure
```typescript
import { render, screen, userEvent, vi } from '@/test-utils/render-helpers'; // Assuming render-helpers exports these
import YourComponent from './YourComponent'; // Adjust path to your component

describe('ComponentName', () => {
  // Arrange
  const defaultProps = {
    // ... your default props
  };

  // Test happy path
  it('should render correctly with default props', () => {
    render(<YourComponent {...defaultProps} />);
    // Example assertion:
    // expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
  });

  // Test user interactions
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<YourComponent {...defaultProps} onClick={handleClick} />);

    // Example interaction:
    // await userEvent.click(screen.getByRole('button', { name: /Submit/i }));
    // expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test error states
  it('should display error message when error occurs', () => {
    // Example: render with an error prop or mock a hook to return an error
    render(<YourComponent {...defaultProps} error="Test error" />);
    // expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```
