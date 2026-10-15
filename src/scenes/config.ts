import generated from "./layers.generated.json";

export type SceneId = keyof typeof generated.scenes;

export type LayerDef = { id: string; src: string; bbox?: number[] };
export type SceneAssets = {
  width: number;
  height: number;
  master: string;
  plate: string;
  layers: LayerDef[];
};

/** Parallax depth per layer: 0 = far (barely moves), 1 = nearest (moves most). Unlisted layers default to 0.3. */
export const DEPTHS: Record<SceneId, Record<string, number>> = {
  "s1-desert": { sky: 0.08, ground: 0.35, rv: 0.5, "rv-cutaway": 0.5, fg: 1 },
  "s2-superlab": { back: 0.15, fg: 1 },
  "s3-classroom": { room: 0.15, teacher: 0.45, desks: 1 },
  "s4-money": { room: 0.1, cash: 0.5, barrels: 0.7, bulb: 0.3 },
  "s5-carwash": { back: 0.15, brushes: 0.6 },
  "s6-pollos": { room: 0.15, gus: 0.45, counter: 1 },
  "s7-saul": { room: 0.15, tv: 0.55, desk: 1 },
  "s8-night": { sky: 0.08, ground: 0.35, rv: 0.5, fg: 1 },
};

export function sceneAssets(id: SceneId): SceneAssets {
  return generated.scenes[id] as SceneAssets;
}

export const singles = generated.singles;
