/**
 * Types of the backend's JSON API.
 *
 * Mirrors `app/schemas.py` in the backend repository field for field. The two
 * repositories share no code, so this file is the contract: when a backend
 * schema changes, change it here too. It can also be regenerated from a
 * running server:
 *
 *     npx openapi-typescript http://localhost:8000/openapi.json -o src/openapi.d.ts
 */

export type ChipId = 'esp32' | 'esp32-s3' | 'esp32-c3' | 'esp32-c6' | 'esp32-s2'
export type ChipTag = ChipId | 'common' | 'noise'
export type AssistRole = 'direct' | 'indirect'
export type DocKind = 'direct' | 'indirect' | 'noise'
export type GroundingStatus = 'grounded' | 'uncited' | 'not_covered' | 'withheld'

export interface PipelineOptions {
  chip_filter: boolean
  attention_sort: boolean
  summarization: boolean
  u_shape_order: boolean
  noise_shuffle: boolean
}

export interface QueryRequest {
  question: string
  selected_chip: ChipId
  noise_ratio?: number
  top_k?: number | null
  seed?: number | null
  options?: Partial<PipelineOptions>
}

export interface ChunkTrace {
  source_id: string
  chunk_id: string
  title: string
  chip: ChipTag
  section: string
  source_type: string
  url: string
  text: string
  retrieval_rank: number | null
  similarity: number | null
  is_noise: boolean
  noise_origin: 'environment' | 'rearrange' | null
  attention_score: number | null
  demoted: boolean
}

export interface AttentionScore {
  source_id: string
  chunk_id: string
  title: string
  raw_score: number
  normalized_score: number
  per_layer: number[]
  token_span: [number, number]
  n_tokens: number
  cluster: AssistRole
  is_noise: boolean
}

export interface ClassifierInfo {
  method: 'attention-kmeans' | 'retrieval-rank'
  model: string
  device: string
  layers_used: number[]
  question_span: [number, number] | null
  total_tokens: number
  direct_centroid: number | null
  indirect_centroid: number | null
}

export type EntityType = 'pin' | 'register' | 'electrical' | 'api' | 'config' | 'peripheral' | 'other'

export interface Entity {
  text: string
  type: EntityType
}

export interface Relation {
  subject: string
  predicate: string
  object: string
}

export interface DirectSummary {
  source_id: string
  chunk_id: string
  title: string
  entities: Entity[]
  relations: Relation[]
  summary: string
  /** Sentences copied verbatim from the chunk, sent with an LLM summary. */
  evidence: string
  method: 'llm' | 'extractive' | 'raw'
  relevant: boolean
}

export interface PromptItem {
  source_id: string
  kind: DocKind
  title: string
  text: string
}

export type SegmentPosition = 'system' | 'head' | 'middle' | 'tail' | 'flat' | 'question'

export interface PromptSegment {
  position: SegmentPosition
  label: string
  text: string
  items: PromptItem[]
  approx_tokens: number
}

export interface Citation {
  source_id: string
  /** "[Doc Title | Chip | Section]" */
  label: string
  title: string
  chip: ChipTag
  section: string
  source_type: string
  url: string
  role: DocKind
  cited: boolean
  excerpt: string
}

export interface ModelInfo {
  llm_provider: string
  llm_model: string
  classifier_model: string
  embedding_model: string
  device: string
}

export interface QueryResponse {
  answer: string
  /** Longer plain-language explanation; empty when the model gave none. */
  explanation: string
  reasoning: string
  grounding_status: GroundingStatus
  grounding_note: string
  selected_chip: ChipId
  question: string
  noise_ratio: number
  top_k: number
  options: PipelineOptions

  retrieved_chunks: ChunkTrace[]
  direct_chunks: ChunkTrace[]
  indirect_chunks: ChunkTrace[]
  noise_chunks: ChunkTrace[]

  attention_scores: AttentionScore[]
  classifier: ClassifierInfo
  summaries: DirectSummary[]
  prompt_layout: PromptSegment[]
  final_prompt: string
  citations: Citation[]

  timings_ms: Record<string, number>
  models: ModelInfo
}

export interface ChipInfo {
  id: ChipId
  label: string
  architecture: string
  cores: string
  max_frequency_mhz: number
  wifi: string
  bluetooth: string
  usb: string
  extra_radio: string | null
  gpio_count: number
  sample_questions: string[]
  kb_chunks: number
}

export interface ChipsResponse {
  chips: ChipInfo[]
  common_chunks: number
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  kb_ready: boolean
  kb_chunks: number
  chunks_by_chip: Record<string, number>
  llm_provider: string
  llm_model: string
  classifier_model: string
  classifier_loaded: boolean
  embedding_model: string
  device: string
  version: string
  detail: string
}
