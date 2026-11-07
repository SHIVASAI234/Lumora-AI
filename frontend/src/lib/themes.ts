import type { NodeType, Status } from '@shared/graph.ts'

export type ThemeId = 'nebula' | 'aurora' | 'solar'

export interface Theme {
  id: ThemeId
  label: string
  background: string
  fog: string
  gradient: string
  edgeFrom: string
  edgeTo: string
  accent: string
  bloom: number
}

export const THEMES: Record<ThemeId, Theme> = {
  nebula: {
    id: 'nebula',
    label: 'Nebula',
    background: '#05060f',
    fog: '#0b0820',
    gradient: 'radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0b0820 45%, #05060f 100%)',
    edgeFrom: '#8b5cf6',
    edgeTo: '#22d3ee',
    accent: '#8b5cf6',
    bloom: 1.4,
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    background: '#03100f',
    fog: '#04201d',
    gradient: 'radial-gradient(ellipse at 50% 40%, #0a3b38 0%, #04201d 45%, #03100f 100%)',
    edgeFrom: '#2dd4bf',
    edgeTo: '#a3e635',
    accent: '#22d3ee',
    bloom: 1.2,
  },
  solar: {
    id: 'solar',
    label: 'Solar',
    background: '#0d0605',
    fog: '#1f0b08',
    gradient: 'radial-gradient(ellipse at 50% 40%, #3b1408 0%, #1f0b08 45%, #0d0605 100%)',
    edgeFrom: '#fb923c',
    edgeTo: '#e879f9',
    accent: '#fb923c',
    bloom: 1.6,
  },
}

export const STATUS_COLORS: Record<Status, string> = {
  active: '#34f5c5',
  warning: '#ffb547',
  critical: '#ff4d6d',
}

export const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  warning: 'Warning',
  critical: 'Critical',
}

export const TYPE_LABELS: Record<NodeType, string> = {
  gateway: 'Gateway',
  service: 'Service',
  database: 'Database',
  queue: 'Queue',
  cache: 'Cache',
  ai: 'AI',
  external: 'External',
}

export const NODE_SIZE: Record<NodeType, number> = {
  gateway: 1.5,
  service: 1.0,
  database: 1.35,
  queue: 1.05,
  cache: 0.85,
  ai: 1.25,
  external: 1.1,
}
