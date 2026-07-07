import type { AppLanguage } from '../../types'

type HomePageCopy = {
  nav: {
    home: string
    playlists: string
    albums: string
    artistStudio: string
    profile: string
    settings: string
    openSidebar: string
    closeSidebar: string
  }
  artistStudioPrompt: string
  showcase: {
    recentPlaylists: string
    latestAlbums: string
    latestReleases: string
    topSongs: string
    earlyAccess: string
    earlyAccessBadge: string
    tracksCount: (count: number) => string
  }
}

const COPY: Record<AppLanguage, HomePageCopy> = {
  en: {
    nav: {
      home: 'Home',
      playlists: 'Playlists',
      albums: 'Albums & Singles',
      artistStudio: 'Artist Studio',
      profile: 'Profile',
      settings: 'Settings',
      openSidebar: 'Open Sidebar',
      closeSidebar: 'Close Sidebar',
    },
    artistStudioPrompt: 'Manage your releases, upload tracks, and view performance stats.',
    showcase: {
      recentPlaylists: 'Recently Listened Playlists',
      latestAlbums: 'Latest Released Albums',
      latestReleases: 'Latest Releases',
      topSongs: 'Most-Listened Songs',
      earlyAccess: 'Early Access New Releases',
      earlyAccessBadge: 'Gold Early Access',
      tracksCount: (count) => `${count} tracks`,
    },
  },
  fa: {
    nav: {
      home: 'صفحه اصلی',
      playlists: 'پلی‌لیست‌ها',
      albums: 'آلبوم‌ها و تک‌آهنگ‌ها',
      artistStudio: 'استودیو هنرمند',
      profile: 'پروفایل',
      settings: 'تنظیمات',
      openSidebar: 'باز کردن منو',
      closeSidebar: 'بستن منو',
    },
    artistStudioPrompt: 'انتشارات خود را مدیریت کنید، ترک بارگذاری کنید و آمار عملکرد را ببینید.',
    showcase: {
      recentPlaylists: 'پلی‌لیست‌های اخیر',
      latestAlbums: 'جدیدترین آلبوم‌ها',
      latestReleases: 'جدیدترین انتشارات',
      topSongs: 'پربازدیدترین آهنگ‌ها',
      earlyAccess: 'دسترسی زودهنگام به آثار جدید',
      earlyAccessBadge: 'ویژه طلایی',
      tracksCount: (count) => `${count} قطعه`,
    },
  },
}

export function getHomePageText(language: AppLanguage): HomePageCopy {
  return COPY[language]
}