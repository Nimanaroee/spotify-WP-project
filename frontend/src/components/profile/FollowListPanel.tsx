import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

import type { UserSummary } from '../../types';
import FollowAccountRow from './FollowAccountRow';

interface FollowListPanelProps {
  accounts: UserSummary[];
  avatarSize: number;
  emptyMessage: string;
  gap: number;
  getAccountAction?: (account: UserSummary) => ReactNode;
  getAccountHref?: (account: UserSummary) => string;
  height: number;
  isCompact: boolean;
  padding: number;
  spacing: number;
  surface?: boolean;
  subtitleSize: string;
  title?: string;
  titleSize: string;
}

export default function FollowListPanel({
  accounts,
  avatarSize,
  emptyMessage,
  gap,
  getAccountAction,
  getAccountHref,
  height,
  isCompact,
  padding,
  spacing,
  surface = true,
  subtitleSize,
  title,
  titleSize,
}: FollowListPanelProps) {
  const list = (
    <Box
      role="list"
      sx={{
        height,
        maxHeight: height,
        overflowY: 'auto',
        p: padding,
      }}
    >
      {accounts.length > 0 ? (
        <Stack spacing={spacing}>
          {accounts.map((account) => (
            <FollowAccountRow
              account={account}
              action={getAccountAction?.(account)}
              avatarSize={avatarSize}
              gap={gap}
              href={getAccountHref?.(account)}
              isCompact={isCompact}
              key={account.id}
              subtitleSize={subtitleSize}
              titleSize={titleSize}
            />
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box>
      {title ? (
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      {surface ? <Paper variant="outlined">{list}</Paper> : list}
    </Box>
  );
}
