'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { Search, X, Heart, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/store';

interface Post {
  id: string;
  file_url: string;
  preview_url: string;
  sample_url: string;
  width: number;
  height: number;
  tags: string;
  rating: string;
  score: number;
  favorites: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [suggestions, setSuggestions] = useState<{ name: string; count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { ref, inView } = useInView();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load posts
  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    const currentPage = reset ? 0 : page;
    const url = `/api/search?tags=${encodeURIComponent(searchQuery)}&page=${currentPage}&rating=explicit`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        return;
      }

      setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.posts.length > 0);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, loading]);

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadPosts();
    }
  }, [inView, hasMore, loading, loadPosts]);

  // Initial load
  useEffect(() => {
    loadPosts(true);
  }, []);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setPosts([]);
    setHasMore(true);
    await loadPosts(true);
    setShowSuggestions(false);
  };

  // Handle tag autocomplete
  const handleTagInput = async (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      const response = await fetch(`/api/tags?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add a tag to the search
  const addTag = (tag: string) => {
    const currentTags = searchQuery.split(' ').filter(t => t.length > 0);
    if (!currentTags.includes(tag)) {
      setSearchQuery([...currentTags, tag].join(' '));
    }
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    const currentTags = searchQuery.split(' ').filter(t => t.length > 0);
    setSearchQuery(currentTags.filter(t => t !== tag).join(' '));
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#d0d0e0]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1a1a2e] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#6c6cff] flex-shrink-0">
            ◈ <span className="text-[#ff6c6c]">H</span>entai
            <span className="text-[#6c6cff]">B</span>ooru
          </h1>

          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="flex items-center gap-2 bg-[#1a1a2a] rounded-lg px-3 py-2 border border-[#2a2a4a] focus-within:border-[#6c6cff] transition-colors">
              <Search size={18} className="text-[#555577]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleTagInput(e.target.value)}
                placeholder="Search tags... (e.g. 1girl solo smile)"
                className="flex-1 bg-transparent outline-none text-[#d0d0e0] placeholder-[#555577]"
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#555577] hover:text-[#d0d0e0]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Tag suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-[#1a1a2a] border border-[#2a2a4a] rounded-lg overflow-hidden max-h-60 overflow-y-auto z-50">
                {suggestions.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => addTag(tag.name)}
                    className="w-full px-3 py-2 text-left hover:bg-[#2a2a4a] flex justify-between items-center"
                  >
                    <span>{tag.name}</span>
                    <span className="text-xs text-[#555577]">{tag.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <button className="text-[#555577] hover:text-[#d0d0e0] text-sm flex-shrink-0">
            ⚙️
          </button>
        </div>

        {/* Active tags */}
        {searchQuery && (
          <div className="max-w-7xl mx-auto mt-2 flex flex-wrap gap-1">
            {searchQuery.split(' ').filter(t => t.length > 0).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-[#1a1a3a] px-2 py-0.5 rounded text-xs text-[#6c6cff]"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-[#ff6c6c]">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Image Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-20 text-[#555577]">
            <p className="text-xl">No posts found</p>
            <p className="text-sm mt-2">Try different tags or check your connection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer group bg-[#1a1a2a]"
                onClick={() => setSelectedPost(post)}
              >
                <Image
                  src={post.preview_url || post.sample_url || post.file_url}
                  alt={`Post ${post.id}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6c6cff]">❤ {post.favorites}</span>
                    <span className="text-[#ff6c6c]">★ {post.score}</span>
                  </div>
                </div>
                {post.rating === 'explicit' && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600/80 text-[10px] font-bold rounded">18+</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && (
          <div ref={ref} className="py-8 text-center text-[#555577]">
            {loading ? 'Loading...' : 'Scroll for more'}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedPost(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedPost.file_url}
              alt={`Post ${selectedPost.id}`}
              width={selectedPost.width}
              height={selectedPost.height}
              className="max-w-[95vw] max-h-[90vh] object-contain"
              priority
            />

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur px-4 py-2 rounded-full">
              <button
                onClick={() => {
                  const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
                  const prev = posts[currentIndex - 1];
                  if (prev) setSelectedPost(prev);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => window.open(selectedPost.file_url, '_blank')}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <Download size={20} />
              </button>

              <button
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <Heart size={20} />
              </button>

              <button
                onClick={() => window.open(`https://gelbooru.com/index.php?page=post&s=view&id=${selectedPost.id}`, '_blank')}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <ExternalLink size={20} />
              </button>

              <button
                onClick={() => {
                  const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
                  const next = posts[currentIndex + 1];
                  if (next) setSelectedPost(next);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <ChevronRight size={20} />
              </button>

              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tags */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80vw] flex flex-wrap justify-center gap-1">
              {selectedPost.tags.split(' ').slice(0, 20).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-black/60 px-2 py-0.5 rounded hover:bg-[#6c6cff]/30 cursor-pointer transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    addTag(tag);
                    setSelectedPost(null);
                  }}
                >
                  {tag}
                </span>
              ))}
              {selectedPost.tags.split(' ').length > 20 && (
                <span className="text-xs text-[#555577]">+{selectedPost.tags.split(' ').length - 20} more</span>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
