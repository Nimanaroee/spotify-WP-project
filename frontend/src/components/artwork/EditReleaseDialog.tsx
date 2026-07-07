import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getArtworkManagementPageText } from '../../lib/constants/artworkManagementPageText'
import { MUSIC_GENRES } from '../../lib/constants/musicGenres'
import AudioUploadField from './AudioUploadField'
import {
  parseCoArtists,
  uploadCoverFile,
} from '../../lib/artwork/fileUpload'
import { updateTrack } from '../../lib/mock/musicService'
import { resolveMediaUrl } from '../../lib/mock/mediaCache'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { Track } from '../../types/music'
import {
  editTrackSchema,
  type EditTrackFormValues,
} from './releaseForm.schema'

interface EditReleaseDialogProps {
  open: boolean
  track: Track | null
  artistId: number
  onClose: () => void
  onSaved: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

export default function EditReleaseDialog({
  open,
  track,
  artistId,
  onClose,
  onSaved,
  onError,
  onSuccess,
}: EditReleaseDialogProps) {
  const { language } = useAppLanguage()
  const copy = getArtworkManagementPageText(language)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditTrackFormValues>({
    resolver: zodResolver(editTrackSchema),
  })

  useEffect(() => {
    if (!track) {
      return
    }
    reset({
      title: track.title,
      genre: track.genre ?? '',
      release_year: track.release_year ?? new Date().getFullYear(),
      co_artists: track.co_artists?.join(', ') ?? '',
      lyrics: track.lyrics ?? '',
      cover_art: track.cover_art ?? '',
      audio_url: track.audio_url ?? '',
    })
    setCoverPreview(resolveMediaUrl(track.cover_art) ?? null)
    setUploadedAudioName(track.audio_url ? copy.form.existingAudioAttached : null)
  }, [track, reset, copy.form.existingAudioAttached])

  async function handleCoverUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const dataUrl = await uploadCoverFile(file, copy.upload.errors)
    setValue('cover_art', dataUrl)
    setCoverPreview(dataUrl)
  }

  function handleAudioUploaded(dataUrl: string, fileName: string): void {
    setValue('audio_url', dataUrl)
    setUploadedAudioName(fileName)
    onSuccess(copy.form.uploadedFile(fileName))
  }

  async function onSubmit(values: EditTrackFormValues): Promise<void> {
    if (!track) {
      return
    }
    onError('')
    try {
      await updateTrack(track.id, artistId, {
        title: values.title,
        genre: values.genre || undefined,
        release_year: values.release_year,
        co_artists: parseCoArtists(values.co_artists),
        lyrics: values.lyrics ?? null,
        cover_art: values.cover_art || undefined,
        audio_url: values.audio_url || undefined,
      })
      onSuccess(copy.messages.updated)
      onSaved()
      onClose()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to update track.')
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{copy.edit.title}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              label={copy.form.trackTitle}
              {...register('title')}
            />
            <TextField label={copy.form.genre} select {...register('genre')}>
              {MUSIC_GENRES.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              error={Boolean(errors.release_year)}
              helperText={errors.release_year?.message}
              label={copy.form.releaseYear}
              type="number"
              {...register('release_year')}
            />
            <TextField
              helperText={copy.form.coArtistsHint}
              label={copy.form.coArtists}
              {...register('co_artists')}
            />
            <TextField
              label={copy.form.lyrics}
              minRows={4}
              multiline
              {...register('lyrics')}
            />
            <Button component="label" variant="outlined">
              {copy.form.uploadCover}
              <input hidden accept="image/*" type="file" onChange={handleCoverUpload} />
            </Button>
          {coverPreview ? (
            <Box
              alt={copy.form.coverArt}
              component="img"
              src={coverPreview}
              sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1 }}
            />
          ) : null}
            <AudioUploadField
              uploadedFileName={uploadedAudioName}
              onError={onError}
              onUploaded={handleAudioUploaded}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{copy.edit.cancel}</Button>
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {copy.edit.save}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
