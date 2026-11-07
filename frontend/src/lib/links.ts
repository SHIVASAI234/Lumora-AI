import type { GraphNode } from '@shared/graph.ts'

export type LinkKind = 'logs' | 'traces' | 'source' | 'runbook'

const env = import.meta.env
const TEMPLATES: Record<LinkKind, string | undefined> = {
  logs: env.VITE_LOGS_URL as string | undefined,
  traces: env.VITE_TRACES_URL as string | undefined,
  source: env.VITE_SOURCE_URL as string | undefined,
  runbook: env.VITE_RUNBOOK_URL as string | undefined,
}

/** Fills `{id}`, `{label}`, `{cluster}`, `{owner}`, `{region}`, `{version}` in a configured URL template. */
export function externalLink(kind: LinkKind, node: GraphNode): string | null {
  const template = TEMPLATES[kind]
  if (!template) return null
  return template.replace(/\{(id|label|cluster|owner|region|version)\}/g, (_, key: 'id' | 'label' | 'cluster' | 'owner' | 'region' | 'version') =>
    encodeURIComponent(node[key]),
  )
}
