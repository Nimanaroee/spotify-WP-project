import { ACCEPTED_AUDIO_EXTENSIONS } from '../../lib/constants/musicGenres'

export const MAX_AUDIO_FILE_BYTES = 10 * 1024 * 1024
export const MAX_COVER_FILE_BYTES = 5 * 1024 * 1024

const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

export type AudioUploadErrorCode =
  | 'empty_file'
  | 'invalid_type'
  | 'file_too_large'

export type CoverUploadErrorCode = AudioUploadErrorCode

export function getAudioUploadErrorMessage(
  code: AudioUploadErrorCode,
  messages: {
    emptyFile: string
    invalidAudio: string
    fileTooLarge: string
  },
): string {
  switch (code) {
    case 'empty_file': return messages.emptyFile
    case 'invalid_type': return messages.invalidAudio
    case 'file_too_large': return messages.fileTooLarge
  }
}

export function getCoverUploadErrorMessage(
  code: CoverUploadErrorCode,
  messages: {
    emptyFile: string
    invalidImage: string
    fileTooLarge: string
  },
): string {
  switch (code) {
    case 'empty_file': return messages.emptyFile
    case 'invalid_type': return messages.invalidImage
    case 'file_too_large': return messages.fileTooLarge
  }
}

export function validateAudioFile(file: File): AudioUploadErrorCode | null {
  if (file.size === 0) return 'empty_file'
  if (!isAcceptedAudioFile(file)) return 'invalid_type'
  if (file.size > MAX_AUDIO_FILE_BYTES) return 'file_too_large'
  return null
}

export function isAcceptedAudioFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export function isAcceptedCoverFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export function validateCoverFile(file: File): CoverUploadErrorCode | null {
  if (file.size === 0) return 'empty_file'
  if (!isAcceptedCoverFile(file)) return 'invalid_type'
  if (file.size > MAX_COVER_FILE_BYTES) return 'file_too_large'
  return null
}

export function validateAndReturnAudioFile(
  file: File,
  messages: {
    emptyFile: string
    invalidAudio: string
    fileTooLarge: string
  }
): File {
  const validationError = validateAudioFile(file)
  if (validationError) {
    throw new Error(getAudioUploadErrorMessage(validationError, messages))
  }
  return file;
}

export function validateAndReturnCoverFile(
  file: File,
  messages: {
    emptyFile: string
    invalidImage: string
    fileTooLarge: string
  },
): File {
  const validationError = validateCoverFile(file)
  if (validationError) {
    throw new Error(getCoverUploadErrorMessage(validationError, messages))
  }
  return file;
}

export function parseCoArtists(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

export function readAudioDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    const objectUrl = URL.createObjectURL(file)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(0)
    }
    audio.src = objectUrl
  })
}