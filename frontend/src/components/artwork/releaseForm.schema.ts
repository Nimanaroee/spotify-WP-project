import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const releaseTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required.'),
  audio_file: z.any().refine(val => val, 'Audio file is required.'), // Changed to accept File
  lyrics: z.string().optional(),
  duration_seconds: z.number().optional(),
})

export const releaseFormSchema = z
  .object({
    release_type: z.enum(['single', 'album']),
    title: z.string().min(1, 'Release title is required.'),
    genre: z.string().optional(),
    release_year: z.coerce
      .number()
      .min(1900, 'Enter a valid year.')
      .max(currentYear, 'Release year cannot be in the future.'),
    co_artists: z.string().optional(),
    cover_art: z.any().optional(), // Changed to accept File
    tracks: z.array(releaseTrackSchema).min(1, 'At least one track is required.'),
  })
  .superRefine((values, ctx) => {
    if (values.release_type === 'single' && values.tracks.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A single must contain exactly one track.',
        path: ['tracks'],
      })
    }
    if (values.release_type === 'album' && values.tracks.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An album must contain at least two tracks.',
        path: ['tracks'],
      })
    }
  })

export const editTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required.'),
  genre: z.string().optional(),
  release_year: z.coerce
    .number()
    .min(1900, 'Enter a valid year.')
    .max(currentYear, 'Release year cannot be in the future.'),
  co_artists: z.string().optional(),
  lyrics: z.string().optional(),
  cover_art: z.any().optional(), // Changed to accept File
  audio_url: z.any().optional(), // Changed to accept File
})

export type ReleaseFormValues = z.infer<typeof releaseFormSchema>
export type EditTrackFormValues = z.infer<typeof editTrackSchema>