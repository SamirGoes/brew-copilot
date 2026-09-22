import axios from 'axios'
import type {
  BrewSession,
  CarbonationRequest,
  CarbonationResponse,
  GravityRequest,
  GravityResponse,
  HopsRequest,
  HopsResponse,
  MashRequest,
  MashResponse,
  ReadingCreate,
  Reading,
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  SessionCreate,
  SessionUpdate,
  StyleDetail,
  StyleSummary,
  ValidateRequest,
  ValidateResponse,
  WaterProfileRow,
  WaterRequest,
  WaterResponse,
} from '../types'

// Em dev o Vite faz proxy de /api para o backend; em produção o nginx faz o mesmo.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

/** Extrai uma mensagem legível de um erro do axios/FastAPI. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length) {
      return detail.map((d: { msg?: string }) => d.msg ?? String(d)).join('; ')
    }
    return err.message
  }
  return err instanceof Error ? err.message : String(err)
}

const data = <T>(p: Promise<{ data: T }>): Promise<T> => p.then((r) => r.data)

export const calculate = {
  mash: (req: MashRequest) => data(http.post<MashResponse>('/calculate/mash', req)),
  gravity: (req: GravityRequest) => data(http.post<GravityResponse>('/calculate/gravity', req)),
  hops: (req: HopsRequest) => data(http.post<HopsResponse>('/calculate/hops', req)),
  water: (req: WaterRequest) => data(http.post<WaterResponse>('/calculate/water', req)),
  waterProfiles: () => data(http.get<WaterProfileRow[]>('/calculate/water/profiles')),
  carbonation: (req: CarbonationRequest) =>
    data(http.post<CarbonationResponse>('/calculate/carbonation', req)),
}

export const styles = {
  list: (q = '') => data(http.get<StyleSummary[]>('/styles', { params: q ? { q } : {} })),
  get: (id: string) => data(http.get<StyleDetail>(`/styles/${encodeURIComponent(id)}`)),
  validate: (req: ValidateRequest) => data(http.post<ValidateResponse>('/validate/style', req)),
}

export const recipes = {
  list: () => data(http.get<Recipe[]>('/recipes')),
  get: (id: number) => data(http.get<Recipe>(`/recipes/${id}`)),
  create: (req: RecipeCreate) => data(http.post<Recipe>('/recipes', req)),
  update: (id: number, req: RecipeUpdate) => data(http.put<Recipe>(`/recipes/${id}`, req)),
  remove: (id: number) => http.delete(`/recipes/${id}`).then(() => undefined),
}

export const sessions = {
  list: () => data(http.get<BrewSession[]>('/sessions')),
  get: (id: number) => data(http.get<BrewSession>(`/sessions/${id}`)),
  create: (req: SessionCreate) => data(http.post<BrewSession>('/sessions', req)),
  update: (id: number, req: SessionUpdate) => data(http.patch<BrewSession>(`/sessions/${id}`, req)),
  remove: (id: number) => http.delete(`/sessions/${id}`).then(() => undefined),
  advancePhase: (id: number) => data(http.post<BrewSession>(`/sessions/${id}/phase`)),
  addReading: (id: number, req: ReadingCreate) =>
    data(http.post<Reading>(`/sessions/${id}/reading`, req)),
  /** Baixa a sessão completa (receita + leituras) como arquivo .json. */
  async download(id: number) {
    const res = await http.get(`/sessions/${id}/export`, { responseType: 'blob' })
    const match = /filename="(.+)"/.exec(res.headers['content-disposition'] ?? '')
    const url = URL.createObjectURL(res.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = match?.[1] ?? `brassagem-${id}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

export const health = () => data(http.get<{ status: string }>('/health'))
