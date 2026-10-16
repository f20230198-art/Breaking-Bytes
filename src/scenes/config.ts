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
  // lab stays locked (no mouse parallax): the clipboard text and pipe liquid are overlaid in canvas coordinates
  lab: { back: 0, clipboard: 0, pipe: 0, glow: 0 },
};

export function sceneAssets(id: SceneId): SceneAssets {
  return generated.scenes[id] as SceneAssets;
}

export const singles = generated.singles;
