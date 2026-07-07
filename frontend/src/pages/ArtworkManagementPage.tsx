import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import EditReleaseDialog from '../components/artwork/EditReleaseDialog'
import PageHeader from '../components/common/PageHeader'
import ReleaseForm from '../components/artwork/ReleaseForm'
import ReleaseList from '../components/artwork/ReleaseList'
import EmptyState from '../components/common/EmptyState'
import { getArtworkManagementPageText } from '../lib/constants/artworkManagementPageText'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { getProfileByUserId, isVerifiedArtist } from '../lib/mock/artistProfileService'
import { deleteTrack, listArtistReleases } from '../lib/mock/musicService'
import { useAuthStore } from '../store/authStore'
import { useAppLanguage } from '../theme/LanguageContext'
import type { Track } from '../types/music'

export default function ArtworkManagementPage() {
  const authUser = useAuthStore((state) => state.user)
  const { language } = useAppLanguage()
  const copy = getArtworkManagementPageText(language)
  const [tab, setTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null)

  const profile = authUser ? getProfileByUserId(authUser.id) : null
  const verified = authUser ? isVerifiedArtist(authUser.id) : false

  const releases = useMemo(() => {
    if (!authUser) {
      return []
    }
    return listArtistReleases(authUser.id)
  }, [authUser, refreshKey])

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (authUser.role !== ROLES.ARTIST) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  if (!verified) {
    return (
      <Box className="p-4 md:p-8" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>{copy.blocked.title}</Typography>
          {copy.blocked.message}
        </Alert>
      </Box>
    )
  }

  function refreshReleases(): void {
    setRefreshKey((current) => current + 1)
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deletingTrack || !authUser) {
      return
    }
    setError(null)
    try {
      await deleteTrack(deletingTrack.id, authUser.id)
      setMessage(copy.messages.deleted)
      setDeletingTrack(null)
      refreshReleases()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track.')
    }
  }

  return (
    <Box className="mx-auto max-w-5xl p-4 md:p-8" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <PageHeader>{copy.pageTitle}</PageHeader>
        {tab === 0 ? (
          <Button variant="contained" onClick={() => setTab(1)}>
            {copy.tabs.publish}
          </Button>
        ) : null}
      </Box>

      {message ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          allowScrollButtonsMobile
          scrollButtons="auto"
          value={tab}
          variant="scrollable"
          onChange={(_, value: number) => setTab(value)}
        >
          <Tab label={copy.tabs.releases} />
          <Tab label={copy.tabs.publish} />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        releases.length === 0 ? (
          <EmptyState title={copy.emptyState} />
        ) : (
          <ReleaseList
            artistId={authUser.id}
            releases={releases}
            onDelete={setDeletingTrack}
            onEdit={setEditingTrack}
          />
        )
      ) : (
        <ReleaseForm
          artistId={authUser.id}
          stageName={profile?.stage_name ?? authUser.display_name}
          onError={setError}
          onPublished={() => {
            refreshReleases()
            setTab(0)
          }}
          onSuccess={setMessage}
        />
      )}

      <EditReleaseDialog
        artistId={authUser.id}
        open={Boolean(editingTrack)}
        track={editingTrack}
        onClose={() => setEditingTrack(null)}
        onError={setError}
        onSaved={refreshReleases}
        onSuccess={setMessage}
      />

      <Dialog open={Boolean(deletingTrack)} onClose={() => setDeletingTrack(null)}>
        <DialogTitle>{copy.delete.title}</DialogTitle>
        <DialogContent>
          {deletingTrack ? copy.delete.message(deletingTrack.title) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTrack(null)}>{copy.delete.cancel}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            {copy.delete.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
