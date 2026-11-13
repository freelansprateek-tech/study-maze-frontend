/**
 * The only place that talks to the backend.
 *
 * The backend lives in a separate repository and is reached over HTTP only.
 * Its address comes from VITE_API_BASE_URL (see .env.example); nothing here
 * imports backend code.
 */
import type { ChipsResponse, HealthResponse, QueryRequest, QueryResponse } from './api-types'

const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

/** The one base URL, without a trailing slash. */
export const API_BASE = (configured || 'http://localhost:8000').replace(/\/+$/, '')

/**
 * An API failure carrying enough detail to act on.
 *
 * `offline` distinguishes "the browser could not reach the server at all"
 * (backend not running, or this origin is not in its FRONTEND_ORIGIN list)
 * from "the server answered with an error".
 */
export class ApiError extends Error {
  status: number
  offline: boolean
  constructor(message: string, status: number, offline = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.offline = offline
  }
}

/** FastAPI reports errors as {detail: string} or, for validation failures,
 *  {detail: [{loc, msg, type}]}. Flatten both into one readable sentence. */
function readDetail(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) return fallback
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (typeof d !== 'object' || d === null) return null
        const e = d as { loc?: unknown[]; msg?: string }
        const field = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : ''
        return field ? `${field}: ${e.msg ?? ''}`.trim() : (e.msg ?? null)
      })
      .filter(Boolean)
    if (parts.length) return parts.join('; ')
  }
  return fallback
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. Check that the backend is running and that this page's origin (${window.location.origin}) is listed in the backend's FRONTEND_ORIGIN.`,
      0,
      true,
    )
  }

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      /* an error body that is not JSON; fall through to the status text */
    }
    throw new ApiError(readDetail(body, `${response.status} ${response.statusText}`), response.status)
  }
  return (await response.json()) as T
}

export const getHealth = (signal?: AbortSignal) => request<HealthResponse>('/api/health', { signal })

export const getChips = (signal?: AbortSignal) => request<ChipsResponse>('/api/chips', { signal })

/** Runs the full CP-RAG pipeline. With a local model this can take a minute
 *  or more, and the first call also loads the model, so there is no timeout. */
export const postQuery = (body: QueryRequest, signal?: AbortSignal) =>
  request<QueryResponse>('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

/** Mirrors QueryRequest.question in the backend (min_length=3, max_length=1000). */
export const QUESTION_MIN_LENGTH = 3
export const QUESTION_MAX_LENGTH = 1000
