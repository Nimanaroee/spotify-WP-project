import type { AppLanguage } from '../../types';

type PlayerPageCopy = {
  queue: string;
  lyrics: string;
  noLyrics: string;
  emptyQueue: string;
  stats: {
    streams: (count: number) => string;
    listeners: (count: number) => string;
  };
  actions: {
    play: string;
    pause: string;
    next: string;
    prev: string;
    shuffle: string;
    repeat: string;
    expand: string;
    collapse: string;
  };
}

const COPY: Record<AppLanguage, PlayerPageCopy> = {
  en: {
    queue: 'Queue',
    lyrics: 'Lyrics',
    noLyrics: 'No lyrics available.',
    emptyQueue: 'Up next is empty.',
    stats: {
      streams: (c) => `${c.toLocaleString()} Streams`,
      listeners: (c) => `${c.toLocaleString()} Listeners`,
    },
    actions: {
      play: 'Play',
      pause: 'Pause',
      next: 'Next',
      prev: 'Previous',
      shuffle: 'Shuffle',
      repeat: 'Repeat',
      expand: 'Expand',
      collapse: 'Collapse',
    },
  },
  fa: {
    queue: 'صف پخش',
    lyrics: 'متن آهنگ',
    noLyrics: 'متن این آهنگ در دسترس نیست.',
    emptyQueue: 'لیست پخش خالی است.',
    stats: {
      streams: (c) => `${c.toLocaleString()} پخش`,
      listeners: (c) => `${c.toLocaleString()} شنونده`,
    },
    actions: {
      play: 'پخش',
      pause: 'توقف',
      next: 'بعدی',
      prev: 'قبلی',
      shuffle: 'تصادفی',
      repeat: 'تکرار',
      expand: 'بزرگ کردن',
      collapse: 'کوچک کردن',
    },
  },
}

export function getPlayerText(language: AppLanguage): PlayerPageCopy {
  return COPY[language];
}