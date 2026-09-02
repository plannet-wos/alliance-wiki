/** Minimal shape of a shared `alliances/{stateId}-{slug}` document — see plannet-wos's alliance.service.ts, which owns creating/deleting these. */
export interface Alliance {
  id: string;   // "{stateId}-{slug}"
  stateId: string;
  slug: string;
  name: string;
}

export function allianceId(stateId: string, slug: string): string {
  return `${stateId}-${slug}`;
}
