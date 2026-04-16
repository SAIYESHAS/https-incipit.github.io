import React, { useState } from 'react';
import { PenTool, Sparkles, Lock, Send, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function WritingAdvice({ user, login }: { user: any, login: () => void }) {
  const [query, setQuery] = useState('');
  const [isPremium, setIsPremium] = useState(false); // Mock premium status

  const handleRequest = () => {
    if (!user) {
      login();
      return;
    }
    if (!isPremium) {
      alert("This is a premium feature. Please subscribe to access writing advice.");
      return;
    }
    // Handle advice request
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-16">
      <div className="text-center mb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-block px-4 py-1 mb-6 border border-border-dim text-[11px] font-bold uppercase tracking-[2px] text-accent"
        >
          Premium Feature
        </motion.div>
        <h2 className="text-5xl font-serif font-normal mb-6">The Bulletin</h2>
        <p className="text-text-dim text-lg max-w-2xl mx-auto italic font-serif">
          Expert writing advice from published authors and advanced AI mentors.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-1px bg-border-dim border border-border-dim mb-24">
        <div className="p-12 bg-bg">
          <div className="w-12 h-12 border border-accent/30 flex items-center justify-center mb-8">
            <Sparkles className="text-accent" size={24} />
          </div>
          <h3 className="text-xl font-serif mb-4">AI Manuscript Analysis</h3>
          <p className="text-text-dim text-[14px] leading-relaxed mb-8">
            Get instant, deep analysis of your writing style, pacing, and character development using our specialized literary AI.
          </p>
          <ul className="space-y-4 mb-10">
            {['Pacing & Flow', 'Character Arc Consistency', 'Thematic Depth', 'Style Refinement'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[12px] uppercase tracking-[1px] text-text">
                <div className="w-1 h-1 bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-12 bg-bg">
          <div className="w-12 h-12 border border-accent/30 flex items-center justify-center mb-8">
            <PenTool className="text-accent" size={24} />
          </div>
          <h3 className="text-xl font-serif mb-4">Human Expert Review</h3>
          <p className="text-text-dim text-[14px] leading-relaxed mb-8">
            Connect with published authors and professional editors for personalized feedback on your work.
          </p>
          <ul className="space-y-4 mb-10">
            {['One-on-One Mentorship', 'Query Letter Review', 'Marketability Assessment', 'Structural Editing'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[12px] uppercase tracking-[1px] text-text">
                <div className="w-1 h-1 bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-surface border border-border-dim p-12">
        <h3 className="text-center text-[12px] uppercase tracking-[2px] text-text-dim mb-10">Submit for Review</h3>
        <div className="relative">
          <textarea 
            placeholder="Tell us about your project or paste a sample (max 1000 words)..."
            rows={6}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-8 py-6 bg-black border border-border-dim text-text text-[14px] mb-10 focus:outline-none focus:border-accent resize-none leading-relaxed"
          />
          {!isPremium && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center mb-10">
              <div className="text-center">
                <Lock className="mx-auto mb-3 text-accent" size={24} />
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-accent">Premium Access Required</p>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={handleRequest}
          className="w-full bg-accent text-black py-5 text-[13px] font-bold uppercase tracking-[2px] hover:opacity-90 transition-all"
        >
          {isPremium ? 'Submit for Review' : 'Upgrade to Access'}
        </button>
        <p className="text-center text-[10px] text-text-dim mt-6 uppercase tracking-[1px]">
          Requires active <span className="text-accent">Premium Subscription</span>
        </p>
      </div>
    </div>
  );
}
