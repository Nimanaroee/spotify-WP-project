import type { AppLanguage } from '../../types'

type PlaylistsPageCopy = {
  pageTitle: string
  emptyState: {
    title: string
    description: string
  }
  limits: {
    status: (current: number, limit: number) => string
    reachedTooltip: (tier: string, limit: number) => string
  }
  actions: {
    create: string
    createFirst: string
    addSongs: string
    rename: string
    delete: string
    save: string
    cancel: string
    add: string
    remove: string
  }
  dialogs: {
    createTitle: string
    renameTitle: string
    deleteTitle: string
    addSongsTitle: string
    searchPlaceholder: string
    deleteConfirm: (name: string) => string
    nameLabel: string
    nameRequired: string
    noResults: string
  }
  list: {
    emptyPlaylist: string
  }
  messages: {
    created: string
    renamed: string
    deleted: string
    error: string
  }
}

const COPY: Record<AppLanguage, PlaylistsPageCopy> = {
  en: {
    pageTitle: 'My Playlists',
    emptyState: {
      title: 'No playlists yet',
      description: 'Start building your ultimate music library.',
    },
    limits: {
      status: (current, limit) => `${current} / ${limit} playlists`,
      reachedTooltip: (tier, limit) => `You've reached the ${limit}-playlist limit for your ${tier} plan. Upgrade for more.`,
    },
    actions: {
      create: 'Create Playlist',
      createFirst: 'Create Your First Playlist',
      addSongs: 'Add Songs',
      rename: 'Rename',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      add: 'Add',
      remove: 'Remove',
    },
    dialogs: {
      createTitle: 'Create New Playlist',
      renameTitle: 'Rename Playlist',
      deleteTitle: 'Delete Playlist',
      addSongsTitle: 'Search and Add Songs',
      searchPlaceholder: 'Search by song title or artist...',
      deleteConfirm: (name) => `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      nameLabel: 'Playlist Name',
      nameRequired: 'Name is required.',
      noResults: 'No songs found matching your search.',
    },
    list: {
      emptyPlaylist: 'This playlist is empty.',
    },
    messages: {
      created: 'Playlist created successfully.',
      renamed: 'Playlist renamed.',
      deleted: 'Playlist deleted.',
      error: 'An error occurred. Please try again.',
    },
  },
  fa: {
    pageTitle: 'پلی‌لیست‌های من',
    emptyState: {
      title: 'هیچ پلی‌لیستی وجود ندارد',
      description: 'ساخت کتابخانه موسیقی خود را شروع کنید.',
    },
    limits: {
      status: (current, limit) => `${current} / ${limit} پلی‌لیست`,
      reachedTooltip: (tier, limit) => `شما به محدودیت ${limit} پلی‌لیست در طرح ${tier} رسیده‌اید. برای افزایش سقف، اشتراک خود را ارتقا دهید.`,
    },
    actions: {
      create: 'ساخت پلی‌لیست',
      createFirst: 'اولین پلی‌لیست خود را بسازید',
      addSongs: 'افزودن آهنگ',
      rename: 'تغییر نام',
      delete: 'حذف',
      save: 'ذخیره',
      cancel: 'لغو',
      add: 'افزودن',
      remove: 'حذف',
    },
    dialogs: {
      createTitle: 'ساخت پلی‌لیست جدید',
      renameTitle: 'تغییر نام پلی‌لیست',
      deleteTitle: 'حذف پلی‌لیست',
      addSongsTitle: 'جستجو و افزودن آهنگ',
      searchPlaceholder: 'جستجوی آهنگ یا هنرمند...',
      deleteConfirm: (name) => `آیا از حذف "${name}" مطمئن هستید؟ این کار قابل بازگشت نیست.`,
      nameLabel: 'نام پلی‌لیست',
      nameRequired: 'نام پلی‌لیست الزامی است.',
      noResults: 'آهنگی مطابق جستجوی شما یافت نشد.',
    },
    list: {
      emptyPlaylist: 'این پلی‌لیست خالی است.',
    },
    messages: {
      created: 'پلی‌لیست با موفقیت ایجاد شد.',
      renamed: 'نام پلی‌لیست تغییر کرد.',
      deleted: 'پلی‌لیست حذف شد.',
      error: 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
    },
  },
}

export function getPlaylistsPageText(language: AppLanguage): PlaylistsPageCopy {
  return COPY[language]
}