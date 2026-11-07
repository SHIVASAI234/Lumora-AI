import { Bot, Box, Cloud, Database, HardDrive, ListOrdered, Router } from 'lucide-react'
import type { ComponentType } from 'react'
import type { NodeType } from '@shared/graph.ts'
import { heroFor } from '../lib/heroes.ts'
import type { HeroGlyph } from '../lib/heroes.ts'
import { useStore } from '../store.ts'
import {
  ArcReactor, ArmorHelmet, Arrow, Atom, Bolt, Claws, CosmicEye, CosmicGem, Crown, DominoMask, Flame, GammaFist, Gauntlet,
  MysticSigil, PantherMask, PortalRing, Rocket, StarShield, StormHammer, Target, Trident, VisorHelmet, Web, Wings,
} from './HeroIcons.tsx'
import type { IconProps } from './HeroIcons.tsx'

export type TypeIcon = ComponentType<IconProps>

type NodeRef = { id: string; type: NodeType; label: string }

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

export const HERO_GLYPHS: Record<HeroGlyph, TypeIcon> = {
  shield: StarShield,
  gauntlet: Gauntlet,
  reactor: ArcReactor,
  web: Web,
  hammer: StormHammer,
  helmet: VisorHelmet,
  portal: PortalRing,
  armor: ArmorHelmet,
  claws: Claws,
  arrow: Arrow,
  sigil: MysticSigil,
  panther: PantherMask,
  fist: GammaFist,
  gem: CosmicGem,
  bolt: Bolt,
  wings: Wings,
  trident: Trident,
  rocket: Rocket,
  target: Target,
  flame: Flame,
  eye: CosmicEye,
  atom: Atom,
  crown: Crown,
  mask: DominoMask,
}

/** Type-level icons (dock chips). */
export function useTypeIcons(): Record<NodeType, TypeIcon> {
  return useStore((s) => s.iconSet) === 'hero' ? HERO_ICONS : TYPE_ICONS
}

/** Per-node icon: the node's own hero emblem in Hero mode, the type icon otherwise. */
export function useNodeIcon(): (node: NodeRef) => TypeIcon {
  const hero = useStore((s) => s.iconSet) === 'hero'
  return (node) => (hero ? HERO_GLYPHS[heroFor(node).glyph] : TYPE_ICONS[node.type])
}

/** Hero codename, only in Hero mode. */
export function useCodename(node: NodeRef | null | undefined): string | null {
  const hero = useStore((s) => s.iconSet) === 'hero'
  return hero && node ? heroFor(node).codename : null
}
