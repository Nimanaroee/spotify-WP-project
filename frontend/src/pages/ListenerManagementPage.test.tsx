import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ListenerManagementPage from './ListenerManagementPage';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import { ROLES } from '../lib/constants/roles';
import { ROUTES } from '../lib/constants/routes';
import { getListenerManagementProfile } from '../lib/mock/userProfileService';
import { storage } from '../lib/mock/storage';
import { useAuthStore } from '../store/authStore';
import {
  APP_LANGUAGE_STORAGE_KEY,
  LanguageContext,
} from '../theme/LanguageContext';
import type { User } from '../types';

interface StoredTestUser extends User {
  password?: string;
}

function TestLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'fa'>(
    localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) === 'fa' ? 'fa' : 'en'
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: 'en' | 'fa') => {
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
        setLanguage(nextLanguage);
      },
      toggleLanguage: () => {
        const nextLanguage = language === 'en' ? 'fa' : 'en';
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
        setLanguage(nextLanguage);
      },
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

function renderListenerManagementPage(initialPath = ROUTES.MANAGE) {
  return render(
    <TestLanguageProvider>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.MANAGE} element={<ListenerManagementPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </TestLanguageProvider>
  );
}

function setMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    } as MediaQueryList)) as typeof window.matchMedia;
}

function setMobileViewport(): void {
  window.innerWidth = 375;
  window.innerHeight = 812;
  setMatchMedia(true);
  window.dispatchEvent(new Event('resize'));
}

function setDesktopViewport(): void {
  window.innerWidth = 1280;
  window.innerHeight = 900;
  setMatchMedia(false);
  window.dispatchEvent(new Event('resize'));
}

