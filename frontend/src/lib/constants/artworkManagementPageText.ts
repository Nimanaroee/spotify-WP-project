import type { AppLanguage } from '../../types'
import type { ReleaseType } from '../../types/music'

type ArtworkCopy = {
  pageTitle: string
  tabs: {
    releases: string
    publish: string
  }
  blocked: {
    title: string
    message: string
  }
  emptyState: string
  form: {
    releaseType: string
    single: string
    album: string
    title: string
    genre: string
    releaseYear: string
    coArtists: string
    coArtistsHint: string
    coverArt: string
    uploadCover: string
    trackTitle: string
    audioFile: string
    uploadAudio: string
    lyrics: string
    addTrack: string
    removeTrack: string
    publish: string
    audioHint: string
    uploading: string
    uploadedFile: (fileName: string) => string
    existingAudioAttached: string
  }
  list: {
    title: string
    type: string
    listeners: string
    streams: string
    revenue: string
    actions: string
    edit: string
    delete: string
    play: string
    single: string
    album: string
  }
  edit: {
    title: string
    save: string
    cancel: string
  }
  delete: {
    title: string
    message: (title: string) => string
    confirm: string
    cancel: string
  }
    messages: {
      published: string
      updated: string
      deleted: string
      invalidAudio: string
      coverReady: string
      audioReady: string
      storageQuotaExceeded: string
    }
  upload: {
    errors: {
      emptyFile: string
      invalidAudio: string
      invalidImage: string
      fileTooLarge: string
      readFailed: string
      uploadFailed: string
    }
  }
  releaseTypeLabels: Record<ReleaseType, string>
}

