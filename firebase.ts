import React from 'react';
import { Check, CreditCard, Star, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Subscription({ user, login }: { user: any, login: () => void }) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Basic access to book summaries and community discussions.',
      features: ['10 Summaries/Month', 'Community Access', 'Basic AI Chat', 'Public Profile'],
      buttonText: 'Current Plan',
      accent: false
    },
    {
      name: 'Monthly',
      price: '$9.99',
      period: 'Per Month',
      description: 'Full access to all features with monthly flexibility.',
      features: ['Unlimited Summaries', 'Priority AI Analysis', 'The Bulletin Access', 'Expert Reviews', 'Ad-Free Experience'],
      buttonText: 'Upgrade Now',
      accent: true
    },
    {
      name: 'Annual',
      price: '$89.99',
      period: 'Per Year',
      description: 'Best value for dedicated readers and aspiring writers.',
      features: ['Everything in Monthly', '2 Months Free', 'Exclusive Webinars', 'Manuscript Feedback', 'VIP Support'],
      buttonText: 'Get Annual',
      accent: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-10 py-16">
      <div className="text-center mb-24">
        <h2 className="text-5xl font-serif font-normal mb-6">Premium Access</h2>
        <p className="text-text-dim text-lg max-w-2xl mx-auto italic font-serif">
          Unlock the full potential of the Literary Insight Engine.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-1px bg-border-dim border border-border-dim mb-24">
        {plans.map((plan, i) => (
          <div key={i} className={`p-12 bg-bg flex flex-col ${plan.accent ? 'relative' : ''}`}>
            {plan.name === 'Annual' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-black text-[10px] font-bold px-4 py-1 uppercase tracking-[2px]">
                Best Value
              </div>
            )}
            <div className="mb-10">
              <h3 className="text-[12px] uppercase tracking-[2px] text-text-dim mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-serif">{plan.price}</span>
                <span className="text-text-dim text-sm italic font-serif">{plan.period}</span>
              </div>
              <p className="text-text-dim text-[14px] leading-relaxed">{plan.description}</p>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-[12px] uppercase tracking-[1px] text-text">
                  <div className={`w-1 h-1 ${plan.accent ? 'bg-accent' : 'bg-text-dim'}`} />
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => !user && login()}
              className={`w-full py-4 text-[12px] font-bold uppercase tracking-[2px] transition-all ${
                plan.accent 
                  ? 'bg-accent text-black hover:opacity-90' 
                  : 'border border-border-dim text-text hover:bg-surface'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border-dim p-12 text-center">
        <h3 className="text-xl font-serif mb-4">Enterprise & Institutional</h3>
        <p className="text-text-dim text-[14px] mb-8 max-w-xl mx-auto">
          Custom solutions for libraries, universities, and large writing groups.
        </p>
        <button className="text-[12px] font-bold uppercase tracking-[2px] text-accent hover:underline">
          Contact Sales Team
        </button>
      </div>
    </div>
  );
}
