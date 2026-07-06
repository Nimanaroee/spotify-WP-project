import { ACCEPTED_AUDIO_EXTENSIONS } from '../../lib/constants/musicGenres'

export const MAX_AUDIO_FILE_BYTES = 10 * 1024 * 1024

export type AudioUploadErrorCode =
  | 'empty_file'
  | 'invalid_type'
  | 'file_too_large'
  | 'read_failed'
  | 'invalid_result'
  | 'aborted'

export function getAudioUploadErrorMessage(
  code: AudioUploadErrorCode,
  messages: {
    emptyFile: string
    invalidAudio: string
    fileTooLarge: string
    readFailed: string
    uploadFailed: string
  },
): string {
  switch (code) {
    case 'empty_file':
      return messages.emptyFile
    case 'invalid_type':
      return messages.invalidAudio
    case 'file_too_large':
      return messages.fileTooLarge
    case 'read_failed':
    case 'invalid_result':
    case 'aborted':
      return messages.readFailed
    default:
      return messages.uploadFailed
  }
}

export function validateAudioFile(file: File): AudioUploadErrorCode | null {
  if (file.size === 0) {
    return 'empty_file'
  }
  if (!isAcceptedAudioFile(file)) {
    return 'invalid_type'
  }
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return 'file_too_large'
  }
  return null
}

export function isAcceptedAudioFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export interface ReadFileProgress {
  loaded: number
  total: number
  percent: number
}

export interface ReadFileAsDataUrlOptions {
  onProgress?: (progress: ReadFileProgress) => void
  signal?: AbortSignal
}

export function readFileAsDataUrl(
  file: File,
  options: ReadFileAsDataUrlOptions = {},
): Promise<string> {
  const { onProgress, signal } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    function cleanup(): void {
      signal?.removeEventListener('abort', handleAbort)
    }

    function handleAbort(): void {
      reader.abort()
      cleanup()
      reject(new Error('aborted'))
    }

    if (signal?.aborted) {
      reject(new Error('aborted'))
      return
    }

    signal?.addEventListener('abort', handleAbort)

    reader.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return
      }
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent,
      })
    }

    reader.onload = () => {
      cleanup()
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('invalid_result'))
    }

    reader.onerror = () => {
      cleanup()
      reject(new Error('read_failed'))
    }

    reader.onabort = () => {
      cleanup()
      reject(new Error('aborted'))
    }

    reader.readAsDataURL(file)
  })
}

export async function uploadAudioFile(
  file: File,
  messages: {
    emptyFile: string
    invalidAudio: string
    fileTooLarge: string
    readFailed: string
    uploadFailed: string
  },
  onProgress?: (progress: ReadFileProgress) => void,
): Promise<string> {
  const validationError = validateAudioFile(file)
  if (validationError) {
    throw new Error(getAudioUploadErrorMessage(validationError, messages))
  }

  try {
    return await readFileAsDataUrl(file, { onProgress })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'aborted') {
        throw new Error(getAudioUploadErrorMessage('aborted', messages))
      }
      if (error.message === 'read_failed' || error.message === 'invalid_result') {
        throw new Error(getAudioUploadErrorMessage('read_failed', messages))
      }
    }
    throw new Error(messages.uploadFailed)
  }
}

export function parseCoArtists(value: string | undefined): string[] {
  if (!value?.trim()) {
    return []
  }
  return value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}