describe('ListenerManagementPage', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.set('users', [
      {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        password: 'password123',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        birth_date: '2000-01-01',
        gender: 'prefer_not_to_say',
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'follower_friend',
        email: 'follower@example.com',
        password: 'password123',
        display_name: 'Follower Friend',
        role: ROLES.LISTENER,
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'following_friend',
        email: 'following@example.com',
        password: 'password123',
        display_name: 'Following Friend',
        role: ROLES.LISTENER,
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 4,
        username: 'demo_artist',
        email: 'artist@example.com',
        password: 'password123',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    storage.set('artist_profiles', [
      {
        id: 1,
        user_id: 4,
        stage_name: 'Demo Artist',
        bio: 'Artist biography.',
        verification_status: 'pending',
        is_verified: false,
        listener_count: 30,
        total_streams: 80,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    storage.set('tracks', [
      {
        id: 1,
        title: 'Artist Single',
        artist_id: 4,
        artist_name: 'Demo Artist',
        release_type: 'single',
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    ]);
    storage.set('albums', []);
    storage.set('daily_streams', { 1: 12 });
    storage.set('follows', [
      {
        id: 1,
        follower_id: 2,
        followed_id: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        follower_id: 1,
        followed_id: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        birth_date: '2000-01-01',
        gender: 'prefer_not_to_say',
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('shows listener profile details and stream stats', () => {
    setDesktopViewport();
    renderListenerManagementPage();

    expect(
      screen.getByRole('heading', { name: 'Listener' })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('listener')).toBeInTheDocument();
    expect(screen.getByText('BASIC subscription')).toBeInTheDocument();
    expect(screen.getByText('Streamed today')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /followers \(1\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Follower Friend')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /follower friend/i })
    ).toHaveAttribute('href', '/profile/follower_friend');
    expect(
      screen.queryByRole('button', { name: /unfollow follower friend/i })
    ).toBeNull();
  });

  it('does not render the old language switcher on the management page', () => {
    setDesktopViewport();
    renderListenerManagementPage();

    expect(
      screen.queryByRole('button', { name: /فارسی|persian|english/i })
    ).not.toBeInTheDocument();
  });

  it('hides profile photo upload for Basic subscribers', async () => {
    const user = userEvent.setup();
    setMobileViewport();
    renderListenerManagementPage();

    await user.click(
      screen.getByRole('button', { name: /edit/i, hidden: false })
    );

    expect(
      screen.queryByRole('button', { name: /change profile photo/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/profile photo upload/i)
    ).not.toBeInTheDocument();
  });

  it('uploads and saves a profile photo for non-Basic subscribers', async () => {
    const user = userEvent.setup();
    setMobileViewport();
    const users = storage.get<StoredTestUser[]>('users') ?? [];
    storage.set(
      'users',
      users.map((storedUser) =>
        storedUser.id === 1
          ? { ...storedUser, subscription_tier: 'silver' }
          : storedUser
      )
    );
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        birth_date: '2000-01-01',
        gender: 'prefer_not_to_say',
        profile_picture: null,
        subscription_tier: 'silver',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
    renderListenerManagementPage();

    await user.click(
      screen.getByRole('button', { name: /edit/i, hidden: false })
    );
    await user.upload(
      screen.getByLabelText(/profile photo upload/i),
      new File(['avatar'], 'avatar.png', { type: 'image/png' })
    );
    await screen.findByText('Profile photo ready to save.');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(getListenerManagementProfile(1).user.profile_picture).toMatch(
        /^data:image\/png;base64,/
      )
    );
  });

  it('saves edited personal information', async () => {
    const user = userEvent.setup();
    setMobileViewport();
    renderListenerManagementPage();

    await user.click(
      screen.getByRole('button', { name: /edit/i, hidden: false })
    );
    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), 'Updated Listener');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(getListenerManagementProfile(1).user.display_name).toBe(
      'Updated Listener'
    );
    expect(screen.getByText('Profile updated.')).toBeInTheDocument();
  });

  it('removes a follower from the followers list', async () => {
    const user = userEvent.setup();
    setDesktopViewport();
    renderListenerManagementPage();

    await user.click(screen.getByRole('tab', { name: /following \(1\)/i }));
    await user.click(
      screen.getByRole('button', { name: /unfollow following friend/i })
    );

    expect(getListenerManagementProfile(1).following).toHaveLength(0);
  });

  it('unfollows an account from the following list', async () => {
    const user = userEvent.setup();
    setDesktopViewport();
    renderListenerManagementPage();

    await user.click(screen.getByRole('tab', { name: /following \(1\)/i }));
    await user.click(
      screen.getByRole('button', { name: /unfollow following friend/i })
    );

    expect(getListenerManagementProfile(1).following).toHaveLength(0);
  });

  it('renders fixed-height scrollable follow panels', () => {
    setDesktopViewport();
    renderListenerManagementPage();

    expect(screen.getByRole('list')).toHaveStyle({ maxHeight: '320px' });
  });

  it('keeps follow panels compact on mobile', () => {
    setMobileViewport();
    renderListenerManagementPage();

    expect(screen.getByRole('list')).toHaveStyle({ maxHeight: '260px' });
  });

  it('renders musician management with editable artistic name', async () => {
    const user = userEvent.setup();
    setDesktopViewport();
    useAuthStore.setState({
      user: {
        id: 4,
        username: 'demo_artist',
        email: 'artist@example.com',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });

    renderListenerManagementPage();

    expect(screen.getByLabelText(/artistic name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/biography/i)).toHaveValue('Artist biography.');
    expect(screen.getByText('Artist Single')).toBeInTheDocument();
    expect(screen.queryByText('Verified Artist')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/artistic name/i));
    await user.type(screen.getByLabelText(/artistic name/i), 'Updated Artist');
    await user.clear(screen.getByLabelText(/biography/i));
    await user.type(screen.getByLabelText(/biography/i), 'Updated biography.');
    await user.upload(
      screen.getByLabelText(/profile photo upload/i),
      new File(['avatar'], 'artist.png', { type: 'image/png' })
    );
    await screen.findByText('Profile photo ready to save.');
    await user.click(screen.getByRole('button', { name: /save artist profile/i }));

    expect(await screen.findByText('Artist profile updated.')).toBeInTheDocument();
    const artistProfile = storage
      .get<Array<{ user_id: number; stage_name: string; bio?: string }>>(
        'artist_profiles'
      )
      ?.find((profile) => profile.user_id === 4);
    expect(artistProfile?.stage_name).toBe('Updated Artist');
    expect(artistProfile?.bio).toBe('Updated biography.');
    expect(
      storage
        .get<Array<{ id: number; profile_picture?: string | null }>>('users')
        ?.find((storedUser) => storedUser.id === 4)?.profile_picture
    ).toMatch(/^data:image\/png;base64,/);
  });
});