const COPY: Record<AppLanguage, ArtworkCopy> = {
  en: {
    pageTitle: 'Artist Studio',
    tabs: {
      releases: 'My Releases',
      publish: 'Publish',
    },
    blocked: {
      title: 'Access restricted',
      message: 'Your account must be approved before managing releases.',
    },
    emptyState: 'You have not published any tracks yet.',
    form: {
      releaseType: 'Release type',
      single: 'Single',
      album: 'Album',
      title: 'Release title',
      genre: 'Genre',
      releaseYear: 'Release year',
      coArtists: 'Collaborating artists',
      coArtistsHint: 'Comma-separated names',
      coverArt: 'Cover art',
      uploadCover: 'Upload cover image',
      trackTitle: 'Track title',
      audioFile: 'Audio file',
      uploadAudio: 'Upload audio',
      lyrics: 'Lyrics',
      addTrack: 'Add track',
      removeTrack: 'Remove track',
      publish: 'Publish release',
      audioHint: 'MP3, WAV, or FLAC (max 10 MB)',
      uploading: 'Uploading...',
      uploadedFile: (fileName) => `Uploaded: ${fileName}`,
      existingAudioAttached: 'Current audio attached',
    },
    list: {
      title: 'Title',
      type: 'Type',
      listeners: 'Listeners',
      streams: 'Streams',
      revenue: 'Revenue',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      play: 'Play',
      single: 'Single',
      album: 'Album',
    },
    edit: {
      title: 'Edit track',
      save: 'Save changes',
      cancel: 'Cancel',
    },
    delete: {
      title: 'Delete track',
      message: (title) => `Delete "${title}"? This cannot be undone.`,
      confirm: 'Delete',
      cancel: 'Cancel',
    },
    messages: {
      published: 'Release published successfully.',
      updated: 'Track updated successfully.',
      deleted: 'Track deleted successfully.',
      invalidAudio: 'Only MP3, WAV, and FLAC files are supported.',
      coverReady: 'Cover image ready.',
      audioReady: 'Audio file ready.',
      storageQuotaExceeded:
        'Could not save this release. Browser storage is full — try a smaller audio file or clear site data.',
    },
    upload: {
      errors: {
        emptyFile: 'The selected file is empty.',
        invalidAudio: 'Only MP3, WAV, and FLAC files are supported.',
        invalidImage: 'Only JPG, PNG, and WebP images are supported.',
        fileTooLarge: 'Audio file must be 10 MB or smaller.',
        readFailed: 'Could not read the audio file. Please try again.',
        uploadFailed: 'Upload failed. Please try again.',
      },
    },
    releaseTypeLabels: {
      single: 'Single',
      album: 'Album',
    },
  },
  fa: {
    pageTitle: 'استودیو هنرمند',
    tabs: {
      releases: 'انتشارات من',
      publish: 'انتشار',
    },
    blocked: {
      title: 'دسترسی محدود',
      message: 'حساب شما باید تأیید شود تا بتوانید آثار را مدیریت کنید.',
    },
    emptyState: 'هنوز اثری منتشر نکرده‌اید.',
    form: {
      releaseType: 'نوع انتشار',
      single: 'تک‌آهنگ',
      album: 'آلبوم',
      title: 'عنوان انتشار',
      genre: 'ژانر',
      releaseYear: 'سال انتشار',
      coArtists: 'هنرمندان همکار',
      coArtistsHint: 'نام‌ها با ویرگول جدا شوند',
      coverArt: 'کاور',
      uploadCover: 'بارگذاری تصویر کاور',
      trackTitle: 'عنوان ترک',
      audioFile: 'فایل صوتی',
      uploadAudio: 'بارگذاری فایل صوتی',
      lyrics: 'متن آهنگ',
      addTrack: 'افزودن ترک',
      removeTrack: 'حذف ترک',
      publish: 'انتشار اثر',
      audioHint: 'MP3، WAV یا FLAC (حداکثر ۱۰ مگابایت)',
      uploading: 'در حال بارگذاری...',
      uploadedFile: (fileName) => `بارگذاری شد: ${fileName}`,
      existingAudioAttached: 'فایل صوتی فعلی پیوست شده است',
    },
    list: {
      title: 'عنوان',
      type: 'نوع',
      listeners: 'شنوندگان',
      streams: 'پخش‌ها',
      revenue: 'درآمد',
      actions: 'عملیات',
      edit: 'ویرایش',
      delete: 'حذف',
      play: 'پخش',
      single: 'تک‌آهنگ',
      album: 'آلبوم',
    },
    edit: {
      title: 'ویرایش ترک',
      save: 'ذخیره تغییرات',
      cancel: 'لغو',
    },
    delete: {
      title: 'حذف ترک',
      message: (title) => `«${title}» حذف شود؟ این عمل قابل بازگشت نیست.`,
      confirm: 'حذف',
      cancel: 'لغو',
    },
    messages: {
      published: 'اثر با موفقیت منتشر شد.',
      updated: 'ترک با موفقیت به‌روزرسانی شد.',
      deleted: 'ترک با موفقیت حذف شد.',
      invalidAudio: 'فقط فایل‌های MP3، WAV و FLAC پشتیبانی می‌شوند.',
      coverReady: 'تصویر کاور آماده است.',
      audioReady: 'فایل صوتی آماده است.',
      storageQuotaExceeded:
        'انتشار ذخیره نشد. فضای ذخیره‌سازی مرورگر پر است — فایل صوتی کوچک‌تری انتخاب کنید یا داده‌های سایت را پاک کنید.',
    },
    upload: {
      errors: {
        emptyFile: 'فایل انتخاب‌شده خالی است.',
        invalidAudio: 'فقط فایل‌های MP3، WAV و FLAC پشتیبانی می‌شوند.',
        invalidImage: 'فقط تصاویر JPG، PNG و WebP پشتیبانی می‌شوند.',
        fileTooLarge: 'حجم فایل صوتی باید حداکثر ۱۰ مگابایت باشد.',
        readFailed: 'خواندن فایل صوتی ممکن نشد. دوباره تلاش کنید.',
        uploadFailed: 'بارگذاری ناموفق بود. دوباره تلاش کنید.',
      },
    },
    releaseTypeLabels: {
      single: 'تک‌آهنگ',
      album: 'آلبوم',
    },
  },
}

export function getArtworkManagementPageText(language: AppLanguage): ArtworkCopy {
  return COPY[language]
}
