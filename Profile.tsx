import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, Users, BookMarked, ArrowRight } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface HomeProps {
  onExplore: () => void;
}

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genre: string;
}

export default function Home({ onExplore }: HomeProps) {
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const q = query(collection(db, 'books'), limit(3));
      const snapshot = await getDocs(q);
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeaturedBook[];
      setFeaturedBooks(books);
    };
    fetchFeatured();
  }, []);

  return (
    <div className="relative overflow-hidden bg-bg min-h-full">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-10 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="inline-block px-4 py-1 mb-10 border border-border-dim text-[11px] font-bold uppercase tracking-[2px] text-accent"
        >
          Incipit Literary Insight Engine
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl md:text-6xl font-serif font-normal tracking-tight mb-10 leading-[1.2] max-w-4xl mx-auto"
        >
          Access information/overview from <br className="hidden md:block" />
          <span className="text-accent italic">thousands of books</span> written by <br className="hidden md:block" />
          famous authors
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-[15px] text-text-dim max-w-2xl mx-auto mb-14 leading-relaxed"
        >
          From John Green to Colleen Hoover and George Orwell. Explore summaries, 
          discuss with the community, and get AI-powered insights into the world's greatest literature.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row justify-center gap-6"
        >
          <button 
            onClick={onExplore}
            className="bg-accent text-black px-10 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Start Exploration
            <ChevronRight size={18} />
          </button>
          <button className="border border-border-dim text-text px-10 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-surface transition-all">
            View Community
          </button>
        </motion.div>
      </section>

      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-10 py-24 border-t border-border-dim">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[3px] text-accent mb-4">Curated Selection</h2>
              <h3 className="text-3xl font-serif">Featured Masterpieces</h3>
            </div>
            <button 
              onClick={onExplore}
              className="text-[11px] font-bold uppercase tracking-[2px] text-text-dim hover:text-accent flex items-center gap-2 transition-all"
            >
              View All Books <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {featuredBooks.map((book, i) => (
              <motion.div 
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={onExplore}
              >
                <div className="aspect-[2/3] bg-surface border border-border-dim mb-6 overflow-hidden relative">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-60" />
                </div>
                <div className="text-[10px] uppercase tracking-[2px] text-accent mb-2">{book.genre}</div>
                <h4 className="text-xl font-serif mb-1 group-hover:text-accent transition-colors">{book.title}</h4>
                <p className="text-text-dim text-sm italic font-serif">by {book.author}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Authors */}
      <section className="bg-surface py-20 border-y border-border-dim">
        <div className="max-w-7xl mx-auto px-10">
          <p className="text-center text-[10px] font-bold uppercase tracking-[3px] text-text-dim mb-12">
            Featuring Works By
          </p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale">
            <span className="text-xl font-serif italic">John Green</span>
            <span className="text-xl font-serif italic">Colleen Hoover</span>
            <span className="text-xl font-serif italic">George Orwell</span>
            <span className="text-xl font-serif italic">Haruki Murakami</span>
            <span className="text-xl font-serif italic">Jane Austen</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-10 py-32">
        <div className="grid md:grid-cols-3 gap-1px bg-border-dim border border-border-dim">
          <div className="p-12 bg-bg hover:bg-surface transition-all">
            <div className="w-10 h-10 border border-accent/30 flex items-center justify-center mb-8">
              <BookMarked className="text-accent" size={20} />
            </div>
            <h3 className="text-[12px] uppercase tracking-[1px] text-text-dim mb-4">Vast Library</h3>
            <p className="text-[14px] text-text-dim leading-relaxed">
              Summaries and overviews of thousands of books across all genres and eras.
            </p>
          </div>
          <div className="p-12 bg-bg hover:bg-surface transition-all">
            <div className="w-10 h-10 border border-accent/30 flex items-center justify-center mb-8">
              <Sparkles className="text-accent" size={20} />
            </div>
            <h3 className="text-[12px] uppercase tracking-[1px] text-text-dim mb-4">AI Analysis</h3>
            <p className="text-[14px] text-text-dim leading-relaxed">
              Our advanced AI can explain complex texts and provide deep literary analysis.
            </p>
          </div>
          <div className="p-12 bg-bg hover:bg-surface transition-all">
            <div className="w-10 h-10 border border-accent/30 flex items-center justify-center mb-8">
              <Users className="text-accent" size={20} />
            </div>
            <h3 className="text-[12px] uppercase tracking-[1px] text-text-dim mb-4">Community Hub</h3>
            <p className="text-[14px] text-text-dim leading-relaxed">
              Connect with fellow readers, discuss your favorite books, and share reviews.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
