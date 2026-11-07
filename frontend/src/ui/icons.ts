import { BrainCircuit, Database, Globe, Layers, Server, Waypoints, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NodeType } from '@shared/graph.ts'

export const TYPE_ICONS: Record<NodeType, LucideIcon> = {
  gateway: Waypoints,
  service: Server,
  database: Database,
  queue: Layers,
  cache: Zap,
  ai: BrainCircuit,
  external: Globe,
}
