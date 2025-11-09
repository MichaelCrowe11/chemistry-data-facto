import { Compound, Reaction, Literature, Stats, HealthStatus } from '@/types/chemistry'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const chemistryApi = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`)
    if (!res.ok) throw new Error('Failed to fetch health status')
    return res.json()
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_BASE_URL}/stats`)
    if (!res.ok) throw new Error('Failed to fetch statistics')
    return res.json()
  },

  async searchCompounds(params: {
    query?: string
    formula?: string
    min_weight?: number
    max_weight?: number
    limit?: number
  }): Promise<Compound[]> {
    const queryParams = new URLSearchParams()
    if (params.query) queryParams.append('query', params.query)
    if (params.formula) queryParams.append('formula', params.formula)
    if (params.min_weight) queryParams.append('min_weight', params.min_weight.toString())
    if (params.max_weight) queryParams.append('max_weight', params.max_weight.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const res = await fetch(`${API_BASE_URL}/compounds?${queryParams}`)
    if (!res.ok) throw new Error('Failed to search compounds')
    return res.json()
  },

  async getCompound(id: string): Promise<Compound> {
    const res = await fetch(`${API_BASE_URL}/compounds/${id}`)
    if (!res.ok) throw new Error('Failed to fetch compound')
    return res.json()
  },

  async searchReactions(params: {
    min_yield?: number
    reaction_class?: string
    limit?: number
  }): Promise<Reaction[]> {
    const queryParams = new URLSearchParams()
    if (params.min_yield) queryParams.append('min_yield', params.min_yield.toString())
    if (params.reaction_class) queryParams.append('reaction_class', params.reaction_class)
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const res = await fetch(`${API_BASE_URL}/reactions?${queryParams}`)
    if (!res.ok) throw new Error('Failed to search reactions')
    return res.json()
  },

  async searchLiterature(params: {
    query?: string
    year?: number
    limit?: number
  }): Promise<Literature[]> {
    const queryParams = new URLSearchParams()
    if (params.query) queryParams.append('query', params.query)
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const res = await fetch(`${API_BASE_URL}/literature?${queryParams}`)
    if (!res.ok) throw new Error('Failed to search literature')
    return res.json()
  }
}
