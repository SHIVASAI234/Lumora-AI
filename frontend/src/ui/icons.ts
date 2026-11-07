import { Bot, Box, Cloud, Database, HardDrive, ListOrdered, Router } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NodeType } from '@shared/graph.ts'

export const TYPE_ICONS: Record<NodeType, LucideIcon> = {
  gateway: Router,
  service: Box,
  database: Database,
  queue: ListOrdered,
  cache: HardDrive,
  ai: Bot,
  external: Cloud,
}
