import { z } from 'zod'

// Language keys and catalogue identifiers can grow independently of the app.
export const localizedTextSchema = z.record(z.string(), z.string())

export const vehicleSchema = z.object({
  name: z.string(),
  level: z.number().int().positive(),
  nation: z.string(),
  tags: z.array(z.string()),
  icons: z.object({
    default: z.string(),
    small: z.string(),
    medium: z.string(),
    large: z.string(),
    contour: z.string(),
    contour_alive: z.string(),
    contour_dead: z.string(),
    local_small: z.string(),
    local_contour: z.string(),
    local_contour_alive: z.string(),
    local_contour_dead: z.string(),
  }),
  localization: z.object({
    mark: localizedTextSchema,
    shortmark: localizedTextSchema,
    description: localizedTextSchema,
  }),
})

export const nationSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  color: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  icons: z.object({
    default: z.string(),
    small: z.string(),
    large: z.string(),
    tiny: z.string(),
    local_small: z.string(),
    local_large: z.string(),
    local_tiny: z.string(),
  }),
  localization: z.object({ mark: localizedTextSchema }),
})

export const vehicleTypeSchema = z.object({
  sort_order: z.number().int(),
  icons: z.object({
    default: z.string(),
    normal: z.string(),
    elite: z.string(),
    premium: z.string(),
    special: z.string(),
  }),
  localization: z.object({
    mark: localizedTextSchema,
    // The live response currently contains empty shortmark dictionaries.
    shortmark: localizedTextSchema,
  }),
})

export const vehiclesSchema = z.record(z.string(), vehicleSchema)
export const nationsSchema = z.array(nationSchema)
export const vehicleTypesSchema = z.record(z.string(), vehicleTypeSchema)
export const mediaPathSchema = z.url({ protocol: /^https?$/ })

export function responseSchema<T extends z.ZodType>(data: T) {
  return z.object({ status: z.literal('ok'), data })
}

export const vehiclesResponseSchema = responseSchema(vehiclesSchema)
export const nationsResponseSchema = responseSchema(nationsSchema)
export const vehicleTypesResponseSchema = responseSchema(vehicleTypesSchema)
export const mediaPathResponseSchema = responseSchema(mediaPathSchema)

export type Vehicle = z.infer<typeof vehicleSchema>
export type Vehicles = z.infer<typeof vehiclesSchema>
export type Nation = z.infer<typeof nationSchema>
export type Nations = z.infer<typeof nationsSchema>
export type VehicleType = z.infer<typeof vehicleTypeSchema>
export type VehicleTypes = z.infer<typeof vehicleTypesSchema>
export type MediaPath = z.infer<typeof mediaPathSchema>
