import { create } from 'zustand';
import type { Track } from '../types';
import type { RepeatMode } from '../types/player';

interface PlayerState {
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
    // Check if the user clicked the song that is ALREADY playing!
    // If they did, force a reset to 0 to simulate restarting the track immediately.
    const current = get().currentTrack;
    if (current?.id === track.id) {
       set({ progressSeconds: 0, isPlaying: true });
       return;
    }

    let finalQueue = contextQueue.length > 0 ? contextQueue.filter(t => t.id !== track.id) : get().queue;
    if (get().shuffle) {
      finalQueue = shuffleArray(finalQueue);
    }
    set({
      currentTrack: track,
      queue: finalQueue,
      isPlaying: true,
      progressSeconds: 0,
      durationSeconds: track.duration_seconds || 180,
    });
  },
  
  pause: () => set({ isPlaying: false }),
  
  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },

  next: (forceSkip = false) => {
    const { queue, repeatMode, currentTrack } = get();
    if (!currentTrack) return;
    
    if (repeatMode === 'one' && !forceSkip) {
      set({ progressSeconds: 0, isPlaying: true });
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      
      if (repeatMode === 'all') {
        newQueue.push(currentTrack);
      }
      
      set({
        currentTrack: nextTrack,
        queue: newQueue,
        progressSeconds: 0,
        durationSeconds: nextTrack.duration_seconds || 180,
        isPlaying: true,
      });
      return;
    } 

    if (repeatMode === 'all' || repeatMode === 'one') {
      set({ progressSeconds: 0, isPlaying: true });
    } else {
      set({ progressSeconds: 0, isPlaying: false });
    }
  },

  prev: () => {
    set({ progressSeconds: 0, isPlaying: true });
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