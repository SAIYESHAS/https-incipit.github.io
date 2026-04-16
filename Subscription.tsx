import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ChevronRight, BookMarked, X, ShoppingCart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, limit, doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Heart, Globe, Library as LibraryIcon, Plus } from 'lucide-react';
import { searchGlobalBooks, searchBhavansBooks, GoogleBook } from '../services/googleBooks';
import BookChat from './BookChat';

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  fullOverview: string;
  audience: string;
  ageRating: string;
  coverUrl: string;
  totalStars?: number;
  ratingCount?: number;
}

export default function Library({ user, login }: { user: any, login: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(24);
  const [likedBooks, setLikedBooks] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'local' | 'global' | 'bhavans'>('local');
  const [globalResults, setGlobalResults] = useState<GoogleBook[]>([]);
  const [bhavansResults, setBhavansResults] = useState<GoogleBook[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isUsingAIFallback, setIsUsingAIFallback] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    if (searchMode === 'global' || searchMode === 'bhavans') {
      const fetchBooks = async (searchTerm: string) => {
        setIsSearchingGlobal(true);
        setGlobalSearchError(null);
        setIsQuotaExceeded(false);
        setIsUsingAIFallback(false);
        try {
          if (searchMode === 'bhavans') {
            console.log(`Fetching Bhavan's Collection...`);
            const results = await searchBhavansBooks(30);
            if (isMounted) {
              setBhavansResults(results);
              setIsUsingAIFallback(true);
            }
          } else {
            const finalQuery = searchTerm.trim().length > 0 ? searchTerm : 'popular fiction books';
            console.log(`Searching AI Global Hub for: ${finalQuery}`);
            const results = await searchGlobalBooks(finalQuery, 30);
            if (isMounted) {
              setGlobalResults(results);
              setIsUsingAIFallback(true);
            }
          }
        } catch (error) {
          console.error("Search error:", error);
          if (isMounted) {
            const msg = error instanceof Error ? error.message : "Failed to connect to AI Hub.";
            setGlobalSearchError(msg);
          }
        } finally {
          if (isMounted) {
            setIsSearchingGlobal(false);
          }
        }
      };

      if (searchMode === 'global' && searchQuery.trim().length > 0) {
        const delayDebounceFn = setTimeout(() => fetchBooks(searchQuery), 500);
        return () => {
          isMounted = false;
          clearTimeout(delayDebounceFn);
        };
      } else {
        fetchBooks(searchQuery);
        return () => { isMounted = false; };
      }
    }
  }, [searchQuery, searchMode]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setLikedBooks(data.likedBooks || []);
          setUserRatings(data.ratings || {});
        }
      });
      return () => unsubscribeUser();
    } else {
      setLikedBooks([]);
      setUserRatings({});
    }
  }, [user]);

  useEffect(() => {
    // We fetch all books for local filtering, but in a real app with 10k+ books 
    // we would do server-side search. For now, we'll fetch a generous amount 
    // and use a display limit for performance.
    const q = query(collection(db, 'books'), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setBooks(booksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching books:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCloseModal = () => {
    setSelectedBook(null);
    setShowFullOverview(false);
  };

  const toggleLike = async (bookId: string) => {
    if (!user) {
      login();
      return;
    }

    // If it's a global book not yet in our DB, we need to "import" it first
    // This is handled by the "Import to Library" button in the modal for global books
    // But for simplicity, we'll check if the book exists in our local 'books' collection
    const isLiked = likedBooks.includes(bookId);
    const userRef = doc(db, 'users', user.uid);

    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          likedBooks: [bookId],
          displayName: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          likedBooks: isLiked ? arrayRemove(bookId) : arrayUnion(bookId)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleImportBook = async (gBook: GoogleBook) => {
    if (!user) {
      login();
      return;
    }

    const info = gBook.volumeInfo;
    const bookData = {
      title: info.title,
      author: info.authors?.[0] || 'Unknown Author',
      genre: info.categories?.[0] || 'General',
      summary: info.summary || info.description?.substring(0, 350) + '...' || 'No summary available.',
      fullOverview: info.description || 'No overview available.',
      audience: info.audience || 'Global reader discovered via AI Hub.',
      ageRating: info.ageRating || 'General',
      coverUrl: info.imageLinks?.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(info.title)}/400/600`
    };

    try {
      const docRef = await addDoc(collection(db, 'books'), {
        ...bookData,
        totalStars: 0,
        ratingCount: 0
      });
      // Switch back to local and select the new book
      setSearchMode('local');
      setSearchQuery(info.title);
      setSelectedBook({ id: docRef.id, ...bookData, totalStars: 0, ratingCount: 0 });
    } catch (error) {
      console.error("Error importing book:", error);
    }
  };

  const handleRateBook = async (bookId: string, rating: number) => {
    if (!user) {
      login();
      return;
    }

    const bookRef = doc(db, 'books', bookId);
    const userRef = doc(db, 'users', user.uid);
    const oldRating = userRatings[bookId] || 0;

    try {
      const bookDoc = await getDoc(bookRef);
      if (!bookDoc.exists()) return;

      const bookData = bookDoc.data();
      let newTotalStars = (bookData.totalStars || 0);
      let newRatingCount = (bookData.ratingCount || 0);

      if (oldRating > 0) {
        // Update existing rating
        newTotalStars = newTotalStars - oldRating + rating;
      } else {
        // New rating
        newTotalStars += rating;
        newRatingCount += 1;
      }

      await updateDoc(bookRef, {
        totalStars: newTotalStars,
        ratingCount: newRatingCount
      });

      await updateDoc(userRef, {
        [`ratings.${bookId}`]: rating
      });
    } catch (error) {
      console.error("Error rating book:", error);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 20 : 12}
            className={`${interactive ? 'cursor-pointer transition-all hover:scale-110' : ''} ${
              star <= rating ? 'fill-accent text-accent' : 'text-text-dim fill-none'
            }`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedBooks = filteredBooks.slice(0, displayLimit);

  const currentBook = selectedBook ? books.find(b => b.id === selectedBook.id) || selectedBook : null;

  return (
    <div className="max-w-7xl mx-auto px-10 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h2 className="text-3xl font-serif font-normal mb-2">Book Hub</h2>
          <p className="text-text-dim text-sm tracking-[1px] uppercase">
            {searchMode === 'local' ? 'Explore our curated collection' : 
             searchMode === 'bhavans' ? 'Books from Bharatiya Vidya Bhavan (bhavans.info)' :
             'AI-Powered Search across Kindle, Goodreads, and more'}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
          <div className="flex bg-surface border border-border-dim p-1">
            <button 
              onClick={() => setSearchMode('local')}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[1px] transition-all ${
                searchMode === 'local' ? 'bg-accent text-black' : 'text-text-dim hover:text-text'
              }`}
            >
              <LibraryIcon size={14} />
              Local
            </button>
            <button 
              onClick={() => setSearchMode('bhavans')}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[1px] transition-all ${
                searchMode === 'bhavans' ? 'bg-accent text-black' : 'text-text-dim hover:text-text'
              }`}
            >
              <BookOpen size={14} />
              Bhavan's
            </button>
            <button 
              onClick={() => setSearchMode('global')}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[1px] transition-all ${
                searchMode === 'global' ? 'bg-accent text-black' : 'text-text-dim hover:text-text'
              }`}
            >
              <Globe size={14} />
              Global Hub
            </button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
            <input 
              type="text"
              placeholder={searchMode === 'local' ? "Search local collection..." : "Search millions of books globally..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-black border border-border-dim text-text text-sm focus:outline-none focus:border-accent transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isUsingAIFallback && (searchMode === 'global' || searchMode === 'bhavans') && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-purple-500/10 border border-purple-500/30 flex items-center gap-4"
        >
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <p className="text-[11px] text-purple-300 uppercase tracking-[1px] font-bold">
            {searchMode === 'bhavans' 
              ? "Bhavan's Collection Active: Curating authentic titles from Bharatiya Vidya Bhavan."
              : "AI Global Hub Active: Generating intelligent results from Kindle, Goodreads, and global literary databases."}
          </p>
        </motion.div>
      )}

      {(isLoading || ((searchMode === 'global' || searchMode === 'bhavans') && isSearchingGlobal)) ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-accent animate-pulse">
              {searchMode === 'local' ? 'Loading Library...' : 'Connecting to AI Hub...'}
            </p>
            {(searchMode === 'global' || searchMode === 'bhavans') && (
              <>
                <p className="text-text-dim text-xs italic">This may take a while as we curate the best titles for you.</p>
                <p className="text-[10px] text-accent/50 uppercase tracking-[1px] mt-4">
                  Check out our other features like the <span className="text-accent">Insight Engine</span> or <span className="text-accent">Global Search</span> while you wait.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {searchMode === 'local' ? (
              displayedBooks.map((book) => (
                <motion.div
                  key={book.id}
                  layoutId={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="bg-surface border border-border-dim overflow-hidden flex flex-col h-[450px] cursor-pointer hover:border-accent/50 transition-all group"
                >
                  <div className="h-2/3 overflow-hidden relative">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${encodeURIComponent(book.title)}/400/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className="text-[9px] px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-text-dim uppercase tracking-[1px]">
                        {book.ageRating}
                      </div>
                      {likedBooks.includes(book.id) && (
                        <div className="p-1.5 bg-accent/20 backdrop-blur-md border border-accent/30 text-accent rounded-full">
                          <Heart size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[11px] uppercase tracking-[1px] text-accent">{book.author}</div>
                      {book.ratingCount && book.ratingCount > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {renderStars(Math.round((book.totalStars || 0) / book.ratingCount))}
                          <span className="text-[10px] text-text-dim">({book.ratingCount})</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-text-dim italic">No ratings</div>
                      )}
                    </div>
                    <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors line-clamp-1">{book.title}</h3>
                    <p className="text-[13px] leading-relaxed text-text-dim line-clamp-3 flex-1">
                      {book.summary}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : searchMode === 'bhavans' ? (
              bhavansResults.map((gBook) => (
                <motion.div
                  key={gBook.id}
                  onClick={() => handleImportBook(gBook)}
                  className="bg-surface border border-border-dim overflow-hidden flex flex-col h-[450px] cursor-pointer hover:border-accent/50 transition-all group"
                >
                  <div className="h-2/3 overflow-hidden relative">
                    <img 
                      src={gBook.volumeInfo.imageLinks?.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(gBook.volumeInfo.title)}/400/600`} 
                      alt={gBook.volumeInfo.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${encodeURIComponent(gBook.volumeInfo.title)}/400/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className="text-[9px] px-2 py-1 bg-accent text-black font-bold uppercase tracking-[1px]">
                        Bhavan's
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[11px] uppercase tracking-[1px] text-accent">{gBook.volumeInfo.authors?.[0] || 'Bharatiya Vidya Bhavan'}</div>
                      {gBook.volumeInfo.ageRating && (
                        <div className="text-[9px] px-1.5 py-0.5 border border-border-dim text-text-dim uppercase tracking-[1px]">
                          {gBook.volumeInfo.ageRating}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors line-clamp-1">{gBook.volumeInfo.title}</h3>
                    <p className="text-[13px] leading-relaxed text-text-dim line-clamp-3 flex-1">
                      {gBook.volumeInfo.summary || gBook.volumeInfo.description || 'Authentic publication from Bharatiya Vidya Bhavan.'}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-accent">
                      <Plus size={12} />
                      Import to Engine
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              globalResults.map((gBook) => (
                <motion.div
                  key={gBook.id}
                  onClick={() => handleImportBook(gBook)}
                  className="bg-surface border border-border-dim overflow-hidden flex flex-col h-[450px] cursor-pointer hover:border-accent/50 transition-all group"
                >
                  <div className="h-2/3 overflow-hidden relative">
                    <img 
                      src={gBook.volumeInfo.imageLinks?.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(gBook.volumeInfo.title)}/400/600`} 
                      alt={gBook.volumeInfo.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${encodeURIComponent(gBook.volumeInfo.title)}/400/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className="text-[9px] px-2 py-1 bg-accent text-black font-bold uppercase tracking-[1px]">
                        Global Hub
                      </div>
                      {gBook.isAIGenerated && (
                        <div className="text-[9px] px-2 py-1 bg-purple-500 text-white font-bold uppercase tracking-[1px] animate-pulse">
                          AI Search
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[11px] uppercase tracking-[1px] text-accent">{gBook.volumeInfo.authors?.[0] || 'Unknown Author'}</div>
                      {gBook.volumeInfo.ageRating && (
                        <div className="text-[9px] px-1.5 py-0.5 border border-border-dim text-text-dim uppercase tracking-[1px]">
                          {gBook.volumeInfo.ageRating}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors line-clamp-1">{gBook.volumeInfo.title}</h3>
                    <p className="text-[13px] leading-relaxed text-text-dim line-clamp-3 flex-1">
                      {gBook.volumeInfo.summary || gBook.volumeInfo.description || 'No description available for this global title.'}
                    </p>
                    {gBook.volumeInfo.audience && (
                      <p className="text-[10px] text-accent/70 italic mt-2 line-clamp-1">
                        {gBook.volumeInfo.audience}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-accent">
                      <Plus size={12} />
                      Import to Engine
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {searchMode === 'local' && filteredBooks.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-20 border border-dashed border-border-dim">
                <p className="text-text-dim uppercase tracking-[2px] text-sm">No books found matching your search.</p>
              </div>
            )}
            {searchMode === 'global' && globalSearchError && (
              <div className="col-span-full text-center py-20 border border-dashed border-red-500/30 bg-red-500/5">
                <p className="text-red-400 uppercase tracking-[2px] text-sm mb-2">
                  Connection Error
                </p>
                <p className="text-text-dim text-xs max-w-md mx-auto">
                  {globalSearchError}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <button 
                    onClick={() => setSearchQuery(searchQuery)} // Trigger re-fetch
                    className="px-6 py-2 border border-red-500/30 text-[10px] font-bold uppercase tracking-[1px] hover:bg-red-500/10 transition-all"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}
            {searchMode === 'global' && globalResults.length === 0 && !isSearchingGlobal && !globalSearchError && searchQuery.trim().length > 0 && (
              <div className="col-span-full text-center py-20 border border-dashed border-border-dim">
                <p className="text-text-dim uppercase tracking-[2px] text-sm">No global results found for "{searchQuery}".</p>
              </div>
            )}
          </div>

          {searchMode === 'local' && filteredBooks.length > displayLimit && (
            <div className="mt-20 flex justify-center">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 24)}
                className="px-12 py-4 border border-border-dim text-[11px] font-bold uppercase tracking-[2px] hover:border-accent hover:text-accent transition-all"
              >
                Load More Titles
              </button>
            </div>
          )}
        </>
      )}

      {/* Book Detail Modal */}
      <AnimatePresence>
        {currentBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={currentBook.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg w-full max-w-7xl border border-border-dim overflow-hidden relative z-10 flex flex-col lg:flex-row max-h-[90vh]"
            >
              <div className="w-full lg:w-1/4 aspect-[2/3] lg:aspect-auto border-r border-border-dim overflow-hidden hidden lg:block">
                <img 
                  src={currentBook.coverUrl} 
                  alt={currentBook.title}
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://picsum.photos/seed/${encodeURIComponent(currentBook.title)}/400/600`;
                  }}
                />
              </div>
              <div className="p-10 lg:p-14 flex-1 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                        {currentBook.genre}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 border border-border-dim text-text-dim uppercase tracking-[1px]">
                        {currentBook.ageRating}
                      </span>
                    </div>
                    <h2 className="text-4xl font-serif font-normal mb-3">{currentBook.title}</h2>
                    <div className="flex items-center gap-4 mb-3">
                      <p className="text-lg text-text-dim italic font-serif">by {currentBook.author}</p>
                      <div className="h-4 w-[1px] bg-border-dim" />
                      <div className="flex items-center gap-2">
                        {renderStars(
                          currentBook.ratingCount && currentBook.ratingCount > 0 
                            ? Math.round((currentBook.totalStars || 0) / currentBook.ratingCount) 
                            : 0
                        )}
                        {currentBook.ratingCount && currentBook.ratingCount > 0 && (
                          <span className="text-xs text-text-dim">({currentBook.ratingCount} reviews)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleCloseModal}
                    className="p-2 text-text-dim hover:text-accent transition-colors lg:hidden"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-8 mb-10">
                  <div className="p-6 bg-surface border border-border-dim">
                    <h4 className="text-[11px] font-bold mb-4 uppercase tracking-[2px] text-text-dim">Your Rating</h4>
                    <div className="flex items-center justify-between">
                      {renderStars(userRatings[currentBook.id] || 0, true, (r) => handleRateBook(currentBook.id, r))}
                      <span className="text-[10px] font-bold uppercase tracking-[1px] text-accent">
                        {userRatings[currentBook.id] ? 'Thank you for rating!' : 'Click to rate'}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {showFullOverview ? (
                      <motion.div
                        key="full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <h4 className="text-[11px] font-bold mb-3 uppercase tracking-[2px] text-accent">Full Overview</h4>
                        <p className="text-text leading-relaxed text-[15px] whitespace-pre-wrap">
                          {currentBook.fullOverview || currentBook.summary}
                        </p>
                        <button 
                          onClick={() => setShowFullOverview(false)}
                          className="mt-6 text-[11px] font-bold uppercase tracking-[2px] text-text-dim hover:text-accent transition-colors"
                        >
                          Show Less
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <h4 className="text-[11px] font-bold mb-3 uppercase tracking-[2px] text-text-dim">Summary</h4>
                        <p className="text-text leading-relaxed text-[15px]">
                          {currentBook.summary}
                        </p>
                        
                        <div className="mt-8">
                          <h4 className="text-[11px] font-bold mb-3 uppercase tracking-[2px] text-text-dim">Who will like this</h4>
                          <p className="text-text-dim leading-relaxed text-[14px] italic">
                            {currentBook.audience}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4 mt-auto pt-8 border-t border-border-dim">
                  {!showFullOverview && (
                    <button 
                      onClick={() => setShowFullOverview(true)}
                      className="flex-1 bg-accent text-black py-4 text-[13px] font-bold uppercase tracking-[1px] hover:opacity-90 transition-all"
                    >
                      Read Full Overview
                    </button>
                  )}
                  <button 
                    onClick={() => currentBook && toggleLike(currentBook.id)}
                    className={`px-6 border border-border-dim transition-all flex items-center justify-center ${
                      currentBook && likedBooks.includes(currentBook.id) 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'text-text-dim hover:text-accent hover:border-accent'
                    }`}
                  >
                    <Heart size={20} fill={currentBook && likedBooks.includes(currentBook.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="px-6 border border-border-dim text-text-dim hover:text-accent hover:border-accent transition-all">
                    <BookMarked size={20} />
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <a 
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(currentBook.title + ' ' + currentBook.author)}&i=digital-text`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-black border border-border-dim text-[10px] font-bold uppercase tracking-[1px] text-text-dim hover:text-accent hover:border-accent transition-all"
                  >
                    <ShoppingCart size={12} />
                    View on Kindle
                  </a>
                  <a 
                    href={`https://www.goodreads.com/search?q=${encodeURIComponent(currentBook.title + ' ' + currentBook.author)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-black border border-border-dim text-[10px] font-bold uppercase tracking-[1px] text-text-dim hover:text-accent hover:border-accent transition-all"
                  >
                    <Globe size={12} />
                    View on Goodreads
                  </a>
                </div>
              </div>

              {/* AI Chatbot Column */}
              <div className="w-full lg:w-1/3 border-l border-border-dim hidden lg:block">
                <div className="h-full flex flex-col relative">
                  <button 
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 z-20 p-2 text-text-dim hover:text-accent transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <BookChat book={currentBook} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
