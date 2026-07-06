import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getArtworkManagementPageText } from '../../lib/constants/artworkManagementPageText'
import { uploadAudioFile } from '../../lib/artwork/fileUpload'
import { useAppLanguage } from '../../theme/LanguageContext'

interface AudioUploadFieldProps {
  onUploaded: (dataUrl: string, fileName: string) => void
  onError?: (message: string) => void
  disabled?: boolean
  uploadedFileName?: string | null
  errorMessage?: string | null
}

export default function AudioUploadField({
  onUploaded,
  onError,
  disabled = false,
  uploadedFileName = null,
  errorMessage = null,
}: AudioUploadFieldProps) {
  const { language } = useAppLanguage()
  const copy = getArtworkManagementPageText(language)
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(uploadedFileName)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!isUploading) {
      setFileName(uploadedFileName)
    }
  }, [uploadedFileName, isUploading])

  const displayError = localError ?? errorMessage
  const uploadMessages = copy.upload

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setLocalError(null)
    setFileName(null)
    setProgress(0)
    setIsUploading(true)
    onError?.('')

    try {
      const dataUrl = await uploadAudioFile(
        file,
        uploadMessages.errors,
        (readProgress) => {
          setProgress(Math.min(99, readProgress.percent))
        },
      )
      setFileName(file.name)
      onUploaded(dataUrl, file.name)
      onError?.('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : uploadMessages.errors.uploadFailed
      setLocalError(message)
      onError?.(message)
    } finally {
      setProgress(null)
      setIsUploading(false)
    }
  }

  return (
    <Stack spacing={1}>
      <Button
        component="label"
        disabled={disabled || isUploading}
        variant="outlined"
      >
        {isUploading ? copy.form.uploading : copy.form.uploadAudio}
        <input
          ref={inputRef}
          hidden
          accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
          disabled={disabled || isUploading}
          type="file"
          onChange={(event) => void handleFileChange(event)}
        />
      </Button>

      <Typography color="text.secondary" variant="caption">
        {copy.form.audioHint}
      </Typography>

      {isUploading ? (
        <Box>
          <LinearProgress
            aria-label={copy.form.uploading}
            value={progress ?? 0}
            variant={progress === null ? 'indeterminate' : 'determinate'}
          />
          <Typography className="mt-1" color="text.secondary" variant="caption">
            {copy.form.uploading} {progress !== null ? `${progress}%` : ''}
          </Typography>
        </Box>
      ) : null}

      {fileName ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CheckCircle2 aria-hidden size={16} />
          <Typography color="success.main" variant="body2">
            {copy.form.uploadedFile(fileName)}
          </Typography>
        </Stack>
      ) : null}

      {displayError ? (
        <Alert severity="error" onClose={() => setLocalError(null)}>
          {displayError}
        </Alert>
      ) : null}
    </Stack>
  )
}
