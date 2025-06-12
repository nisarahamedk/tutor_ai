import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './button'; // Adjusted import path

test.use({ viewport: { width: 500, height: 500 } });

test('should render a button', async ({ mount }) => {
  const component = await mount(<Button>Click Me</Button>);
  await expect(component).toContainText('Click Me');
  await expect(component).toBeVisible();
});

test('should call onClick when clicked', async ({ mount }) => {
  let clicked = false;
  const component = await mount(
    <Button onClick={() => { clicked = true; }}>Click Me</Button>
  );
  await component.click();
  expect(clicked).toBe(true);
});
