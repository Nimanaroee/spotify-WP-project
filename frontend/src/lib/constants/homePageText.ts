import type { AppLanguage } from '../../types'

type HomePageCopy = {
  nav: {
    home: string
    playlists: string
    albums: string
    profile: string
    settings: string
    openSidebar: string
    closeSidebar: string
  }
  showcase: {
    recentPlaylists: string
    latestAlbums: string
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
      profile: 'Profile',
      settings: 'Settings',
      openSidebar: 'Open Sidebar',
      closeSidebar: 'Close Sidebar',
    },
    showcase: {
      recentPlaylists: 'Recently Listened Playlists',
      latestAlbums: 'Latest Released Albums',
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
      profile: 'پروفایل',
      settings: 'تنظیمات',
      openSidebar: 'باز کردن منو',
      closeSidebar: 'بستن منو',
    },
    showcase: {
      recentPlaylists: 'پلی‌لیست‌های اخیر',
      latestAlbums: 'جدیدترین آلبوم‌ها',
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