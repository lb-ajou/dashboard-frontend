import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Config, Route, UpstreamPool } from '@/lib/types'

// Bun only inlines literal process.env references that are present at build time.
// Guard access so the browser still works when the public env is unset.
const API_BASE_URL =
  typeof process !== "undefined" && process.env.BUN_PUBLIC_API_BASE_URL
    ? process.env.BUN_PUBLIC_API_BASE_URL
    : "/api"

// Fetch full config
async function fetchConfig(): Promise<Config> {
  const response = await fetch(`${API_BASE_URL}/config`)
  if (!response.ok) {
    throw new Error('Failed to fetch config')
  }
  return response.json()
}

// Fetch routes
async function fetchRoutes(): Promise<Route[]> {
  const response = await fetch(`${API_BASE_URL}/routes`)
  if (!response.ok) {
    throw new Error('Failed to fetch routes')
  }
  return response.json()
}

// Create route
async function createRoute(route: Route): Promise<Route> {
  const response = await fetch(`${API_BASE_URL}/routes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(route),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create route')
  }
  return response.json()
}

// Update route
async function updateRoute(id: string, route: Route): Promise<Route> {
  const response = await fetch(`${API_BASE_URL}/routes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(route),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update route')
  }
  return response.json()
}

// Delete route
async function deleteRoute(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/routes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete route')
  }
}

// Fetch upstream pools
async function fetchUpstreamPools(): Promise<Record<string, UpstreamPool>> {
  const response = await fetch(`${API_BASE_URL}/upstream-pools`)
  if (!response.ok) {
    throw new Error('Failed to fetch upstream pools')
  }
  return response.json()
}

// Create upstream pool
async function createUpstreamPool(id: string, pool: UpstreamPool): Promise<{ id: string; pool: UpstreamPool }> {
  const response = await fetch(`${API_BASE_URL}/upstream-pools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...pool }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create upstream pool')
  }
  return response.json()
}

// Update upstream pool
async function updateUpstreamPool(id: string, pool: UpstreamPool): Promise<UpstreamPool> {
  const response = await fetch(`${API_BASE_URL}/upstream-pools/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pool),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update upstream pool')
  }
  return response.json()
}

// Delete upstream pool
async function deleteUpstreamPool(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/upstream-pools/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete upstream pool')
  }
}

// Query keys
const queryKeys = {
  config: ['config'] as const,
  routes: ['routes'] as const,
  upstreamPools: ['upstreamPools'] as const,
}

// Hooks
export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: fetchConfig,
  })
}

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: fetchRoutes,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, route }: { id: string; route: Route }) => updateRoute(id, route),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useUpstreamPools() {
  return useQuery({
    queryKey: queryKeys.upstreamPools,
    queryFn: fetchUpstreamPools,
  })
}

export function useCreateUpstreamPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pool }: { id: string; pool: UpstreamPool }) => createUpstreamPool(id, pool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useUpdateUpstreamPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pool }: { id: string; pool: UpstreamPool }) => updateUpstreamPool(id, pool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useDeleteUpstreamPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUpstreamPool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}
