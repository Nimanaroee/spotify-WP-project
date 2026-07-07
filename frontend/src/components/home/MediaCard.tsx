import {
  Card,
  CardActionArea,
  CardMedia,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Music } from 'lucide-react';
import type { ReactNode } from 'react';

interface MediaCardProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  onClick?: () => void;
  isEarlyAccess?: boolean;
  earlyAccessLabel?: string;
  placeholderIcon?: ReactNode;
}

export default function MediaCard({
  title,
  subtitle,
  imageUrl,
  onClick,
  isEarlyAccess,
  earlyAccessLabel = 'Early Access',
  placeholderIcon = <Music size={40} color="gray" />,
}: MediaCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        minWidth: 160,
        maxWidth: 160,
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: 'background.paper',
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          p: 1.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            bgcolor: 'divider',
            borderRadius: 1.5,
            mb: 1.5,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {imageUrl ? (
            <CardMedia
              component="img"
              image={imageUrl}
              alt={title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            placeholderIcon
          )}
          {isEarlyAccess && (
            <Chip
              label={earlyAccessLabel}
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: '#ffd700',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.65rem',
                border: 'none'
              }}
            />
          )}
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}