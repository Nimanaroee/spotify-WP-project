import type { AppLanguage } from '../../types'

type AlbumsPageCopy = {
  pageTitle: string
  searchPlaceholder: string
  sortLabels: {
    releaseDate: string
    listenerCount: string
  }
  card: {
    album: string
    single: string
    streams: (count: number) => string
    listeners: (count: number) => string
    by: string
  }
  menu: {
    addToPlaylist: string
    removeFromPlaylist: string
  }
  dialogs: {
    addToPlaylistTitle: string
    done: string
    noPlaylists: string
  }
  detail: {
    trackTitle: string
    duration: string
    emptyAlbum: string
  }
  messages: {
    errorFetching: string
  }
}

const COPY: Record<AppLanguage, AlbumsPageCopy> = {
  en: {
    pageTitle: 'Discover Music',
    searchPlaceholder: 'Search by song title or artist...',
    sortLabels: {
      releaseDate: 'Newest Releases',
      listenerCount: 'Most Listened',
    },
    card: {
      album: 'Album',
      single: 'Song',
      streams: (count) => `${count} streams`,
      listeners: (count) => `${count} listeners`,
      by: 'by',
    },
    menu: {
      addToPlaylist: 'Add to Playlist',
      removeFromPlaylist: 'Remove from Playlist',
    },
    dialogs: {
      addToPlaylistTitle: 'Save to playlist',
      done: 'Done',
      noPlaylists: 'You do not have any playlists yet.',
    },
    detail: {
      trackTitle: 'Track',
      duration: 'Duration',
      emptyAlbum: 'This album has no tracks.',
    },
    messages: {
      errorFetching: 'Failed to load music catalog.',
    },
  },
  fa: {
    pageTitle: 'کشف موسیقی',
    searchPlaceholder: 'جستجو با نام آهنگ یا هنرمند...',
    sortLabels: {
      releaseDate: 'جدیدترین‌ها',
      listenerCount: 'پربازدیدترین‌ها',
    },
    card: {
      album: 'آلبوم',
      single: 'آهنگ',
      streams: (count) => `${count} پخش`,
      listeners: (count) => `${count} شنونده`,
      by: 'اثری از',
    },
    menu: {
      addToPlaylist: 'افزودن به پلی‌لیست',
      removeFromPlaylist: 'حذف از پلی‌لیست',
    },
    dialogs: {
      addToPlaylistTitle: 'ذخیره در پلی‌لیست',
      done: 'بستن',
      noPlaylists: 'شما هنوز هیچ پلی‌لیستی ندارید.',
    },
    detail: {
      trackTitle: 'قطعه',
      duration: 'مدت‌زمان',
      emptyAlbum: 'این آلبوم هیچ قطعه‌ای ندارد.',
    },
    messages: {
      errorFetching: 'خطا در بارگذاری فهرست موسیقی.',
    },
  },
}

export function getAlbumsPageText(language: AppLanguage): AlbumsPageCopy {
  return COPY[language]
}