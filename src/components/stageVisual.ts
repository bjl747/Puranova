import type { HeroMode } from './CellularHero';

/** Map a stage id to a CellularHero animation mode. */
export function heroModeForStage(stageId: string | undefined): HeroMode {
  switch (stageId) {
    case 'fed':
    case 'early':
      return 'fed';
    case 'glycogen':
    case 'switch':
      return 'burning';
    case 'ketosis':
      return 'ketosis';
    case 'autophagy':
    case 'deep':
      return 'autophagy';
    case 'regen':
    case 'extended':
      return 'regen';
    default:
      return 'idle';
  }
}
