import { useCallback, useEffect, useState } from 'react'
import { getHealth } from '../api'
import type { HealthResponse } from '../api-types'

/**
 * Is the backend there, and is its knowledge base seeded?
 *
 * Three states on purpose: `checking` is not `down`, so the status dot does
 * not flash red for the moment before the first response lands.
 */
export type Health = 'checking' | 'up' | 'degraded' | 'down'

const PROBE_MS = 15000

export function useHealth() {
  const [health, setHealth] = useState<Health>('checking')
  const [info, setInfo] = useState<HealthResponse | null>(null)

  const probe = useCallback(async (): Promise<void> => {
    try {
      const body = await getHealth()
      setInfo(body)
      setHealth(body.kb_ready ? 'up' : 'degraded')
    } catch {
      setInfo(null)
      setHealth('down')
    }
  }, [])

  useEffect(() => {
    void probe()
    const id = window.setInterval(() => void probe(), PROBE_MS)
    return () => window.clearInterval(id)
  }, [probe])

  return { health, info, recheck: probe }
}
