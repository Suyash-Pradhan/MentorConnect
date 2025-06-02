
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { ChatMessage, ChatSession, Profile } from "@/types";
import { getMessages, sendMessage, getChatSession } from "@/services/chatService";
import { getProfile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, profileLoading } = useUserProfile();
  
  const chatId = params?.chatId as string;

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = React.useState<ChatSession | null>(null);
  const [chatPartner, setChatPartner] = React.useState<Profile | null>(null);
  const [newMessageText, setNewMessageText] = React.useState("");
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingChatDetails, setIsLoadingChatDetails] = React.useState(true);

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Scroll to bottom when new messages are added or messages load
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoadingMessages]);

  React.useEffect(() => {
    if (!chatId || !userProfile) return;

    const fetchChatData = async () => {
      setIsLoadingChatDetails(true);
      setIsLoadingMessages(true);
      try {
        const session = await getChatSession(chatId);
        setChatSession(session);

        if (session) {
          const partnerId = session.participantIds.find(id => id !== userProfile.id);
          if (partnerId) {
            const partnerProfile = await getProfile(partnerId);
            setChatPartner(partnerProfile);
          }
        } else {
          toast({ variant: "destructive", title: "Error", description: "Chat session not found." });
          router.push("/dashboard"); // Or some other appropriate page
          return;
        }
        
        const fetchedMessages = await getMessages(chatId);
        setMessages(fetchedMessages);

      } catch (error) {
        console.error("Error fetching chat data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load chat." });
      } finally {
        setIsLoadingChatDetails(false);
        setIsLoadingMessages(false);
      }
    };

    fetchChatData();
  }, [chatId, userProfile, toast, router]);

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !userProfile || !chatId) return;
    setIsSending(true);
    
    const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatId: chatId,
        senderId: userProfile.id,
        senderName: userProfile.name,
        senderAvatar: userProfile.avatarUrl,
        text: newMessageText.trim(),
        createdAt: new Date(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    const currentInput = newMessageText;
    setNewMessageText("");

    try {
      await sendMessage(chatId, userProfile.id, currentInput.trim());
      // Optionally re-fetch messages for consistency, or rely on future real-time updates
      // For now, optimistic update is fine.
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // Revert optimistic
      setNewMessageText(currentInput); // Restore input
    } finally {
      setIsSending(false);
    }
  };
  
  if (profileLoading || isLoadingChatDetails) {
    return (
      <div className="w-full h-[calc(100vh-10rem)] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-3 border-b p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-20" />
        </CardHeader>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Skeleton className="h-16 w-3/4 rounded-lg self-start" />
            <Skeleton className="h-12 w-2/3 rounded-lg self-end ml-auto" />
            <Skeleton className="h-20 w-3/4 rounded-lg self-start" />
        </div>
        <CardFooter className="p-4 border-t">
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="p-4 text-center">Please log in to view chats.</div>;
  }

  if (!chatSession && !isLoadingChatDetails) {
     return (
        <div className="w-full text-center py-10">
            <Icons.warning className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold">Chat Not Found</h2>
            <p className="text-muted-foreground">This chat session could not be loaded or does not exist.</p>
            <Button asChild className="mt-4"><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
     );
  }
  
  const partnerName = chatPartner?.name || "Chat Partner";
  const partnerAvatar = chatPartner?.avatarUrl;
  const partnerInitial = partnerName ? partnerName.charAt(0).toUpperCase() : "?";

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl flex flex-col h-[calc(100vh-8rem)] min-h-[500px]">
      <CardHeader className="border-b flex flex-row items-center gap-3 p-4 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => router.back()}>
            <Icons.chevronLeft className="h-5 w-5"/>
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerAvatar} alt={partnerName} data-ai-hint="person professional"/>
          <AvatarFallback>{partnerInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <CardTitle className="text-lg">{partnerName}</CardTitle>
            {chatPartner?.role && <p className="text-xs text-muted-foreground capitalize">{chatPartner.role}</p>}
        </div>
         <Button variant="outline" size="sm" asChild>
            <Link href={`/profile/${chatPartner?.id || ''}`}>View Profile</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
                <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end space-x-2",
                    message.senderId === userProfile.id ? "justify-end" : "justify-start"
                  )}
                >
                  {message.senderId !== userProfile.id && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.senderAvatar || partnerAvatar} alt={message.senderName || partnerName} data-ai-hint="person"/>
                      <AvatarFallback>{(message.senderName || partnerName)?.charAt(0)?.toUpperCase() || 'P'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                      message.senderId === userProfile.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                     <p className={cn(
                        "text-xs mt-1",
                        message.senderId === userProfile.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
                      )}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.senderId === userProfile.id && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name || "Me"} data-ai-hint="person self"/>
                      <AvatarFallback>{userProfile.name?.charAt(0)?.toUpperCase() || 'M'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t sticky bottom-0 bg-background z-10">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
            disabled={isSending || isLoadingMessages || isLoadingChatDetails}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isSending || isLoadingMessages || isLoadingChatDetails || !newMessageText.trim()}>
            {isSending ? (
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
