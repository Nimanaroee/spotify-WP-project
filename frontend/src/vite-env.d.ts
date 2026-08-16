/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAX_AUDIO_FILE_SIZE_MB?: string
  readonly VITE_MAX_COVER_FILE_SIZE_MB?: string
  readonly VITE_ACCEPTED_IMAGE_EXTENSIONS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
