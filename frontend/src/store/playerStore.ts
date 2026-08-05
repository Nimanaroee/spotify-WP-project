import { create } from 'zustand';
import type { Track } from '../types';
import type { RepeatMode } from '../types/player';
import { recordTrackPlay } from '../lib/api/catalogService';

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

  playTrack: (track: Track, contextQueue?: Track[]) => Promise<void>;
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

  playTrack: async (track, contextQueue = []) => {
    const { currentTrack, history } = get();
    if (currentTrack?.id === track.id) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    try {
      // Stream registration + limit enforcement
      const hydratedTrack = await recordTrackPlay(track.id);

      let nextHistory = history;
      if (currentTrack) {
        nextHistory = [...history.filter((t) => t.id !== currentTrack.id), currentTrack];
      }

      let finalQueue = contextQueue.length > 0
        ? contextQueue.filter((t) => t.id !== hydratedTrack.id)
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
    } catch (err: any) {
      alert(err.message); // Will display the "Early Access" or "Limit Reached" string
    }
  },

  pause: () => set({ isPlaying: false }),

  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },

  next: (forceSkip = false) => {
    const { queue, repeatMode, currentTrack, history } = get();
    if (!currentTrack) return;

    if (!forceSkip && repeatMode === 'one') {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);

      if (repeatMode === 'all') {
        newQueue.push(currentTrack);
      }

      const nextHistory = [...history.filter((t) => t.id !== currentTrack.id), currentTrack];
      const shouldAutoPlay = forceSkip || repeatMode === 'all';

      // Record the play automatically if we are transitioning natively
      recordTrackPlay(nextTrack.id).then(hydrated => {
        set({
          history: nextHistory,
          currentTrack: hydrated,
          queue: newQueue,
          progressSeconds: 0,
          durationSeconds: hydrated.duration_seconds || 180,
          isPlaying: shouldAutoPlay,
        });
      }).catch(err => alert(err.message));

      return;
    }

    if (repeatMode === 'all') {
      set({ progressSeconds: 0, isPlaying: true });
    } else {
      set({ progressSeconds: 0, isPlaying: false });
    }
  },

  prev: () => {
    const { progressSeconds, history, currentTrack, queue } = get();

    if (progressSeconds > 5) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    if (history.length === 0) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    const prevTrack = history[history.length - 1];
    const nextHistory = history.slice(0, -1);
    const nextQueue = currentTrack ? [currentTrack, ...queue] : queue;

    recordTrackPlay(prevTrack.id).then(hydrated => {
      set({
        history: nextHistory,
        currentTrack: hydrated,
        queue: nextQueue,
        progressSeconds: 0,
        durationSeconds: hydrated.duration_seconds || 180,
        isPlaying: true,
      });
    }).catch(err => alert(err.message));
  },

  seek: (seconds: number) => set({ progressSeconds: seconds }),

  setDuration: (seconds: number) => set({ durationSeconds: seconds }),

  tick: () => {
    const { isPlaying, progressSeconds, durationSeconds, next } = get();
    if (!isPlaying) return;

    if (progressSeconds >= durationSeconds) {
      next();
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