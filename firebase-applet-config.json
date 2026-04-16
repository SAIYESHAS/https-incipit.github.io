import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User as UserIcon, Bot, Trash2, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface BookChatProps {
  book: {
    title: string;
    author: string;
    summary: string;
    fullOverview?: string;
  };
}

export default function BookChat({ book }: BookChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello! I'm your AI assistant for "${book.title}". Ask me anything about the themes, characters, or plot of this book.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `You are a highly knowledgeable literary assistant. You are currently helping a user explore the book "${book.title}" by ${book.author}. 
          Context about the book: ${book.fullOverview || book.summary}.
          Provide deep insights, explain complex passages, and analyze themes related to this specific book. Keep your tone professional yet engaging.`
        }
      });

      const modelResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/50 border-l border-border-dim">
      <div className="p-4 border-b border-border-dim flex justify-between items-center bg-surface">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent" size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-text">AI Book Analysis</span>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: `Chat cleared. How can I help you with "${book.title}"?` }])}
          className="text-text-dim hover:text-accent transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' ? 'border-text-dim' : 'border-accent'
                }`}>
                  {msg.role === 'user' ? (
                    <UserIcon size={10} className="text-text-dim" />
                  ) : (
                    <Bot size={10} className="text-accent" />
                  )}
                </div>
                <div className={`p-3 text-[12px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-white/5 text-text border border-border-dim' 
                    : 'bg-accent/5 border-l border-accent text-text'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[90%]">
              <div className="w-6 h-6 flex items-center justify-center shrink-0 border border-accent">
                <Bot size={10} className="text-accent" />
              </div>
              <div className="p-3 bg-accent/5 border-l border-accent">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-dim bg-surface">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI about this book..."
            className="w-full pl-4 pr-10 py-2 bg-black border border-border-dim text-text text-[12px] focus:outline-none focus:border-accent transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accent hover:opacity-80 disabled:opacity-30 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
