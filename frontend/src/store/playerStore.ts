import { create } from 'zustand';
import type { Track } from '../types';
import type { RepeatMode } from '../types/player';
import { hydrateTrack } from '../lib/mock/hydrateMedia';
import { recordTrackPlay } from '../lib/mock/musicService';
import { useAuthStore } from './authStore';

interface PlayerState {
  history: Track[];
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  isExpanded: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;

  playTrack: (track: Track, contextQueue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: (forceSkip?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  tick: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleExpanded: () => void;
  toggleLyrics: () => void;
  toggleQueue: () => void;
  removeFromQueue: (trackId: number) => void;
  reorderQueue: (newQueue: Track[]) => void;
}

function shuffleArray(array: Track[]): Track[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  history: [],
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progressSeconds: 0,
  durationSeconds: 180,
  volume: 80,
  repeatMode: 'none',
  shuffle: false,
  isExpanded: false,
  isLyricsOpen: false,
  isQueueOpen: false,

  playTrack: (track, contextQueue = []) => {
    const { currentTrack, history } = get();
    if (currentTrack?.id === track.id) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    // STACK UPDATE: Push outgoing track to history (Ensure uniqueness & latest position)
    let nextHistory = history;
    if (currentTrack) {
      nextHistory = [...history.filter((t) => t.id !== currentTrack.id), currentTrack];
    }

    const user = useAuthStore.getState().user;
    const hydratedTrack = user
      ? recordTrackPlay(track.id, user.id)
      : hydrateTrack(track);
      
    let finalQueue = contextQueue.length > 0
      ? contextQueue.map(hydrateTrack).filter((t) => t.id !== hydratedTrack.id)
      : get().queue;
      
    if (get().shuffle) {
      finalQueue = shuffleArray(finalQueue);
    }
    
    set({
      history: nextHistory,
      currentTrack: hydratedTrack,
      queue: finalQueue,
      isPlaying: true,
      progressSeconds: 0,
      durationSeconds: hydratedTrack.duration_seconds || 180,
    });
  },

  pause: () => set({ isPlaying: false }),

  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },

  next: (forceSkip = false) => {
      const { queue, repeatMode, currentTrack, history } = get();
      if (!currentTrack) return;

      // 1. Natural end with repeat-one -> loop current track
      if (!forceSkip && repeatMode === 'one') {
        set({ progressSeconds: 0, isPlaying: true });
        return;
      }

      // 2. Queue has upcoming tracks -> Advance to next
      if (queue.length > 0) {
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);

        if (repeatMode === 'all') {
          newQueue.push(currentTrack);
        }

        // STACK UPDATE: Push outgoing track to history
        const nextHistory = [...history.filter((t) => t.id !== currentTrack.id), currentTrack];

        // DYNAMIC PLAYBACK CHECK: 
        // If it's a natural song end AND repeat mode is 'none', pause playback.
        // Otherwise (manual skip or repeat 'all'), continue playing automatically.
        const shouldAutoPlay = forceSkip || repeatMode === 'all';

        set({
          currentTrack: nextTrack,
          queue: newQueue,
          progressSeconds: 0,
          durationSeconds: nextTrack.duration_seconds || 180,
          isPlaying: shouldAutoPlay,
        });
        return;
      }

      // 3. Queue is empty
      if (repeatMode === 'all') {
        // Loop the very last track if repeat 'all' is on and nothing else is queued
        set({ progressSeconds: 0, isPlaying: true });
      } else {
        // End of line. Stop playback.
        set({ progressSeconds: 0, isPlaying: false });
      }
    },

  prev: () => {
    const { progressSeconds, history, currentTrack, queue } = get();

    // 1. Time-Based Check: If > 5 seconds, restart current song.
    if (progressSeconds > 5) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    // 2. Empty History Check: Nowhere to go back to, just restart.
    if (history.length === 0) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    // 3. Popping the Stack (Time <= 5s & History exists)
    const prevTrack = history[history.length - 1]; // Peek at the top item
    const nextHistory = history.slice(0, -1);      // Remove top item

    // PUSH FORWARD: Re-inject the current track at the front of the queue
    const nextQueue = currentTrack ? [currentTrack, ...queue] : queue;

    set({
      history: nextHistory,
      currentTrack: prevTrack,
      queue: nextQueue,
      progressSeconds: 0,
      durationSeconds: prevTrack.duration_seconds || 180,
      isPlaying: true,
    });
  },

  seek: (seconds: number) => set({ progressSeconds: seconds }),

  setDuration: (seconds: number) => set({ durationSeconds: seconds }),

  tick: () => {
    const { isPlaying, progressSeconds, durationSeconds, next } = get();
    if (!isPlaying) return;

    if (progressSeconds >= durationSeconds) {
      next(); // Progresses automatically without forceSkip flag
    } else {
      set({ progressSeconds: progressSeconds + 1 });
    }
  },

  setVolume: (volume) => set({ volume }),

  toggleShuffle: () => {
    const isShuffle = !get().shuffle;
    set({ shuffle: isShuffle });
    if (isShuffle) {
      set({ queue: shuffleArray(get().queue) });
    }
  },

  toggleRepeat: () => {
    const current = get().repeatMode;
    const nextMode: RepeatMode = current === 'none' ? 'all' : current === 'all' ? 'one' : 'none';
    set({ repeatMode: nextMode });
  },

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen, isQueueOpen: false })),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen, isLyricsOpen: false })),

  removeFromQueue: (trackId) => set((state) => ({
    queue: state.queue.filter((t) => t.id !== trackId)
  })),

  reorderQueue: (newQueue) => set({ queue: newQueue }),
}));