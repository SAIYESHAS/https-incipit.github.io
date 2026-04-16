import React, { useState, useEffect } from 'react';
import { User as UserIcon, MessageSquare, Heart, Book, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, documentId } from 'firebase/firestore';
import { motion } from 'motion/react';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  likedBooks?: string[];
}

export default function Profile({ profileId, onBack }: { profileId: string, onBack: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedBooksData, setLikedBooksData] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch User Info
        const userDoc = await getDoc(doc(db, 'users', profileId));
        let userData: UserProfile | null = null;

        if (userDoc.exists()) {
          userData = userDoc.data() as UserProfile;
          setProfile({ ...userData, uid: userDoc.id });

          // Fetch Liked Books if they exist (Limit to 10 as requested)
          if (userData.likedBooks && userData.likedBooks.length > 0) {
            const ids = userData.likedBooks.slice(0, 10);
            const booksQuery = query(collection(db, 'books'), where(documentId(), 'in', ids));
            const booksSnapshot = await getDocs(booksQuery);
            const books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BookData[];
            setLikedBooksData(books);
          }
        } else {
          // Fallback if user doc doesn't exist
          setProfile({ uid: profileId, displayName: 'User', email: '' });
        }

        // Fetch User Posts
        const postsQuery = query(
          collection(db, 'posts'), 
          where('authorId', '==', profileId),
          orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
        setUserPosts(posts);

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-10 py-16">
      <button 
        onClick={onBack}
        className="text-[11px] font-bold uppercase tracking-[2px] text-text-dim hover:text-accent mb-12 flex items-center gap-2"
      >
        <ChevronRight size={16} className="rotate-180" />
        Back to Community
      </button>

      <div className="bg-surface border border-border-dim p-12 mb-16">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 border border-accent/30 flex items-center justify-center bg-black">
            <UserIcon size={40} className="text-accent" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-serif font-normal mb-2">{profile?.displayName || 'Anonymous Reader'}</h2>
            <p className="text-text-dim text-sm uppercase tracking-[1px]">Member of the Insight Engine Community</p>
          </div>
        </div>
      </div>

      <div className="flex gap-12 border-b border-border-dim mb-12">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`pb-4 text-[12px] font-bold uppercase tracking-[2px] transition-all relative ${
            activeTab === 'posts' ? 'text-accent' : 'text-text-dim hover:text-text'
          }`}
        >
          Discussions ({userPosts.length})
          {activeTab === 'posts' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>
        <button 
          onClick={() => setActiveTab('likes')}
          className={`pb-4 text-[12px] font-bold uppercase tracking-[2px] transition-all relative ${
            activeTab === 'likes' ? 'text-accent' : 'text-text-dim hover:text-text'
          }`}
        >
          Liked Books ({profile?.likedBooks?.length || 0})
          {activeTab === 'likes' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>
      </div>

      <div>
        {activeTab === 'posts' ? (
          <div className="space-y-8">
            {userPosts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border-dim">
                <p className="text-text-dim text-sm uppercase tracking-[1px]">No discussions started yet.</p>
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="bg-surface border border-border-dim p-8 hover:border-accent/30 transition-all">
                  <h3 className="text-xl font-serif mb-4">{post.title}</h3>
                  <p className="text-text-dim text-sm line-clamp-2 mb-6">{post.content}</p>
                  <div className="flex items-center gap-6 text-[10px] uppercase tracking-[1px] text-text-dim">
                    <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {likedBooksData.length === 0 ? (
              <div className="col-span-full text-center py-20 border border-dashed border-border-dim">
                <p className="text-text-dim text-sm uppercase tracking-[1px]">No books liked yet.</p>
              </div>
            ) : (
              likedBooksData.map(book => (
                <div key={book.id} className="group cursor-pointer">
                  <div className="aspect-[2/3] bg-surface border border-border-dim overflow-hidden mb-4 group-hover:border-accent transition-all">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-[12px] font-bold uppercase tracking-[1px] line-clamp-1">{book.title}</h4>
                  <p className="text-[10px] text-text-dim uppercase tracking-[1px]">{book.author}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
