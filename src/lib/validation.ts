import { z } from 'zod'

// Duration regex for Go-style duration strings (e.g., "30s", "1m", "500ms")
const durationRegex = /^\d+(ms|s|m|h)$/

// Host:port regex for upstream addresses
const hostPortRegex = /^(\[([0-9a-fA-F:]+)\]|([^:[\]]+)):(\d+)$/

// Form validation schemas
export const routeFormSchema = z.object({
  id: z.string().min(1, 'Route ID is required'),
  enabled: z.boolean(),
  hosts: z.array(z.string().min(1, 'Host cannot be empty'))
    .min(1, 'At least one host is required'),
  pathType: z.string().optional(), // Can be 'exact', 'prefix', 'regex', or empty
  pathValue: z.string().optional(),
  upstream_pool: z.string().min(1, 'Upstream pool is required')
}).refine((data) => {
  // If pathType is set (not empty), pathValue must also be set
  if (data.pathType && data.pathType !== '') {
    return data.pathValue && data.pathValue.length > 0
  }
  return true
}, {
  message: 'Path value is required when path type is selected',
  path: ['pathValue']
}).refine((data) => {
  // Validate path format based on type
  if (data.pathType && data.pathType !== '' && data.pathValue) {
    if (!data.pathValue.startsWith('/')) {
      return false
    }
    if (data.pathType === 'prefix' && data.pathValue !== '/' && !data.pathValue.endsWith('/')) {
      return false
    }
  }
  return true
}, {
  message: 'Invalid path format for the selected type',
  path: ['pathValue']
})

export const upstreamPoolFormSchema = z.object({
  id: z.string().min(1, 'Pool ID is required'),
  upstreams: z.array(
    z.string()
      .min(1, 'Upstream address cannot be empty')
      .regex(hostPortRegex, 'Must be in host:port or [ipv6]:port format')
  ).min(1, 'At least one upstream is required'),
  health_check_enabled: z.boolean(),
  health_check_path: z.string().optional(),
  health_check_interval: z.string().optional(),
  health_check_timeout: z.string().optional(),
  health_check_expect_status: z.number().optional()
}).refine((data) => {
  // If health check is enabled, validate all health check fields
  if (data.health_check_enabled) {
    if (!data.health_check_path || !data.health_check_path.startsWith('/')) {
      return false
    }
    if (!data.health_check_interval || !durationRegex.test(data.health_check_interval)) {
      return false
    }
    if (!data.health_check_timeout || !durationRegex.test(data.health_check_timeout)) {
      return false
    }
    if (!data.health_check_expect_status || data.health_check_expect_status < 100 || data.health_check_expect_status > 599) {
      return false
    }
  }
  return true
}, {
  message: 'Invalid health check configuration',
  path: ['health_check_path']
})

export type RouteFormValues = z.infer<typeof routeFormSchema>
export type UpstreamPoolFormValues = z.infer<typeof upstreamPoolFormSchema>
