import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface Store {
  favorites: string[];
  blacklist: string[];
  history: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  addToHistory: (id: string) => void;
  addToBlacklist: (tag: string) => void;
  removeFromBlacklist: (tag: string) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      favorites: [],
      blacklist: [],
      history: [],
      addFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites
            : [...state.favorites, id],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f !== id),
        })),
      addToHistory: (id) =>
        set((state) => ({
          history: [id, ...state.history.filter((h) => h !== id)].slice(0, 100),
        })),
      addToBlacklist: (tag) =>
        set((state) => ({
          blacklist: state.blacklist.includes(tag)
            ? state.blacklist
            : [...state.blacklist, tag],
        })),
      removeFromBlacklist: (tag) =>
        set((state) => ({
          blacklist: state.blacklist.filter((b) => b !== tag),
        })),
    }),
    {
      name: 'hentai-booru-store',
    }
  )
);
