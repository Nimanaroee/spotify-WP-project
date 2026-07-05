import { Box, Paper, Typography } from '@mui/material';

import type { AppLanguage } from '../../types/settings';
import { getManagePageText } from '../../lib/constants/managePageText';

interface ProfileStatsGridProps {
  columns: string;
  language?: AppLanguage;
  labelSize: string;
  padding: number;
  stats: Array<
    | {
        key: 'followers' | 'following' | 'streamedToday';
        value: number;
      }
    | {
        label: string;
        value: number;
      }
  >;
  valueSize: string;
}

export default function ProfileStatsGrid({
  columns,
  language = 'en',
  labelSize,
  padding,
  stats,
  valueSize,
}: ProfileStatsGridProps) {
  const copy = getManagePageText(language);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: columns,
      }}
    >
      {stats.map((stat) => (
        <Paper
          key={'key' in stat ? stat.key : stat.label}
          variant="outlined"
          sx={{ p: padding }}
        >
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ fontSize: labelSize }}
          >
            {'key' in stat ? copy.stats[stat.key] : stat.label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, fontSize: valueSize }}
          >
            {stat.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
