export interface Compound {
  compound_id: string
  smiles: string
  canonical_smiles?: string
  inchi?: string
  inchi_key?: string
  cas_number?: string
  iupac_name?: string
  common_name?: string
  molecular_formula?: string
  molecular_weight?: number
  exact_mass?: number
  logp?: number
  created_at?: string
}

export interface Reaction {
  reaction_id: string
  reaction_name?: string
  reaction_class?: string[]
  yield_percent?: number
  temperature_celsius?: number
  pressure_atm?: number
  time_hours?: number
  difficulty?: string
  created_at?: string
}

export interface Literature {
  reference_id: string
  title: string
  authors?: string[]
  year?: number
  journal_name?: string
  doi?: string
  abstract?: string
  document_type?: string
  created_at?: string
}

export interface Stats {
  compounds: number
  reactions: number
  literature: number
  techniques: number
  equipment: number
  sops: number
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  databases: {
    postgresql: boolean
    mongodb: boolean
    neo4j: boolean
    qdrant: boolean
    redis: boolean
  }
}
