import { Box, Paper, Typography } from '@mui/material';

interface ProfileStatsGridProps {
  columns: string;
  labelSize: string;
  padding: number;
  stats: Array<{
    label: string;
    value: number;
  }>;
  valueSize: string;
}

export default function ProfileStatsGrid({
  columns,
  labelSize,
  padding,
  stats,
  valueSize,
}: ProfileStatsGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: columns,
      }}
    >
      {stats.map((stat) => (
        <Paper key={stat.label} variant="outlined" sx={{ p: padding }}>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ fontSize: labelSize }}
          >
            {stat.label}
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
