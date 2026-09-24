import { z } from 'zod'
import {
  mediaPathResponseSchema,
  nationsResponseSchema,
  vehiclesResponseSchema,
  vehicleTypesResponseSchema,
} from './schemas'

// Vite proxies this path locally; production must provide the same proxy or
// configure a CORS-enabled backend with VITE_ENCYCLOPEDIA_BASE_URL.
export const encyclopediaBaseUrl = (
  import.meta.env.VITE_ENCYCLOPEDIA_BASE_URL || '/api/encyclopedia/en/'
).replace(/\/?$/, '/')

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`Encyclopedia request failed with HTTP ${status}: ${url}`)
    this.name = 'HttpError'
  }
}

export class EncyclopediaApiError extends Error {
  constructor(
    public readonly url: string,
    public readonly details: unknown,
  ) {
    super(`Encyclopedia API returned an error: ${url}`)
    this.name = 'EncyclopediaApiError'
  }
}

const errorResponseSchema = z.object({
  status: z.literal('error'),
  error: z.unknown().optional(),
})

async function request<T>(
  endpoint: string,
  schema: z.ZodType<{ status: 'ok'; data: T }>,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${encyclopediaBaseUrl}${endpoint}/`
  const response = await fetch(url, { signal })

  if (!response.ok) throw new HttpError(response.status, url)

  const body: unknown = await response.json()
  const apiError = errorResponseSchema.safeParse(body)
  if (apiError.success) {
    throw new EncyclopediaApiError(url, apiError.data.error)
  }

  // Invalid successful responses throw ZodError, including the failing paths.
  return schema.parse(body).data
}

export const encyclopediaClient = {
  getVehicles: (signal?: AbortSignal) =>
    request('vehicles', vehiclesResponseSchema, signal),
  getNations: (signal?: AbortSignal) =>
    request('nations', nationsResponseSchema, signal),
  getVehicleTypes: (signal?: AbortSignal) =>
    request('vehicle_types_common', vehicleTypesResponseSchema, signal),
  getMediaPath: (signal?: AbortSignal) =>
    request('media_path', mediaPathResponseSchema, signal),
}
