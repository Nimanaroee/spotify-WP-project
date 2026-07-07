import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getArtworkManagementPageText } from '../../lib/constants/artworkManagementPageText'
import { MUSIC_GENRES } from '../../lib/constants/musicGenres'
import AudioUploadField from './AudioUploadField'
import {
  parseCoArtists,
  readFileAsDataUrl,
} from '../../lib/artwork/fileUpload'
import { publishRelease } from '../../lib/mock/musicService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { PublishReleasePayload } from '../../types/music'
import {
  releaseFormSchema,
  type ReleaseFormValues,
} from './releaseForm.schema'

interface ReleaseFormProps {
  artistId: number
  stageName: string
  onPublished: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

const defaultValues: ReleaseFormValues = {
  release_type: 'single',
  title: '',
  genre: '',
  release_year: new Date().getFullYear(),
  co_artists: '',
  cover_art: '',
  tracks: [{ title: '', audio_file: '', lyrics: '' }],
}

export default function ReleaseForm({
  artistId,
  stageName,
  onPublished,
  onError,
  onSuccess,
}: ReleaseFormProps) {
  const { language } = useAppLanguage()
  const copy = getArtworkManagementPageText(language)
  const isMobile = useIsMobile()
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadedAudioNames, setUploadedAudioNames] = useState<Record<number, string>>({})

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'tracks' })
  const releaseType = watch('release_type')

  async function handleCoverUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setValue('cover_art', dataUrl)
    setCoverPreview(dataUrl)
    onSuccess(copy.messages.coverReady)
  }

  function handleAudioUploaded(index: number, dataUrl: string, fileName: string): void {
    setValue(`tracks.${index}.audio_file`, dataUrl, { shouldValidate: true })
    setUploadedAudioNames((current) => ({ ...current, [index]: fileName }))
    onSuccess(copy.form.uploadedFile(fileName))
  }

  function onSubmit(values: ReleaseFormValues): void {
    onError('')
    try {
      const payload: PublishReleasePayload = {
        release_type: values.release_type,
        title: values.title,
        genre: values.genre || undefined,
        release_year: values.release_year,
        co_artists: parseCoArtists(values.co_artists),
        cover_art: values.cover_art || undefined,
        tracks: values.tracks.map((track) => ({
          title: track.title,
          audio_file: track.audio_file,
          lyrics: track.lyrics,
          duration_seconds: track.duration_seconds,
        })),
      }
      publishRelease(artistId, stageName, payload)
      onSuccess(copy.messages.published)
      onPublished()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to publish release.')
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <FormControl>
          <FormLabel>{copy.form.releaseType}</FormLabel>
          <RadioGroup
            row={!isMobile}
            sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 1 } }}
            defaultValue="single"
          >
            <FormControlLabel
              value="single"
              control={<Radio {...register('release_type')} />}
              label={copy.form.single}
            />
            <FormControlLabel
              value="album"
              control={<Radio {...register('release_type')} />}
              label={copy.form.album}
            />
          </RadioGroup>
        </FormControl>

        <TextField
          error={Boolean(errors.title)}
          helperText={errors.title?.message}
          label={copy.form.title}
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

        <Stack spacing={1}>
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
        </Stack>

        {fields.map((field, index) => (
          <Stack
            key={field.id}
            spacing={1.5}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}
          >
            <Typography variant="subtitle2">
              {copy.form.trackTitle} {index + 1}
            </Typography>
            <TextField
              error={Boolean(errors.tracks?.[index]?.title)}
              helperText={errors.tracks?.[index]?.title?.message}
              label={copy.form.trackTitle}
              {...register(`tracks.${index}.title`)}
            />
            <AudioUploadField
              errorMessage={errors.tracks?.[index]?.audio_file?.message ?? null}
              uploadedFileName={uploadedAudioNames[index] ?? null}
              onError={onError}
              onUploaded={(dataUrl, fileName) => handleAudioUploaded(index, dataUrl, fileName)}
            />
            <TextField
              label={copy.form.lyrics}
              minRows={3}
              multiline
              {...register(`tracks.${index}.lyrics`)}
            />
            {releaseType === 'album' && fields.length > 2 ? (
              <Button color="error" onClick={() => remove(index)}>
                {copy.form.removeTrack}
              </Button>
            ) : null}
          </Stack>
        ))}

        {errors.tracks?.message ? (
          <Typography color="error" variant="body2">
            {errors.tracks.message}
          </Typography>
        ) : null}

        {releaseType === 'album' ? (
          <Button
            onClick={() => append({ title: '', audio_file: '', lyrics: '' })}
            variant="outlined"
          >
            {copy.form.addTrack}
          </Button>
        ) : null}

        <Button disabled={isSubmitting} sx={{ width: { xs: '100%', sm: 'auto' } }} type="submit" variant="contained">
          {copy.form.publish}
        </Button>
      </Stack>
    </Box>
  )
}
