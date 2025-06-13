'use client';

// Demo component to validate the new useActionState implementation
// This can be used for testing and demonstration purposes

import React from 'react';
import { AITutorChatWithActions } from './AITutorChatWithActions';

export function AITutorChatDemo() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          🚀 React 19 useActionState Demo
        </h2>
        <p className="text-blue-700 text-sm">
          This is the new AITutorChat component using React 19's useActionState pattern 
          with Server Actions for enhanced form handling and error recovery.
        </p>
        <div className="mt-2 flex gap-4 text-xs text-blue-600">
          <span>✅ Server Actions</span>
          <span>✅ Automatic Pending States</span>
          <span>✅ Enhanced Error Handling</span>
          <span>✅ Retry Logic</span>
        </div>
      </div>
      
      <AITutorChatWithActions />
      
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <strong>Testing Features:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Try sending messages to test server actions</li>
          <li>• Network errors will show retry options</li>
          <li>• Form submission uses FormData automatically</li>
          <li>• Pending states are handled by useActionState</li>
          <li>• Error boundaries catch component failures</li>
        </ul>
      </div>
    </div>
  );
}