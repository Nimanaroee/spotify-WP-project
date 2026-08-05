import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getArtworkManagementPageText } from '../../lib/constants/artworkManagementPageText'
import { validateAndReturnAudioFile } from '../../lib/artwork/fileUpload'
import { useAppLanguage } from '../../theme/LanguageContext'

interface AudioUploadFieldProps {
  onUploaded: (file: File, fileName: string) => void
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
  const [localError, setLocalError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(uploadedFileName)

  useEffect(() => {
    setFileName(uploadedFileName)
  }, [uploadedFileName])

  const displayError = localError ?? errorMessage
  const uploadMessages = copy.upload

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setLocalError(null)
    setFileName(null)
    onError?.('')

    try {
      const validFile = validateAndReturnAudioFile(file, uploadMessages.errors as any)
      setFileName(validFile.name)
      onUploaded(validFile, validFile.name)
    } catch (error) {
      const message = error instanceof Error ? error.message : uploadMessages.errors.uploadFailed
      setLocalError(message)
      onError?.(message)
    }
  }

  return (
    <Stack spacing={1}>
      <Button component="label" disabled={disabled} variant="outlined">
        {copy.form.uploadAudio}
        <input
          ref={inputRef}
          hidden
          accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
          disabled={disabled}
          type="file"
          onChange={handleFileChange}
        />
      </Button>

      <Typography color="text.secondary" variant="caption">
        {copy.form.audioHint}
      </Typography>

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