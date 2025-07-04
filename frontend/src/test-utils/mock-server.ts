import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock handlers for Next.js API routes in isolated frontend development
  
  http.post('/api/chat/send', async () => {
    // const body = await request.json(); // If you need to inspect the body
    return HttpResponse.json({
      id: 'mock-message-id',
      role: 'assistant',
      content: 'This is a mock AI response from Next.js API',
      timestamp: new Date().toISOString()
    });
  }),

  http.get('/api/chat/history', () => {
    return HttpResponse.json([
      {
        id: 'mock-1',
        role: 'user',
        content: 'Mock user message',
        timestamp: new Date().toISOString()
      },
      {
        id: 'mock-2',
        role: 'assistant',
        content: 'Mock assistant response',
        timestamp: new Date().toISOString()
      }
    ]);
  }),

  http.delete('/api/chat/history', async () => {
    return HttpResponse.json({
      success: true,
      message: 'Chat history cleared'
    });
  }),

  http.get('/api/learning/tracks', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Frontend Development',
        description: 'Learn modern frontend development',
        progress: 0
      }
    ]);
  }),

  http.put('/api/learning/tracks/:trackId/progress', async () => {
    // const { trackId } = params; // If you need to use the trackId
    // const body = await request.json(); // If you need to inspect the body
    return HttpResponse.json({
      success: true,
      progress: 50
    });
  }),

  // Mock assessment endpoints
  http.get('/api/assessments/available', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Frontend Assessment',
        description: 'Test your frontend skills',
        difficulty: 'Beginner',
        estimatedTime: 15,
        isCompleted: false,
        attemptsUsed: 0,
        maxAttempts: 3
      }
    ]);
  }),

  http.get('/api/assessments/:assessmentId', () => {
    return HttpResponse.json({
      id: '1',
      title: 'Frontend Assessment',
      description: 'Test your frontend skills',
      timeLimit: 30,
      questions: [],
      passingScore: 70,
      maxRetries: 3
    });
  }),

  http.post('/api/assessments/submit', async () => {
    return HttpResponse.json({
      id: 'result-1',
      score: 85,
      passed: true,
      submittedAt: new Date().toISOString()
    });
  })
];

export const server = setupServer(...handlers);
