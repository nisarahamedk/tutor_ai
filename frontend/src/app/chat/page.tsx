import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow">
        <h1 className="text-xl font-semibold">AI Tutor Chat</h1>
      </header>

      {/* Message Display Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Placeholder for messages */}
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">No messages yet. Start typing!</p>
        </div>
        {/* Example Messages (static) */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-end">
            <div className="bg-muted p-3 rounded-lg max-w-xs">
              <p className="text-sm">Hello! How can I help you today?</p>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
              <p className="text-sm">I have a question about Next.js.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Message Input Area */}
      <footer className="bg-background border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-1"
            aria-label="Chat message input"
          />
          <Button type="submit" aria-label="Send message">
            Send
          </Button>
        </div>
      </footer>
    </div>
  );
}
