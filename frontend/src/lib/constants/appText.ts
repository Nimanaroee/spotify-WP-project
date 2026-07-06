import type { AppLanguage } from '../../types';

type SharedCopy = {
  auth: {
    createAccount: string;
    email: string;
    forgotPassword: string;
    gender: string;
    guest: string;
    logIn: string;
    logout: string;
    password: string;
    recoverPassword: string;
    sendRecoveryEmail: string;
    backToLogin: string;
    regularUser: string;
    artist: string;
    register: string;
    loginSubtitle: string;
    welcome: string;
  };
  home: {
    manageProfile: string;
    settings: string;
  };
  profile: {
    birthDate: string;
    follow: string;
    following: string;
    followers: string;
    gender: string;
    genderValue: {
      female: string;
      male: string;
      other: string;
      preferNotToSay: string;
    };
    notSet: string;
    streamedToday: string;
    subscription: string;
    unfollow: string;
  };
  roleLanding: {
    goHome: string;
  };
  settings: {
    languageLabel: string;
    pageTitle: string;
    subtitle: string;
    notificationsTitle: string;
    notificationsDescription: string;
    notificationLimit: string;
    appSoundEnabled: string;
    systemTitle: string;
    systemDescription: string;
    systemVoice: string;
    theme: string;
    subscriptionTitle: string;
    subscriptionDescription: string;
    currentPlan: string;
    accountTitle: string;
    accountDescription: string;
    deleteAccount: string;
    deleteConfirmation: string;
    savePreferences: string;
    preferencesSaved: string;
    subscriptionSaved: string;
    accountDeleted: string;
    voiceOptions: {
      default: string;
      calm: string;
      bright: string;
    };
    tierOptions: {
      basic: string;
      silver: string;
      gold: string;
    };
  };
  common: {
    english: string;
    persian: string;
    back: string;
    cancel: string;
    close: string;
    loading: string;
    notFound: string;
  };
  admin: {
    title: string;
    ticketsTab: string;
    verificationTab: string;
    noTickets: string;
    noRequests: string;
    supportTickets: string;
    artistRequests: string;
    backToTickets: string;
    backToRequests: string;
    ticketId: string;
    userName: string;
    subject: string;
    dateSubmitted: string;
    status: string;
    stageName: string;
    email: string;
    actions: string;
    viewPortfolio: string;
    notFoundTicket: string;
    notFoundRequest: string;
    approved: string;
    rejected: string;
    pending: string;
  };
};

