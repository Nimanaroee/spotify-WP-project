import type { ReactNode } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import type { UserSummary } from '../../types';
import { getProfileInitials } from './profileUtils';

interface FollowAccountRowProps {
  account: UserSummary;
  action?: ReactNode;
  avatarSize: number;
  gap: number;
  href?: string;
  isCompact: boolean;
  subtitleSize: string;
  titleSize: string;
}

export default function FollowAccountRow({
  account,
  action,
  avatarSize,
  gap,
  href,
  isCompact,
  subtitleSize,
  titleSize,
}: FollowAccountRowProps) {
  const accountContent = (
    <>
      <Avatar
        alt={`Profile picture for ${account.display_name}`}
        src={account.profile_picture ?? undefined}
        sx={{ bgcolor: 'primary.main', height: avatarSize, width: avatarSize }}
      >
        {getProfileInitials(account.display_name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: titleSize }}>
          {account.display_name}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ fontSize: subtitleSize }}
        >
          @{account.username}
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      role="listitem"
      sx={{
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        gap,
        justifyContent: action ? 'space-between' : 'flex-start',
        p: isCompact ? 1 : 1.5,
      }}
    >
      {href ? (
        <Box
          component={RouterLink}
          to={href}
          sx={{
            alignItems: 'center',
            color: 'inherit',
            display: 'flex',
            gap,
            minWidth: 0,
            textDecoration: 'none',
          }}
        >
          {accountContent}
        </Box>
      ) : (
        <Box sx={{ alignItems: 'center', display: 'flex', gap, minWidth: 0 }}>
          {accountContent}
        </Box>
      )}
      {action}
    </Box>
  );
}
