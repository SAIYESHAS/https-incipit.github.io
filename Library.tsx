import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Share2, Plus, User as UserIcon } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likes: number;
}

export default function Community({ user, login, onViewProfile }: { user: any, login: () => void, onViewProfile: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    }, (error) => {
      console.error("Error fetching posts:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!user) {
      login();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      // Ensure user profile exists for the profile view feature
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
          likedBooks: []
        });
      }

      await addDoc(collection(db, 'posts'), {
        title: newTitle,
        content: newContent,
        authorId: user.uid,
        authorName: user.displayName,
        createdAt: new Date().toISOString(), // Using string for rules validation
        likes: 0
      });
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-10 py-16">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="text-3xl font-serif font-normal mb-2">Community Hub</h2>
          <p className="text-text-dim text-sm tracking-[1px] uppercase">Discuss books, share reviews, and hang out</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-accent text-black px-6 py-3 text-[12px] font-bold uppercase tracking-[1px] hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          New Discussion
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-16 overflow-hidden"
          >
            <div className="bg-surface border border-border-dim p-10">
              <h3 className="text-[12px] uppercase tracking-[2px] text-text-dim mb-8">Start a Discussion</h3>
              <input 
                type="text"
                placeholder="Topic Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-6 py-4 bg-black border border-border-dim text-text text-sm mb-4 focus:outline-none focus:border-accent"
              />
              <textarea 
                placeholder="What's on your mind?"
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-6 py-4 bg-black border border-border-dim text-text text-sm mb-8 focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex justify-end gap-6">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="text-[12px] uppercase tracking-[1px] text-text-dim font-bold hover:text-accent"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  className="bg-accent text-black px-8 py-3 text-[12px] font-bold uppercase tracking-[1px] hover:opacity-90 transition-all"
                >
                  Post Discussion
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1px bg-border-dim border border-border-dim">
        {posts.length === 0 ? (
          <div className="text-center py-24 bg-bg">
            <MessageSquare className="mx-auto text-text-dim/20 mb-6" size={48} />
            <p className="text-text-dim text-sm uppercase tracking-[1px]">No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          posts.map((post) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-bg p-10 hover:bg-surface transition-all group"
            >
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => onViewProfile(post.authorId)}
                  className="w-8 h-8 border border-accent/30 flex items-center justify-center hover:bg-accent/10 transition-colors"
                >
                  <UserIcon size={14} className="text-accent" />
                </button>
                <div>
                  <button 
                    onClick={() => onViewProfile(post.authorId)}
                    className="font-bold text-[12px] uppercase tracking-[1px] hover:text-accent transition-colors block text-left"
                  >
                    {post.authorName}
                  </button>
                  <p className="text-[10px] text-text-dim uppercase tracking-[1px]">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <h3 className="text-2xl font-serif font-normal mb-6 group-hover:text-accent transition-colors">{post.title}</h3>
              <p className="text-text-dim text-[14px] leading-relaxed mb-10 line-clamp-3">
                {post.content}
              </p>
              <div className="flex items-center gap-10 pt-8 border-t border-white/5">
                <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1px] text-text-dim hover:text-accent transition-colors">
                  <Heart size={16} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1px] text-text-dim hover:text-accent transition-colors">
                  <MessageSquare size={16} />
                  Reply
                </button>
                <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1px] text-text-dim hover:text-accent transition-colors">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