export const APP_TEXT: Record<AppLanguage, SharedCopy> = {
  en: {
    auth: {
      createAccount: 'Create account',
      email: 'Email',
      forgotPassword: 'Forgot Password?',
      gender: 'Gender',
      guest: 'Guest',
      logIn: 'Log in',
      logout: 'Logout',
      password: 'Password',
      recoverPassword: 'Recover password',
      sendRecoveryEmail: 'Send recovery email',
      backToLogin: 'Back to login',
      loginSubtitle: 'Login to enjoy our world of music.',
      regularUser: 'Regular user',
      artist: 'Artist',
      register: 'Register',
      welcome: 'Welcome',
    },
    home: {
      manageProfile: 'Manage listener profile',
      settings: 'Settings',
    },
    profile: {
      birthDate: 'Birth date',
      follow: 'Follow',
      following: 'Following',
      followers: 'Followers',
      gender: 'Gender',
      genderValue: {
        female: 'Female',
        male: 'Male',
        other: 'Other',
        preferNotToSay: 'Prefer not to say',
      },
      notSet: 'Not set',
      streamedToday: 'Streamed today',
      subscription: 'subscription',
      unfollow: 'Unfollow',
    },
    roleLanding: {
      goHome: 'Go to home',
    },
    settings: {
      languageLabel: 'Language',
      pageTitle: 'Settings',
      subtitle: 'Control notifications, system preferences, account access, and subscription status.',
      notificationsTitle: 'Notification settings',
      notificationsDescription: 'Limit how many notifications the app keeps visible for your listener account.',
      notificationLimit: 'Notification limit',
      appSoundEnabled: 'Notification sounds',
      systemTitle: 'System preferences',
      systemDescription: 'Choose the app language, voice style, and theme for this device.',
      systemVoice: 'System voice',
      theme: 'Theme',
      subscriptionTitle: 'Subscription status',
      subscriptionDescription: 'Your current plan is stored locally for Phase 1. Change it to preview upgrades or downgrades.',
      currentPlan: 'Current plan',
      accountTitle: 'Account management',
      accountDescription: 'Delete your local mock account and sign out from this browser.',
      deleteAccount: 'Delete account',
      deleteConfirmation: 'Delete your account? This removes the local mock user from this browser.',
      savePreferences: 'Save preferences',
      preferencesSaved: 'Settings saved.',
      subscriptionSaved: 'Subscription updated.',
      accountDeleted: 'Account deleted.',
      voiceOptions: {
        default: 'Default',
        calm: 'Calm',
        bright: 'Bright',
      },
      tierOptions: {
        basic: 'Basic',
        silver: 'Silver',
        gold: 'Gold',
      },
    },
    common: {
      english: 'English',
      persian: 'Persian',
      back: 'Back',
      cancel: 'Cancel',
      close: 'Close',
      loading: 'Loading',
      notFound: 'Not found',
    },
    admin: {
      title: 'Tickets & Authentication',
      ticketsTab: 'Support Tickets',
      verificationTab: 'Artist Approval Requests',
      noTickets: 'No support tickets yet.',
      noRequests: 'No pending artist approval requests.',
      supportTickets: 'Support Tickets',
      artistRequests: 'Artist Approval Requests',
      backToTickets: 'Back to tickets',
      backToRequests: 'Back to requests',
      ticketId: 'Ticket ID',
      userName: 'User Name',
      subject: 'Subject',
      dateSubmitted: 'Date Submitted',
      status: 'Status',
      stageName: 'Stage Name',
      email: 'Email',
      actions: 'Actions',
      viewPortfolio: 'View portfolio/samples',
      notFoundTicket: 'Ticket not found.',
      notFoundRequest: 'Verification request not found.',
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Pending',
    },
  },
  fa: {
    auth: {
      createAccount: 'ایجاد حساب',
      email: 'ایمیل',
      forgotPassword: 'فراموشی رمز عبور؟',
      gender: 'جنسیت',
      guest: 'مهمان',
      logIn: 'ورود',
      logout: 'خروج',
      password: 'رمز عبور',
      recoverPassword: 'بازیابی رمز عبور',
      sendRecoveryEmail: 'ارسال ایمیل بازیابی',
      backToLogin: 'بازگشت به ورود',
      loginSubtitle: 'برای لذت بردن از دنیای موسیقی ما وارد شوید.',
      regularUser: 'کاربر عادی',
      artist: 'هنرمند',
      register: 'ثبت‌نام',
      welcome: 'خوش آمدید',
    },
    home: {
      manageProfile: 'مدیریت پروفایل شنونده',
      settings: 'تنظیمات',
    },
    profile: {
      birthDate: 'تاریخ تولد',
      follow: 'دنبال کردن',
      following: 'دنبال‌شده‌ها',
      followers: 'دنبال‌کنندگان',
      gender: 'جنسیت',
      genderValue: {
        female: 'زن',
        male: 'مرد',
        other: 'سایر',
        preferNotToSay: 'ترجیح می‌دهم نگویم',
      },
      notSet: 'ثبت نشده',
      streamedToday: 'پخش امروز',
      subscription: 'اشتراک',
      unfollow: 'لغو دنبال‌کردن',
    },
    roleLanding: {
      goHome: 'رفتن به صفحه اصلی',
    },
    settings: {
      languageLabel: 'زبان',
      pageTitle: 'تنظیمات',
      subtitle: 'اعلان‌ها، ترجیحات سیستم، حساب کاربری و وضعیت اشتراک را مدیریت کنید.',
      notificationsTitle: 'تنظیمات اعلان',
      notificationsDescription: 'تعداد اعلان‌هایی را که برنامه برای حساب شنونده نشان می‌دهد محدود کنید.',
      notificationLimit: 'حد اعلان‌ها',
      appSoundEnabled: 'صدای اعلان‌ها',
      systemTitle: 'ترجیحات سیستم',
      systemDescription: 'زبان برنامه، سبک صدا و پوسته این دستگاه را انتخاب کنید.',
      systemVoice: 'صدای سیستم',
      theme: 'پوسته',
      subscriptionTitle: 'وضعیت اشتراک',
      subscriptionDescription: 'اشتراک فعلی در فاز اول به‌صورت محلی ذخیره می‌شود. برای پیش‌نمایش ارتقا یا کاهش، آن را تغییر دهید.',
      currentPlan: 'طرح فعلی',
      accountTitle: 'مدیریت حساب',
      accountDescription: 'حساب محلی آزمایشی خود را حذف کنید و از این مرورگر خارج شوید.',
      deleteAccount: 'حذف حساب',
      deleteConfirmation: 'حساب حذف شود؟ این کار کاربر آزمایشی محلی را از این مرورگر حذف می‌کند.',
      savePreferences: 'ذخیره تنظیمات',
      preferencesSaved: 'تنظیمات ذخیره شد.',
      subscriptionSaved: 'اشتراک به‌روزرسانی شد.',
      accountDeleted: 'حساب حذف شد.',
      voiceOptions: {
        default: 'پیش‌فرض',
        calm: 'آرام',
        bright: 'روشن',
      },
      tierOptions: {
        basic: 'پایه',
        silver: 'نقره‌ای',
        gold: 'طلایی',
      },
    },
    common: {
      english: 'انگلیسی',
      persian: 'فارسی',
      back: 'بازگشت',
      cancel: 'لغو',
      close: 'بستن',
      loading: 'در حال بارگذاری',
      notFound: 'پیدا نشد',
    },
    admin: {
      title: 'تیکت‌ها و احراز هویت',
      ticketsTab: 'تیکت‌های پشتیبانی',
      verificationTab: 'درخواست‌های تایید هنرمند',
      noTickets: 'هنوز تیکت پشتیبانی‌ای وجود ندارد.',
      noRequests: 'درخواست تایید هنرمندی در انتظار نیست.',
      supportTickets: 'تیکت‌های پشتیبانی',
      artistRequests: 'درخواست‌های تایید هنرمند',
      backToTickets: 'بازگشت به تیکت‌ها',
      backToRequests: 'بازگشت به درخواست‌ها',
      ticketId: 'شناسه تیکت',
      userName: 'نام کاربر',
      subject: 'موضوع',
      dateSubmitted: 'تاریخ ارسال',
      status: 'وضعیت',
      stageName: 'نام هنری',
      email: 'ایمیل',
      actions: 'عملیات',
      viewPortfolio: 'مشاهده نمونه کارها',
      notFoundTicket: 'تیکت پیدا نشد.',
      notFoundRequest: 'درخواست تایید پیدا نشد.',
      approved: 'تایید شده',
      rejected: 'رد شده',
      pending: 'در انتظار',
    },
  },
};

export function getAppText(language: AppLanguage): SharedCopy {
  return APP_TEXT[language];
}
