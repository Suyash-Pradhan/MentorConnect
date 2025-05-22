"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { answerFAQ, type AnswerFAQInput, type AnswerFAQOutput } from "@/ai/flows/faq-chatbot"; // Ensure this path is correct
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  // Initial bot message
  React.useEffect(() => {
    setMessages([
      {
        id: "init-bot",
        text: "Hello! I'm the MentorConnect FAQ Chatbot. How can I help you today? Ask me anything about the platform.",
        sender: "bot",
        timestamp: new Date(),
      }
    ]);
  }, []);


  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const input: AnswerFAQInput = { question: userMessage.text };
      const response: AnswerFAQOutput = await answerFAQ(input); // Call your GenAI function

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: response.answer,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching FAQ answer:", error);
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        text: "Sorry, I encountered an error trying to answer your question. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        variant: "destructive",
        title: "Chatbot Error",
        description: "Could not get a response from the chatbot.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl flex flex-col h-[70vh] min-h-[400px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Icons.chatbot className="h-6 w-6 text-primary" />
          MentorConnect FAQ Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-2",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="https://placehold.co/100x100.png?text=🤖" alt="Bot" data-ai-hint="robot friendly" />
                    <AvatarFallback>B</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={cn(
                      "text-xs mt-1",
                      message.sender === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
                    )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {/* In real app, use user's avatar */}
                    <AvatarImage src="https://placehold.co/100x100.png?text=U" alt="User" data-ai-hint="person generic" /> 
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end space-x-2 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="https://placehold.co/100x100.png?text=🤖" alt="Bot" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm shadow">
                  <Icons.spinner className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
