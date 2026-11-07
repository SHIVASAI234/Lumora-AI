import { Bot, Box, Cloud, Database, HardDrive, ListOrdered, Router } from 'lucide-react'
import type { ComponentType } from 'react'
import type { NodeType } from '@shared/graph.ts'
import { useStore } from '../store.ts'
import { ArcReactor, Gauntlet, PortalRing, StarShield, StormHammer, VisorHelmet, Web } from './HeroIcons.tsx'
import type { IconProps } from './HeroIcons.tsx'

export type TypeIcon = ComponentType<IconProps>

export const TYPE_ICONS: Record<NodeType, TypeIcon> = {
  gateway: Router,
  service: Box,
  database: Database,
  queue: ListOrdered,
  cache: HardDrive,
  ai: Bot,
  external: Cloud,
}

export const HERO_ICONS: Record<NodeType, TypeIcon> = {
  gateway: StarShield,
  service: Gauntlet,
  database: ArcReactor,
  queue: Web,
  cache: StormHammer,
  ai: VisorHelmet,
  external: PortalRing,
}

export function useTypeIcons(): Record<NodeType, TypeIcon> {
  return useStore((s) => s.iconSet) === 'hero' ? HERO_ICONS : TYPE_ICONS
}
