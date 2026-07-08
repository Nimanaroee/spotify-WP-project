import type { ReactNode } from 'react';
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';

import type { User } from '../../types';
import type { AppLanguage } from '../../types/settings';
import { getAppText } from '../../lib/constants/appText';
import { getProfileInitials } from './profileUtils';

interface ProfileSummaryHeaderProps {
  action?: ReactNode;
  avatarSize?: { xs: number; md: number } | number;
  gap?: { xs: number; md: number } | number;
  language?: AppLanguage;
  showSubscriptionLabel?: boolean;
  titleSize?: { xs: string; md: string };
  user: User;
}

export default function ProfileSummaryHeader({
  action,
  avatarSize = { xs: 72, md: 88 },
  gap = { xs: 1.5, md: 2.5 },
  language = 'en',
  showSubscriptionLabel = true,
  titleSize = { xs: '1.5rem', md: '2.125rem' },
  user,
}: ProfileSummaryHeaderProps) {
  const copy = getAppText(language);
  const subscriptionTier = user.subscription_tier ?? 'basic';

  return (
    <Stack
      spacing={3}
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        maxWidth: '100%',
        width: '100%',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: '1 1 auto',
          gap,
          maxWidth: '100%',
          minWidth: 0,
          width: '100%',
        }}
      >
        <Avatar
          alt={`Profile picture for ${user.display_name}`}
          src={user.profile_picture ?? undefined}
          sx={{
            bgcolor: 'primary.main',
            fontSize: typeof avatarSize === 'number' ? 28 : { xs: 24, md: 28 },
            height: avatarSize,
            width: avatarSize,
          }}
        >
          {getProfileInitials(user.display_name)}
        </Avatar>
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: titleSize,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {user.display_name}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.85rem', md: '1rem' },
              overflowWrap: 'anywhere',
            }}
          >
            @{user.username}
          </Typography>
          {showSubscriptionLabel ? (
            <Chip
              sx={{ mt: 1 }}
              color={subscriptionTier === 'gold' ? 'warning' : 'primary'}
              label={`${subscriptionTier.toUpperCase()} ${
                copy.profile.subscription
              }`}
              variant={subscriptionTier === 'basic' ? 'outlined' : 'filled'}
            />
          ) : null}
        </Box>
      </Box>
      {action}
    </Stack>
  );
}
