import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock FastAPI endpoints
  http.post('/api/chat/send', async () => {
    // const body = await request.json(); // If you need to inspect the body
    return HttpResponse.json({
      response: 'This is a mock AI response',
      messageId: 'mock-message-id',
      timestamp: new Date().toISOString()
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
  })
];

export const server = setupServer(...handlers);
