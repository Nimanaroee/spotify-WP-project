import {
  Paper,
  Table,
  TableContainer,
  type PaperProps,
  type SxProps,
  type Theme,
} from '@mui/material'
import type { ReactNode } from 'react'

interface ScrollableTableContainerProps {
  children: ReactNode
  minWidth?: number | { xs: number; md: number | string }
  paperProps?: PaperProps
  sx?: SxProps<Theme>
}

export default function ScrollableTableContainer({
  children,
  minWidth = { xs: 560, md: 'auto' },
  paperProps,
  sx,
}: ScrollableTableContainerProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...sx,
      }}
      {...paperProps}
    >
      <Table size="small" sx={{ minWidth }}>
        {children}
      </Table>
    </TableContainer>
  )
}
