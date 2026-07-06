import type { AppLanguage } from '../../types';

type ManageCopy = {
  actions: {
    cancel: string;
    edit: string;
    unfollow: string;
    save: string;
    switchToEnglish: string;
    switchToPersian: string;
  };
  form: {
    birthDate: string;
    changePhoto: string;
    displayName: string;
    gender: string;
    genderOptions: {
      female: string;
      male: string;
      other: string;
      preferNotToSay: string;
    };
    systemUsername: string;
  };
  messages: {
    photoReady: string;
    profileUpdated: string;
    profileNotFound: string;
    removedFollower: (name: string) => string;
    unfollowed: (name: string) => string;
  };
  sections: {
    followersAndFollowing: string;
    personalInformation: string;
  };
  stats: {
    followers: string;
    following: string;
    streamedToday: string;
  };
  subscription: {
    labelSuffix: string;
  };
  tabs: {
    followers: string;
    following: string;
  };
  emptyState: {
    accounts: string;
  };
};

export const MANAGE_PAGE_TEXT: Record<AppLanguage, ManageCopy> = {
  en: {
    actions: {
      cancel: 'Cancel',
      edit: 'Edit',
      unfollow: 'Unfollow',
      save: 'Save changes',
      switchToEnglish: 'English',
      switchToPersian: 'فارسی',
    },
    form: {
      birthDate: 'Birth date',
      changePhoto: 'Change profile photo',
      displayName: 'Display name',
      gender: 'Gender',
      genderOptions: {
        female: 'Female',
        male: 'Male',
        other: 'Other',
        preferNotToSay: 'Prefer not to say',
      },
      systemUsername: 'System username',
    },
    messages: {
      photoReady: 'Profile photo ready to save.',
      profileUpdated: 'Profile updated.',
      profileNotFound: 'Profile not found.',
      removedFollower: (name: string) => `${name} was removed from followers.`,
      unfollowed: (name: string) => `You unfollowed ${name}.`,
    },
    sections: {
      followersAndFollowing: 'Followers and following',
      personalInformation: 'Personal information',
    },
    stats: {
      followers: 'Followers',
      following: 'Following',
      streamedToday: 'Streamed today',
    },
    subscription: {
      labelSuffix: 'subscription',
    },
    tabs: {
      followers: 'Followers',
      following: 'Following',
    },
    emptyState: {
      accounts: 'No accounts to show.',
    },
  },
  fa: {
    actions: {
      cancel: 'لغو',
      edit: 'ویرایش',
      unfollow: 'لغو دنبال‌کردن',
      save: 'ذخیره تغییرات',
      switchToEnglish: 'English',
      switchToPersian: 'فارسی',
    },
    form: {
      birthDate: 'تاریخ تولد',
      changePhoto: 'تغییر عکس پروفایل',
      displayName: 'نام نمایشی',
      gender: 'جنسیت',
      genderOptions: {
        female: 'زن',
        male: 'مرد',
        other: 'سایر',
        preferNotToSay: 'ترجیح می‌دهم نگویم',
      },
      systemUsername: 'نام کاربری سیستم',
    },
    messages: {
      photoReady: 'عکس پروفایل آماده ذخیره است.',
      profileUpdated: 'پروفایل به‌روزرسانی شد.',
      profileNotFound: 'پروفایل پیدا نشد.',
      removedFollower: (name: string) => `‏${name} از دنبال‌کنندگان حذف شد.`,
      unfollowed: (name: string) => `‏${name} از دنبال‌شده‌ها حذف شد.`,
    },
    sections: {
      followersAndFollowing: 'دنبال‌کنندگان و دنبال‌شده‌ها',
      personalInformation: 'اطلاعات شخصی',
    },
    stats: {
      followers: 'دنبال‌کنندگان',
      following: 'دنبال‌شده‌ها',
      streamedToday: 'پخش امروز',
    },
    subscription: {
      labelSuffix: 'اشتراک',
    },
    tabs: {
      followers: 'دنبال‌کنندگان',
      following: 'دنبال‌شده‌ها',
    },
    emptyState: {
      accounts: 'حسابی برای نمایش وجود ندارد.',
    },
  },
};

export function getManagePageText(language: AppLanguage): ManageCopy {
  return MANAGE_PAGE_TEXT[language];
}
