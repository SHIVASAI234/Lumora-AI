import type { NodeType } from '@shared/graph.ts'

export type HeroGlyph =
  | 'shield' | 'gauntlet' | 'reactor' | 'web' | 'hammer' | 'helmet' | 'portal' | 'armor' | 'claws' | 'arrow' | 'sigil'
  | 'panther' | 'fist' | 'gem' | 'bolt' | 'wings' | 'trident' | 'rocket' | 'target' | 'flame' | 'eye' | 'atom' | 'crown' | 'mask'

export interface Hero {
  glyph: HeroGlyph
  codename: string
}

/** Hero-mode identity per node: an original emblem and codename. Neighbouring nodes never share an emblem. */
export const ROSTER: Record<string, Hero> = {
  'cdn-edge': { glyph: 'wings', codename: 'Skyline Sentinel' },
  'api-gateway': { glyph: 'shield', codename: 'The Gatekeeper' },
  'rate-limiter': { glyph: 'target', codename: 'Throttle Marshal' },
  'web-bff': { glyph: 'web', codename: 'Web Weaver' },
  'mobile-bff': { glyph: 'rocket', codename: 'Pocket Rocket' },
  'auth-proxy': { glyph: 'armor', codename: 'Iron Warden' },
  'identity-api': { glyph: 'mask', codename: 'Mask of Many' },
  'mfa-service': { glyph: 'eye', codename: 'Second Sight' },
  'session-cache': { glyph: 'bolt', codename: 'Static Spark' },
  'users-db': { glyph: 'reactor', codename: 'Core Keeper' },
  'oauth-provider': { glyph: 'portal', codename: 'Portal Walker' },
  'catalog-api': { glyph: 'sigil', codename: 'Arcane Archivist' },
  'search-service': { glyph: 'arrow', codename: "Seeker's Arrow" },
  'cart-service': { glyph: 'gauntlet', codename: 'Iron Grip' },
  'checkout-api': { glyph: 'fist', codename: 'Final Blow' },
  'pricing-engine': { glyph: 'gem', codename: 'Price Prism' },
  'inventory-service': { glyph: 'panther', codename: 'Stock Prowler' },
  'catalog-db': { glyph: 'crown', codename: 'Archive Monarch' },
  'cart-cache': { glyph: 'hammer', codename: 'Thunder Cache' },
  'orders-db': { glyph: 'atom', codename: 'Order Quantum' },
  'payments-api': { glyph: 'trident', codename: 'Tidebreaker' },
  'fraud-scorer': { glyph: 'claws', codename: 'Fraud Slasher' },
  'ledger-service': { glyph: 'helmet', codename: 'Ledger Knight' },
  'ledger-queue': { glyph: 'flame', codename: 'Relay Blaze' },
  'payments-db': { glyph: 'shield', codename: 'Vault Guardian' },
  'refunds-worker': { glyph: 'arrow', codename: 'Rebound' },
  'stripe-gateway': { glyph: 'bolt', codename: 'Charge Runner' },
  'event-bus': { glyph: 'atom', codename: 'Event Horizon' },
  'stream-processor': { glyph: 'flame', codename: 'Firestream' },
  'etl-worker': { glyph: 'gauntlet', codename: 'The Forgehand' },
  'analytics-warehouse': { glyph: 'crown', codename: 'Data Sovereign' },
  'metrics-store': { glyph: 'target', codename: 'Gauge Master' },
  'log-pipeline': { glyph: 'arrow', codename: 'Trail Tracker' },
  'llm-gateway': { glyph: 'sigil', codename: 'Arcane Voice' },
  'insight-agent': { glyph: 'eye', codename: 'The Seer' },
  'recommender': { glyph: 'gem', codename: 'Wish Granter' },
  'embedding-worker': { glyph: 'atom', codename: 'Vector Smith' },
  'vector-db': { glyph: 'portal', codename: 'Cosmic Atlas' },
  'feature-store': { glyph: 'hammer', codename: 'Feature Forge' },
  'model-registry': { glyph: 'helmet', codename: 'Model Commander' },
  'notification-service': { glyph: 'wings', codename: 'Herald Wing' },
  'push-queue': { glyph: 'rocket', codename: 'Push Blaster' },
  'email-provider': { glyph: 'mask', codename: 'Mail Phantom' },
  'sms-provider': { glyph: 'bolt', codename: 'Signal Flash' },
}

const TYPE_FALLBACK: Record<NodeType, HeroGlyph> = {
  gateway: 'shield',
  service: 'gauntlet',
  database: 'reactor',
  queue: 'web',
  cache: 'hammer',
  ai: 'helmet',
  external: 'portal',
}

export function heroFor(node: { id: string; type: NodeType; label: string }): Hero {
  return ROSTER[node.id] ?? { glyph: TYPE_FALLBACK[node.type], codename: `Agent ${node.label}` }
}
