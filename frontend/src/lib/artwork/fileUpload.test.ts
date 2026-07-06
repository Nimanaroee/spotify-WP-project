import { describe, expect, it, vi } from 'vitest'
import {
  MAX_AUDIO_FILE_BYTES,
  uploadAudioFile,
  validateAudioFile,
} from './fileUpload'

const messages = {
  emptyFile: 'Empty file.',
  invalidAudio: 'Invalid type.',
  fileTooLarge: 'Too large.',
  readFailed: 'Read failed.',
  uploadFailed: 'Upload failed.',
}

describe('fileUpload', () => {
  it('rejects empty audio files', () => {
    const file = new File([], 'track.mp3', { type: 'audio/mpeg' })
    expect(validateAudioFile(file)).toBe('empty_file')
  })

  it('rejects unsupported extensions', () => {
    const file = new File(['audio'], 'track.txt', { type: 'text/plain' })
    expect(validateAudioFile(file)).toBe('invalid_type')
  })

  it('rejects files larger than the mock limit', () => {
    const file = new File([new Uint8Array(MAX_AUDIO_FILE_BYTES + 1)], 'big.mp3', {
      type: 'audio/mpeg',
    })
    expect(validateAudioFile(file)).toBe('file_too_large')
  })

  it('uploads valid audio and reports progress', async () => {
    const file = new File(['audio-bytes'], 'night-drive.mp3', { type: 'audio/mpeg' })
    const progressValues: number[] = []

    const dataUrl = await uploadAudioFile(file, messages, (progress) => {
      progressValues.push(progress.percent)
    })

    expect(dataUrl.startsWith('data:')).toBe(true)
    expect(progressValues.length).toBeGreaterThan(0)
  })

  it('surfaces read failures', async () => {
    const file = new File(['audio'], 'broken.mp3', { type: 'audio/mpeg' })
    const readSpy = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (
      this: FileReader,
    ) {
      if (this.onerror) {
        this.onerror(new ProgressEvent('error') as ProgressEvent<FileReader>)
      }
    })

    await expect(uploadAudioFile(file, messages)).rejects.toThrow('Read failed.')
    readSpy.mockRestore()
  })
})
