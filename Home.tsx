import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User as UserIcon, Bot, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot({ user }: { user: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello. I can explain specific passages or provide deeper thematic analysis. What would you like to explore today?" }
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
          systemInstruction: "You are a highly knowledgeable literary assistant. You have read thousands of books by famous authors like John Green, Colleen Hoover, George Orwell, etc. You provide deep insights, explain complex passages, and summarize books accurately. Keep your tone professional yet engaging."
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
    <div className="max-w-4xl mx-auto px-10 py-16 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-serif font-normal mb-2 flex items-center gap-3">
            <Sparkles className="text-accent" size={24} />
            AI Literary Assistant
          </h2>
          <p className="text-text-dim text-sm tracking-[1px] uppercase">Deep insights into thousands of books</p>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: "Chat cleared. How can I help you now?" }])}
          className="p-2 text-text-dim hover:text-accent transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-surface border border-border-dim p-8 mb-8 space-y-8 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' ? 'border-text-dim' : 'border-accent'
                }`}>
                  {msg.role === 'user' ? (
                    <UserIcon size={14} className="text-text-dim" />
                  ) : (
                    <Bot size={14} className="text-accent" />
                  )}
                </div>
                <div className={`p-4 text-[13px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-white/5 text-text border border-border-dim' 
                    : 'bg-accent/10 border-l-2 border-accent text-text'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-accent">
                <Bot size={14} className="text-accent" />
              </div>
              <div className="p-4 bg-accent/10 border-l-2 border-accent">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about a specific text..."
          className="w-full pl-6 pr-16 py-4 bg-black border border-border-dim text-text text-[13px] focus:outline-none focus:border-accent transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-accent hover:opacity-80 disabled:opacity-30 transition-all"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
