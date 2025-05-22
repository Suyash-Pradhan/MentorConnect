import { ChatInterface } from "@/components/chatbot/chat-interface";

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center h-full">
       <div className="w-full"> {/* This div ensures ChatInterface can take full width up to its max-w */}
        <ChatInterface />
      </div>
    </div>
  );
}
