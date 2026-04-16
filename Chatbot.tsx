import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  PenTool, 
  CreditCard, 
  Search, 
  Menu, 
  X,
  ChevronRight,
  Star,
  BookMarked,
  Sparkles
} from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';

// Components
import Home from './components/Home';
import Library from './components/Library';
import Chatbot from './components/Chatbot';
import Community from './components/Community';
import WritingAdvice from './components/WritingAdvice';
import Subscription from './components/Subscription';
import Profile from './components/Profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Login popup closed or cancelled by user.");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Exploration', icon: BookOpen },
    { id: 'library', label: 'Books', icon: BookMarked },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'advice', label: 'The Bulletin', icon: PenTool },
    { id: 'chatbot', label: 'AI Analysis', icon: Sparkles },
    { id: 'subscription', label: 'Premium', icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home onExplore={() => setActiveTab('library')} />;
      case 'library': return <Library user={user} login={login} />;
      case 'community': return <Community user={user} login={login} onViewProfile={(id) => { setProfileId(id); setActiveTab('profile'); }} />;
      case 'advice': return <WritingAdvice user={user} login={login} />;
      case 'chatbot': return <Chatbot user={user} />;
      case 'subscription': return <Subscription user={user} login={login} />;
      case 'profile': return <Profile profileId={profileId || ''} onBack={() => setActiveTab('community')} />;
      default: return <Home onExplore={() => setActiveTab('library')} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-bg border-b border-border-dim z-50">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex justify-between h-[70px] items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setActiveTab('home')}
            >
              <span className="font-serif text-xl font-normal tracking-[2px] uppercase text-accent">Incipit</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-[13px] uppercase tracking-[1px] transition-colors hover:text-accent ${
                    activeTab === item.id ? 'text-accent' : 'text-text-dim'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-border-dim">
                  <button 
                    onClick={() => { setProfileId(user.uid); setActiveTab('profile'); }}
                    className="flex items-center gap-3 group"
                  >
                    <img 
                      src={user.photoURL || ''} 
                      alt={user.displayName || ''} 
                      className="w-8 h-8 rounded-full border border-border-dim group-hover:border-accent transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] uppercase tracking-[1px] text-text-dim group-hover:text-accent transition-colors">My Profile</span>
                  </button>
                  <button 
                    onClick={() => auth.signOut()}
                    className="text-[11px] uppercase tracking-[1px] text-text-dim hover:text-accent ml-4"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={login}
                  className="border border-accent text-accent px-5 py-2 text-[12px] uppercase tracking-[1px] hover:bg-accent hover:text-bg transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-dim hover:text-accent">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-surface border-b border-border-dim absolute top-[70px] left-0 right-0 p-6"
            >
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 text-[13px] uppercase tracking-[1px] ${
                      activeTab === item.id ? 'text-accent' : 'text-text-dim'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
                {!user && (
                  <button 
                    onClick={login}
                    className="w-full border border-accent text-accent py-3 text-[12px] uppercase tracking-[1px]"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-[70px] flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-border-dim py-10">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="bg-accent text-black text-[10px] font-bold px-2 py-0.5 rounded-[2px]">PREMIUM</span>
            <p className="text-text-dim text-[13px]">
              Visit <strong className="text-text">The Bulletin</strong> for expert writing advice from AI mentors and published authors.
            </p>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('subscription')}
              className="border border-accent text-accent px-4 py-2 text-[12px] uppercase tracking-[1px] hover:bg-accent hover:text-bg transition-all"
            >
              $9.99 / Month
            </button>
            <button 
              onClick={() => setActiveTab('subscription')}
              className="bg-accent text-black px-4 py-2 text-[12px] uppercase tracking-[1px] font-bold hover:opacity-90 transition-all"
            >
              $89.99 / Annual
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-10 mt-8 pt-8 border-t border-white/5 text-center flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-text-dim text-[11px] uppercase tracking-[2px] font-bold">
              Made by 10A students of BVB TPG
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="https://www.bvbtpg.ac.in/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-text-dim hover:text-accent transition-colors">BVB TPG</a>
              <a href="https://www.bvbbvrm.ac.in/school-info.html" target="_blank" rel="noopener noreferrer" className="text-[10px] text-text-dim hover:text-accent transition-colors">BVB BVRM</a>
              <a href="https://bvbgfs.in/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-text-dim hover:text-accent transition-colors">BVB GFS</a>
              <a href="https://www.bvbrjy.ac.in/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-text-dim hover:text-accent transition-colors">BVB RJY</a>
              <a href="https://bhavansguntur.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-text-dim hover:text-accent transition-colors">Bhavan's Guntur</a>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-text-dim text-[10px] uppercase tracking-[2px]">
              © 2026 Incipit Literary Insight Engine. All rights reserved.
            </p>
            <a 
              href="https://incipit.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent text-[11px] uppercase tracking-[1px] hover:underline"
            >
              Visit incipit.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
