import generated from "./layers.generated.json";

export type SceneId = keyof typeof generated.scenes;

export type LayerDef = { id: string; src: string; srcset?: string; bbox?: number[] };
export type SceneAssets = {
  width: number;
  height: number;
  master: string;
  plate: string;
  layers: LayerDef[];
};

/** Parallax depth per layer: 0 = far (barely moves), 1 = nearest (moves most). Unlisted layers default to 0.3. */
export const DEPTHS: Record<SceneId, Record<string, number>> = {
  hero: { sky: 0.04, mesas: 0.15, ground: 0.35, tumbleweed: 0.35, rv: 0.55, "rv-cutaway": 0.55, chairs: 0.65, fg: 1 },
  // lab: nearer planes shift more. The text and effects are grouped onto the plane they sit on (see LabScene)
  lab: { back: 0.2, glow: 0.2, clipboard: 0.7, pipe: 1.2 },
  "prizes-office": { back: 0.15, walter: 0.3, gus: 0.5, saul: 0.5, "case-1": 0.6, "case-2": 0.75, "case-3": 0.75 },
  "prizes-student": { back: 0.15, jesse: 0.4, flynn: 0.4, "case-1": 0.7, "case-2": 0.7, more: 0.8 },
  classroom: { back: 0.15, teacher: 0.3, desks: 0.85 },
};

export function sceneAssets(id: SceneId): SceneAssets {
  return generated.scenes[id] as SceneAssets;
}

export const singles = generated.singles;
