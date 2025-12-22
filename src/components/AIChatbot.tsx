import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Initial suggestions when chat starts
const INITIAL_SUGGESTIONS = [
  "What products do you sell?",
  "Tell me about Basmati Rice",
  "What are the prices?",
  "How to place a bulk order?",
  "Do you have cattle feed?",
];

// Context-based suggestions after certain topics
const CONTEXTUAL_SUGGESTIONS: Record<string, string[]> = {
  rice: [
    "Which rice is best for biryani?",
    "What's the difference between Basmati and Sona Masoori?",
    "Do you offer bulk discounts on rice?",
  ],
  price: [
    "What's the minimum order quantity?",
    "Do you offer wholesale prices?",
    "Any discounts for regular customers?",
  ],
  order: [
    "How can I track my order?",
    "What are the delivery options?",
    "Can I cancel my order?",
  ],
  product: [
    "Tell me about wheat atta",
    "What is Chokar used for?",
    "Do you have organic products?",
  ],
  feed: [
    "What's in the cattle feed?",
    "How much cattle feed should I order?",
    "Is it suitable for cows?",
  ],
};

const getSuggestionsForContext = (messages: Message[]): string[] => {
  if (messages.length === 0) return INITIAL_SUGGESTIONS;
  
  const lastMessages = messages.slice(-3).map(m => m.content.toLowerCase()).join(' ');
  
  // Check for context keywords
  if (lastMessages.includes('rice') || lastMessages.includes('basmati') || lastMessages.includes('sona')) {
    return CONTEXTUAL_SUGGESTIONS.rice;
  }
  if (lastMessages.includes('price') || lastMessages.includes('cost') || lastMessages.includes('₹')) {
    return CONTEXTUAL_SUGGESTIONS.price;
  }
  if (lastMessages.includes('order') || lastMessages.includes('delivery') || lastMessages.includes('track')) {
    return CONTEXTUAL_SUGGESTIONS.order;
  }
  if (lastMessages.includes('cattle') || lastMessages.includes('feed') || lastMessages.includes('kapila')) {
    return CONTEXTUAL_SUGGESTIONS.feed;
  }
  if (lastMessages.includes('product') || lastMessages.includes('atta') || lastMessages.includes('chokar')) {
    return CONTEXTUAL_SUGGESTIONS.product;
  }
  
  // Default suggestions after some conversation
  return [
    "Tell me more about your products",
    "How do I contact you?",
    "What are your best sellers?",
  ];
};

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const currentSuggestions = getSuggestionsForContext(messages);

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] flex flex-col shadow-2xl border-2 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Sandeep AI Assistant</h3>
                <p className="text-sm opacity-80">Ask about products & orders</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Hello! How can I help you today?</p>
                <p className="text-xs mt-1 mb-4">Ask about our rice, atta, or cattle feed products</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-background border rounded-bl-md'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-background border rounded-2xl rounded-bl-md px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {!isLoading && (
            <div className="px-3 py-2 border-t bg-muted/20">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Quick questions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors truncate max-w-full"
                    title={suggestion}
                  >
                    {suggestion.length > 30 ? suggestion.slice(0, 30) + '...' : suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-background rounded-b-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
};
