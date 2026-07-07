import { Box, Typography, type TypographyProps } from '@mui/material'

interface PageHeaderProps extends Omit<TypographyProps, 'variant'> {
  children: React.ReactNode
  subtitle?: React.ReactNode
}

export default function PageHeader({
  children,
  subtitle,
  className,
  sx,
  ...props
}: PageHeaderProps) {
  return (
    <Box className={className}>
      <Typography
        component="h1"
        variant="h4"
        sx={{
          fontWeight: 700,
          typography: { xs: 'h5', md: 'h4' },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  )
}
