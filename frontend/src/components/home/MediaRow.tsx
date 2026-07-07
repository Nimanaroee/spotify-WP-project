import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface MediaRowProps {
  title: string;
  children: ReactNode;
  show?: boolean;
}

export default function MediaRow({ title, children, show = true }: MediaRowProps) {
  if (!show) return null;

  return (
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 2,
          px: { xs: 2, md: 4 },
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 2,
          pb: 2,
          px: { xs: 2, md: 4 },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}