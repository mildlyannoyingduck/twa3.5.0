import {
  AbilityId,
  AccentPresetId,
  AppearanceStudioConfig,
  AuroraThemeId,
  CrestFrameId,
  DayCompletionLog,
  DivisionNumber,
  FridayAnchor,
  FridayWeekOverrides,
  LeagueId,
  LiveParticlesMode,
  MissedLessonItem,
  PaperEntry,
  ProgressLogEntry,
  ProgressionState,
  RingSkinId,
  StudyTask,
  SubjectId,
  SubjectPaletteId,
  TimetableSlot,
  VaultArtifactId,
} from '../types';
import { addDaysISO, getMondayISOForDate, getTodayISO, getWeekDaysForOffset } from './dateUtils';
import { getDurationMinutes } from './timeUtils';

export const XP_RULES_VERSION = 2;
export const ZENITH_FLOOR_XP = 5000;
export const ZENITH_DEMOTION_FLOOR_XP = 4900;

export interface LeagueSpec {
  id: LeagueId;
  order: number;
  name: string;
  shortName: string;
  minXp: number;
  maxXp: number; // exclusive upper bound except apex
  colorHex: string;
  glowRgba: string;
  badgeGradient: string;
  textClass: string;
  unlockSummary: string;
}

export const LEAGUES: LeagueSpec[] = [
  {
    id: 'bronze',
    order: 0,
    name: 'Bronze Initiate',
    shortName: 'Bronze',
    minXp: 0,
    maxXp: 300,
    colorHex: '#CD7F32',
    glowRgba: 'rgba(217, 119, 6, 0.35)',
    badgeGradient: 'from-amber-600 via-orange-500 to-amber-700',
    textClass: 'text-amber-700 dark:text-amber-300',
    unlockSummary: 'Arctic Sapphire base glass + 2 accent glows',
  },
  {
    id: 'silver',
    order: 1,
    name: 'Silver Scholar',
    shortName: 'Silver',
    minXp: 300,
    maxXp: 800,
    colorHex: '#94A3B8',
    glowRgba: 'rgba(148, 163, 184, 0.42)',
    badgeGradient: 'from-sky-400 via-blue-400 to-cyan-500',
    textClass: 'text-sky-700 dark:text-sky-200',
    unlockSummary: 'Streak Shield & Focus Rush + 4 accent hues + Custom Title',
  },
  {
    id: 'gold',
    order: 2,
    name: 'Gold Strategist',
    shortName: 'Gold',
    minXp: 800,
    maxXp: 1600,
    colorHex: '#F59E0B',
    glowRgba: 'rgba(245, 158, 11, 0.45)',
    badgeGradient: 'from-amber-400 via-yellow-400 to-orange-500',
    textClass: 'text-amber-600 dark:text-amber-300',
    unlockSummary: 'Smart Gap Filler & Subject Radar + Subject Glow Palettes',
  },
  {
    id: 'platinum',
    order: 3,
    name: 'Platinum Alchemist',
    shortName: 'Platinum',
    minXp: 1600,
    maxXp: 2800,
    colorHex: '#22D3EE',
    glowRgba: 'rgba(34, 211, 238, 0.50)',
    badgeGradient: 'from-cyan-400 via-teal-300 to-blue-500',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    unlockSummary: 'Review Chain & Focus Soundscapes + Aurora Atmosphere Engine',
  },
  {
    id: 'diamond',
    order: 4,
    name: 'Diamond Sovereign',
    shortName: 'Diamond',
    minXp: 2800,
    maxXp: 4500,
    colorHex: '#38BDF8',
    glowRgba: 'rgba(56, 189, 248, 0.58)',
    badgeGradient: 'from-blue-500 via-cyan-300 to-violet-500',
    textClass: 'text-blue-700 dark:text-cyan-200',
    unlockSummary: 'Exam Readiness Index + Iridescent Prism Rims & Completion FX',
  },
  {
    id: 'apex',
    order: 5,
    name: 'Sapphire Apex',
    shortName: 'Apex',
    minXp: 4500,
    maxXp: 5000,
    colorHex: '#60A5FA',
    glowRgba: 'rgba(96, 165, 250, 0.68)',
    badgeGradient: 'from-cyan-300 via-blue-500 to-emerald-400',
    textClass: 'text-blue-700 dark:text-cyan-200',
    unlockSummary: 'Full Studio Mode: Live Particles, Holo Presets & Custom Theme Forge',
  },
  {
    id: 'zenith',
    order: 6,
    name: 'Zenith Crown',
    shortName: 'Zenith',
    minXp: 5000,
    maxXp: 999999,
    colorHex: '#FBBF24',
    glowRgba: 'rgba(251, 191, 36, 0.62)',
    badgeGradient: 'from-amber-300 via-yellow-400 to-cyan-400',
    textClass: 'text-amber-700 dark:text-amber-300',
    unlockSummary: 'Monday Season Resets at 5,000 XP · Weekly Crystal Payouts & Crown Relic',
  },
];

export interface AbilitySpec {
  id: AbilityId;
  name: string;
  tagline: string;
  description: string;
  requiredLeague: LeagueId;
  unlockCostCrystals: number;
  kind: 'passive' | 'charge';
  chargeCostCrystals?: number;
  chargeLabel?: string;
}

export const ABILITIES: AbilitySpec[] = [
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    tagline: 'Daily streak armor',
    description: 'Protects your study streak for 1 missed day so momentum never snaps from a busy evening.',
    requiredLeague: 'silver',
    unlockCostCrystals: 40,
    kind: 'charge',
    chargeCostCrystals: 25,
    chargeLabel: 'Buy +1 Shield Charge',
  },
  {
    id: 'focus_rush',
    name: '2× Focus Rush',
    tagline: 'Double XP power hour',
    description: 'Triggers a 60m or 90m lock session where all finished blocks, tasks & papers earn 2× XP.',
    requiredLeague: 'silver',
    unlockCostCrystals: 50,
    kind: 'charge',
    chargeCostCrystals: 20,
    chargeLabel: 'Buy +1 Rush Charge',
  },
  {
    id: 'smart_gap_filler',
    name: 'Smart Gap Filler',
    tagline: '1-tap backlog auto-scheduler',
    description: 'Scans your open week around classes & 2h travel buffers to slot Missed lessons automatically.',
    requiredLeague: 'gold',
    unlockCostCrystals: 80,
    kind: 'passive',
  },
  {
    id: 'subject_balance_radar',
    name: 'Subject Balance Radar',
    tagline: 'Bio / Phy / Chem split check',
    description: 'Highlights neglected subjects on Home and warns early before an imbalance hurts mocks.',
    requiredLeague: 'gold',
    unlockCostCrystals: 75,
    kind: 'passive',
  },
  {
    id: 'focus_soundscapes',
    name: 'Focus Soundscapes',
    tagline: 'Offline study audio engine',
    description: 'Synthesizes crisp Rain on Glass, 40Hz Sapphire Hum & Ocean Noise inside Focus Rush.',
    requiredLeague: 'platinum',
    unlockCostCrystals: 110,
    kind: 'passive',
  },
  {
    id: 'review_chain_radar',
    name: 'Review Chain & Weak Radar',
    tagline: '1.5× review XP + error map',
    description: 'Awards 1.5× XP for reviewing Past Papers fast & ranks your weakest syllabus units across papers.',
    requiredLeague: 'platinum',
    unlockCostCrystals: 120,
    kind: 'passive',
  },
  {
    id: 'exam_readiness_index',
    name: 'Exam Readiness Index',
    tagline: 'Live A/L readiness forecast',
    description: 'Combines weekly completion, paper averages, review rate & subject balance on Exam Countdown.',
    requiredLeague: 'diamond',
    unlockCostCrystals: 160,
    kind: 'passive',
  },
];

export const XP_VALUES = {
  classComplete: 30,
  selfStudyComplete: 50,
  taskComplete: 25,
  taskWrapUpBonus: 20,
  checklistSubItem: 6,
  unitCovered: 35,
  paperLog: 55,
  paperHighScoreBonus: 15,
  paperReview: 45,
  missedCovered: 26,
  missedWrapUpBonus: 15,
  firstMissPenalty: -30,
  rescueComebackBonus: 25,
  rescueComeback: 60,
  secondMissDoubleBust: -70,
};

export const CRYSTAL_VALUES = {
  classComplete: 12,
  selfStudyComplete: 20,
  taskComplete: 10,
  taskWrapUpBonus: 8,
  checklistSubItem: 2,
  unitCovered: 14,
  paperLog: 22,
  paperReview: 18,
  missedCovered: 10,
  missedWrapUpBonus: 6,
  rescueComeback: 24,
  leaguePromoBonus: 45,
};

/* =====================================================================
 * PROGRESSIVE DURATION & EFFORT XP ENGINE
 * ===================================================================== */

/**
 * Uncapped continuous self-study curve:
 * - 0..60m:   25 XP / 30m (30m = 25, 60m = 50)
 * - 60..120m: 32 XP / 30m (90m = 82, 120m = 114)
 * - 120..180m:40 XP / 30m (150m = 154, 180m = 194)
 * - 180m+:    45 XP / 30m endlessly (240m = 284, 300m = 374...)
 */
export function computeProgressiveSelfStudyXp(durationMins: number): number {
  const m = Math.max(5, Math.round(durationMins));
  const b1 = Math.min(m, 60) * (25 / 30);
  const b2 = Math.max(0, Math.min(m, 120) - 60) * (32 / 30);
  const b3 = Math.max(0, Math.min(m, 180) - 120) * (40 / 30);
  const b4 = Math.max(0, m - 180) * (45 / 30);
  return Math.max(8, Math.round(b1 + b2 + b3 + b4));
}

export function crystalsFromXp(xp: number): number {
  return Math.max(3, Math.round(Math.max(0, xp) * 0.4));
}

export function isRecordingSlot(
  slot: Pick<TimetableSlot, 'linkedMissedId' | 'title'>,
  missedItems?: MissedLessonItem[],
): boolean {
  if (!slot.linkedMissedId) return false;
  const linked = missedItems?.find((m) => m.id === slot.linkedMissedId);
  if (linked) return linked.category === 'recording';
  return slot.title.toLowerCase().startsWith('missed rec');
}

export function computeSlotReward(
  slot: TimetableSlot,
  missedItems?: MissedLessonItem[],
): {
  xp: number;
  cry: number;
  durationMins: number;
  activityKind: 'rescue' | 'recording' | 'class' | 'self-study';
} {
  const durationMins = Math.max(15, getDurationMinutes(slot.startTime, slot.endTime));

  if (slot.isRescueSlot) {
    const xp = Math.max(55, computeProgressiveSelfStudyXp(durationMins) + XP_VALUES.rescueComebackBonus);
    return {
      xp,
      cry: crystalsFromXp(xp),
      durationMins,
      activityKind: 'rescue',
    };
  }

  if (isRecordingSlot(slot, missedItems)) {
    // Recordings earn ~0.5x linear rate so solo active self-study always leads
    const xp = Math.max(12, Math.round((durationMins / 30) * 13));
    return {
      xp,
      cry: crystalsFromXp(xp),
      durationMins,
      activityKind: 'recording',
    };
  }

  if (slot.category === 'class') {
    const physicalGrit = slot.mode === 'physical' ? 10 : 0;
    const xp = Math.max(12, Math.round((durationMins / 30) * 11) + physicalGrit);
    return {
      xp,
      cry: crystalsFromXp(xp),
      durationMins,
      activityKind: 'class',
    };
  }

  const xp = computeProgressiveSelfStudyXp(durationMins);
  return {
    xp,
    cry: crystalsFromXp(xp),
    durationMins,
    activityKind: 'self-study',
  };
}

export function computeSlotPenalty(
  slot: TimetableSlot,
  missedItems?: MissedLessonItem[],
): { firstMissXp: number; doubleBustXp: number } {
  const baseReward = computeSlotReward({ ...slot, isRescueSlot: false }, missedItems);
  const firstMissMag = Math.min(75, Math.max(20, Math.round(baseReward.xp * 0.5)));
  const doubleBustMag = Math.min(140, Math.max(45, firstMissMag * 2 + 10));
  return {
    firstMissXp: -firstMissMag,
    doubleBustXp: -doubleBustMag,
  };
}

export function computeTaskReward(
  task: Pick<StudyTask, 'defaultSessionMins' | 'importance'>,
  opts?: { alreadySlotRewarded?: boolean },
): { xp: number; cry: number; isWrapUp: boolean } {
  if (opts?.alreadySlotRewarded) {
    return {
      xp: XP_VALUES.taskWrapUpBonus,
      cry: CRYSTAL_VALUES.taskWrapUpBonus,
      isWrapUp: true,
    };
  }
  const dur = Math.max(15, task.defaultSessionMins || 60);
  const base = computeProgressiveSelfStudyXp(dur);
  const impMult =
    task.importance === 'urgent' ? 1.2 : task.importance === 'high' ? 1.1 : 1;
  const xp = Math.max(15, Math.round(base * impMult));
  return {
    xp,
    cry: crystalsFromXp(xp),
    isWrapUp: false,
  };
}

export function computeMissedItemReward(
  item: Pick<MissedLessonItem, 'category' | 'estimatedMins' | 'playbackSpeed'>,
  opts?: { alreadySlotRewarded?: boolean },
): { xp: number; cry: number; isWrapUp: boolean } {
  if (opts?.alreadySlotRewarded) {
    return {
      xp: XP_VALUES.missedWrapUpBonus,
      cry: CRYSTAL_VALUES.missedWrapUpBonus,
      isWrapUp: true,
    };
  }
  if (item.category === 'recording') {
    const speed = item.playbackSpeed && item.playbackSpeed > 0 ? item.playbackSpeed : 1;
    const effMins = Math.max(15, Math.round((item.estimatedMins || 60) / speed));
    const xp = Math.max(12, Math.round((effMins / 30) * 13));
    return { xp, cry: crystalsFromXp(xp), isWrapUp: false };
  }
  const xp = computeProgressiveSelfStudyXp(Math.max(15, item.estimatedMins || 60));
  return { xp, cry: crystalsFromXp(xp), isWrapUp: false };
}

export function computePaperLogReward(
  paper: Pick<PaperEntry, 'combinedPercent'>,
): { xp: number; cry: number; highScoreBonus: boolean } {
  const highScoreBonus = paper.combinedPercent >= 75;
  const xp = XP_VALUES.paperLog + (highScoreBonus ? XP_VALUES.paperHighScoreBonus : 0);
  return { xp, cry: crystalsFromXp(xp), highScoreBonus };
}

export function computePaperReviewReward(
  fastChainActive: boolean,
): { xp: number; cry: number } {
  const xp = Math.round(XP_VALUES.paperReview * (fastChainActive ? 1.5 : 1));
  return { xp, cry: CRYSTAL_VALUES.paperReview };
}

export const DEFAULT_STUDIO_CONFIG: AppearanceStudioConfig = {
  accentPreset: 'arctic',
  customTitle: '',
  subjectPalette: 'classic',
  auroraTheme: 'sapphire',
  prismBorders: false,
  liveParticles: 'off',
  completionFx: 'ripple',
  showCrestInHeader: true,
  ringSkin: 'classic',
  crestFrame: 'none',
  customBgHex: '#020B24',
  customOrb1Hex: '#2563EB',
  customOrb2Hex: '#22D3EE',
  customRimHex: '#38BDF8',
};

export function createDefaultProgressionState(): ProgressionState {
  return {
    xp: 0,
    lifetimeXpEarned: 0,
    crystals: 30, // Starter crystals so user can preview saving toward first unlock
    highestLeagueReached: 'bronze',
    currentLeague: 'bronze',
    promoShieldUntilMs: 0,
    unlockedAbilities: {},
    streakShieldCharges: 0,
    focusRushCharges: 0,
    focusRushUntilMs: 0,
    streakDays: 0,
    lastStudyDateISO: '',
    checkInAnchorISO: getTodayISO(),
    checkIns: {},
    rewardedEntities: {},
    claimedBounties: {},
    xpRulesVersion: XP_RULES_VERSION,
    zenithSeasonMondayISO: undefined,
    zenithSeasonsCompleted: 0,
    zenithBestXp: 0,
    zenithCumulativeSurplusXp: 0,
    ownedArtifacts: {},
    equippedArtifact: null,
    ownedRingSkins: { classic: true },
    ownedCrestFrames: { none: true },
    pardonScrollCharges: 0,
    hourglassCharges: 0,
    history: [],
  };
}

export function getLeagueOrder(leagueId: LeagueId): number {
  return LEAGUES.find((l) => l.id === leagueId)?.order ?? 0;
}

export function getLeagueSpec(leagueId: LeagueId): LeagueSpec {
  return LEAGUES.find((l) => l.id === leagueId) ?? LEAGUES[0];
}

export function computeRawLeagueFromXp(xp: number): LeagueSpec {
  const safeXp = Math.max(0, Math.round(xp));
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (safeXp >= LEAGUES[i].minXp) return LEAGUES[i];
  }
  return LEAGUES[0];
}

export function getDivisionInfo(xp: number, leagueId: LeagueId): {
  league: LeagueSpec;
  division: DivisionNumber;
  roman: 'III' | 'II' | 'I';
  progressPercent: number;
  xpToNextLeague: number;
  nextLeague: LeagueSpec | null;
} {
  const league = getLeagueSpec(leagueId);
  const nextLeague = LEAGUES[league.order + 1] ?? null;

  if (!nextLeague) {
    // Zenith Crown: track weekly season progress above the 5,000 XP floor toward +1,000 push milestone
    const surplus = Math.max(0, xp - ZENITH_FLOOR_XP);
    return {
      league,
      division: 1,
      roman: 'I',
      progressPercent: Math.min(100, Math.round((surplus / 1000) * 100)),
      xpToNextLeague: 0,
      nextLeague: null,
    };
  }

  const span = Math.max(1, nextLeague.minXp - league.minXp);
  const rel = Math.max(0, Math.min(span, xp - league.minXp));
  const ratio = rel / span;
  const division: DivisionNumber = ratio >= 0.66 ? 1 : ratio >= 0.33 ? 2 : 3;
  const roman = division === 1 ? 'I' : division === 2 ? 'II' : 'III';

  return {
    league,
    division,
    roman,
    progressPercent: Math.round(ratio * 100),
    xpToNextLeague: Math.max(0, nextLeague.minXp - xp),
    nextLeague,
  };
}

export function isLeagueAtLeast(current: LeagueId, required: LeagueId): boolean {
  return getLeagueOrder(current) >= getLeagueOrder(required);
}

export function isAbilityActive(
  progression: ProgressionState,
  abilityId: AbilityId,
): boolean {
  const spec = ABILITIES.find((a) => a.id === abilityId);
  if (!spec) return false;
  if (!isLeagueAtLeast(progression.currentLeague, spec.requiredLeague)) {
    return false;
  }
  return Boolean(progression.unlockedAbilities[abilityId]);
}

export function isFocusRushActive(progression: ProgressionState, nowMs = Date.now()): boolean {
  return progression.focusRushUntilMs > nowMs && isLeagueAtLeast(progression.currentLeague, 'silver');
}

export function hasArtifactTrioBonus(progression: ProgressionState): boolean {
  const owned = progression.ownedArtifacts ?? {};
  return Boolean(owned.dna_helix && owned.quantum_pendulum && owned.alchemist_flask);
}

/**
 * Checks whether a Monday 00:00 season reset is due for Zenith Crown (5,000+ XP).
 * Surplus above 5,000 XP converts into Focus Crystals & permanent Season stats, then resets XP to 5,000.
 */
export function processZenithWeeklyReset(
  prev: ProgressionState,
  nowMs: number = Date.now(),
): {
  next: ProgressionState;
  resetOccurred: boolean;
  surplusXp: number;
  crystalPayout: number;
  demotedToApex: boolean;
} {
  const currentMondayISO = getMondayISOForDate(getTodayISO(new Date(nowMs)));

  if (prev.currentLeague !== 'zenith') {
    return {
      next: prev,
      resetOccurred: false,
      surplusXp: 0,
      crystalPayout: 0,
      demotedToApex: false,
    };
  }

  if (!prev.zenithSeasonMondayISO) {
    return {
      next: {
        ...prev,
        zenithSeasonMondayISO: currentMondayISO,
        zenithBestXp: Math.max(prev.zenithBestXp ?? ZENITH_FLOOR_XP, prev.xp),
      },
      resetOccurred: false,
      surplusXp: 0,
      crystalPayout: 0,
      demotedToApex: false,
    };
  }

  if (prev.zenithSeasonMondayISO >= currentMondayISO) {
    return {
      next: prev,
      resetOccurred: false,
      surplusXp: 0,
      crystalPayout: 0,
      demotedToApex: false,
    };
  }

  // New Monday arrived while in Zenith Crown
  if (prev.xp < ZENITH_FLOOR_XP) {
    const fallbackSpec = computeRawLeagueFromXp(prev.xp);
    const logEntry: ProgressLogEntry = {
      id: `zenith-end-${nowMs}`,
      timestampMs: nowMs,
      deltaXp: 0,
      deltaCrystals: 0,
      label: `Zenith Season Ended (${prev.xp} < ${ZENITH_FLOOR_XP} XP) → ${fallbackSpec.name}`,
      tone: 'penalty',
    };
    return {
      next: {
        ...prev,
        currentLeague: fallbackSpec.id,
        zenithSeasonMondayISO: undefined,
        history: [logEntry, ...prev.history].slice(0, 40),
      },
      resetOccurred: true,
      surplusXp: 0,
      crystalPayout: 0,
      demotedToApex: true,
    };
  }

  const surplusXp = Math.max(0, prev.xp - ZENITH_FLOOR_XP);
  const crystalPayout = Math.max(25, 25 + Math.round((surplusXp / 100) * 15));
  const bestXp = Math.max(prev.zenithBestXp ?? ZENITH_FLOOR_XP, prev.xp);
  const seasonsCompleted = (prev.zenithSeasonsCompleted ?? 0) + 1;
  const cumulativeSurplus = (prev.zenithCumulativeSurplusXp ?? 0) + surplusXp;

  const resetLog: ProgressLogEntry = {
    id: `zenith-reset-${nowMs}`,
    timestampMs: nowMs,
    deltaXp: -surplusXp,
    deltaCrystals: crystalPayout,
    label: `Zenith Monday Reset · +${surplusXp} push banked → +${crystalPayout}💎`,
    tone: 'bounty',
  };

  return {
    next: {
      ...prev,
      xp: ZENITH_FLOOR_XP,
      crystals: prev.crystals + crystalPayout,
      zenithSeasonMondayISO: currentMondayISO,
      zenithSeasonsCompleted: seasonsCompleted,
      zenithBestXp: bestXp,
      zenithCumulativeSurplusXp: cumulativeSurplus,
      promoShieldUntilMs: nowMs + 24 * 60 * 60 * 1000,
      history: [resetLog, ...prev.history].slice(0, 40),
    },
    resetOccurred: true,
    surplusXp,
    crystalPayout,
    demotedToApex: false,
  };
}

export function applyProgressDelta(
  prev: ProgressionState,
  deltaXpRaw: number,
  deltaCrystalsRaw: number,
  label: string,
  tone: ProgressLogEntry['tone'],
  nowMs: number = Date.now(),
): {
  next: ProgressionState;
  promotedTo: LeagueSpec | null;
  demotedTo: LeagueSpec | null;
  shieldSavedDemotion: boolean;
} {
  const rushMultiplier =
    deltaXpRaw > 0 && isFocusRushActive(prev, nowMs) && tone !== 'bounty' ? 2 : 1;
  const deltaXp = Math.round(deltaXpRaw * rushMultiplier);

  const trioMult =
    deltaCrystalsRaw > 0 && tone !== 'shop' && hasArtifactTrioBonus(prev) ? 1.1 : 1;
  const deltaCrystals = Math.round(deltaCrystalsRaw * trioMult);

  const nextXp = Math.max(0, prev.xp + deltaXp);
  const nextCrystals = Math.max(0, prev.crystals + deltaCrystals);
  const lifetimeXpEarned =
    deltaXp > 0
      ? prev.lifetimeXpEarned + deltaXp
      : tone === 'reversal'
        ? Math.max(0, prev.lifetimeXpEarned + deltaXp)
        : prev.lifetimeXpEarned;

  const prevSpec = getLeagueSpec(prev.currentLeague);
  const rawSpec = computeRawLeagueFromXp(nextXp);

  let nextLeague = prev.currentLeague;
  let nextPromoShieldUntilMs = prev.promoShieldUntilMs;
  let promotedTo: LeagueSpec | null = null;
  let demotedTo: LeagueSpec | null = null;
  let shieldSavedDemotion = false;
  let bonusCrystals = 0;

  let zenithSeasonMondayISO = prev.zenithSeasonMondayISO;
  let zenithBestXp = prev.zenithBestXp ?? 0;

  if (rawSpec.order > prevSpec.order) {
    nextLeague = rawSpec.id;
    promotedTo = rawSpec;
    // Grant 24h COC promotion shield against instant bounce-back
    nextPromoShieldUntilMs = nowMs + 24 * 60 * 60 * 1000;
    bonusCrystals = CRYSTAL_VALUES.leaguePromoBonus;
    if (rawSpec.id === 'zenith') {
      zenithSeasonMondayISO = getMondayISOForDate(getTodayISO(new Date(nowMs)));
      zenithBestXp = Math.max(zenithBestXp, nextXp);
    }
  } else if (rawSpec.order < prevSpec.order) {
    const withinZenithGrace =
      prev.currentLeague === 'zenith' && nextXp >= ZENITH_DEMOTION_FLOOR_XP;
    if (tone !== 'reversal' && (prev.promoShieldUntilMs > nowMs || withinZenithGrace)) {
      shieldSavedDemotion = true;
      nextLeague = prev.currentLeague;
    } else {
      nextLeague = rawSpec.id;
      if (rawSpec.id !== 'zenith') {
        zenithSeasonMondayISO = undefined;
      }
      if (tone !== 'reversal') {
        demotedTo = rawSpec;
      }
    }
  }

  if (nextLeague === 'zenith') {
    zenithSeasonMondayISO =
      zenithSeasonMondayISO ?? getMondayISOForDate(getTodayISO(new Date(nowMs)));
    zenithBestXp = Math.max(zenithBestXp, nextXp);
  }

  const highestLeagueReached =
    getLeagueOrder(nextLeague) > getLeagueOrder(prev.highestLeagueReached)
      ? nextLeague
      : prev.highestLeagueReached;

  const todayISO = getTodayISO(new Date(nowMs));
  let streakDays = prev.streakDays;
  let lastStudyDateISO = prev.lastStudyDateISO;
  let streakShieldCharges = prev.streakShieldCharges;

  if (deltaXp > 0 && tone !== 'shop') {
    if (!lastStudyDateISO) {
      streakDays = 1;
      lastStudyDateISO = todayISO;
    } else if (lastStudyDateISO !== todayISO) {
      const prevD = new Date(`${lastStudyDateISO}T00:00:00`);
      const curD = new Date(`${todayISO}T00:00:00`);
      const diffDays = Math.round((curD.getTime() - prevD.getTime()) / 86400000);
      if (diffDays === 1) {
        streakDays += 1;
      } else if (diffDays === 2 && streakShieldCharges > 0 && isAbilityActive(prev, 'streak_shield')) {
        // Streak Shield absorbs a 1-day gap automatically!
        streakShieldCharges -= 1;
        streakDays += 1;
      } else if (diffDays > 1) {
        streakDays = 1;
      }
      lastStudyDateISO = todayISO;
    }
  }

  const logEntry: ProgressLogEntry = {
    id: `xp-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
    timestampMs: nowMs,
    deltaXp,
    deltaCrystals: deltaCrystals + bonusCrystals,
    label: rushMultiplier > 1 ? `${label} (2× Rush)` : label,
    tone,
  };

  return {
    next: {
      ...prev,
      xp: nextXp,
      lifetimeXpEarned,
      crystals: nextCrystals + bonusCrystals,
      currentLeague: nextLeague,
      highestLeagueReached,
      promoShieldUntilMs: nextPromoShieldUntilMs,
      zenithSeasonMondayISO,
      zenithBestXp,
      streakDays,
      lastStudyDateISO,
      streakShieldCharges,
      xpRulesVersion: XP_RULES_VERSION,
      history: [logEntry, ...prev.history].slice(0, 40),
    },
    promotedTo,
    demotedTo,
    shieldSavedDemotion,
  };
}

/* =====================================================================
 * RETROACTIVE HISTORICAL XP RECALCULATOR (ON RESTORE & UPGRADE)
 * ===================================================================== */

export interface RecalculationSummary {
  totalXp: number;
  totalCrystals: number;
  league: LeagueSpec;
  selfStudySlots: number;
  recordingSlots: number;
  classSlots: number;
  partialSlots: number;
  tasks: number;
  checklists: number;
  missed: number;
  papers: number;
  units: number;
  deltaFromPreviousXp: number;
}

const BOUNTY_REWARD_MAP: Record<string, { xp: number; cry: number }> = {
  daily_warmup: { xp: 35, cry: 15 },
  daily_backlog_paper: { xp: 40, cry: 18 },
  weekly_balanced_trio: { xp: 85, cry: 36 },
  weekly_syllabus_climber: { xp: 70, cry: 30 },
};

function computeStreakFromLogs(
  dailyLogs: Record<string, DayCompletionLog>,
  now: Date = new Date(),
): { streakDays: number; lastStudyDateISO: string } {
  const activeDates = Object.values(dailyLogs)
    .filter((l) => l.completedSlotIds.length > 0 || l.completedMinutes > 0)
    .map((l) => l.dateISO)
    .sort();

  if (activeDates.length === 0) {
    return { streakDays: 0, lastStudyDateISO: '' };
  }

  const activeSet = new Set(activeDates);
  const lastStudyDateISO = activeDates[activeDates.length - 1];
  const todayISO = getTodayISO(now);
  const yesterdayISO = addDaysISO(todayISO, -1);

  // Streak is live if user studied today or yesterday; otherwise compute streak ending at lastStudyDateISO only if recent
  let anchor: string | null = null;
  if (activeSet.has(todayISO)) anchor = todayISO;
  else if (activeSet.has(yesterdayISO)) anchor = yesterdayISO;

  if (!anchor) {
    return { streakDays: 0, lastStudyDateISO };
  }

  let streakDays = 0;
  let cursor = anchor;
  while (activeSet.has(cursor)) {
    streakDays += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return { streakDays, lastStudyDateISO };
}

export function recalculateProgressionFromHistory(params: {
  slots: TimetableSlot[];
  tasks: StudyTask[];
  missedItems: MissedLessonItem[];
  papers: PaperEntry[];
  dailyLogs: Record<string, DayCompletionLog>;
  unitCoveredMap: Record<string, boolean>;
  previous?: ProgressionState;
  nowMs?: number;
}): { next: ProgressionState; summary: RecalculationSummary } {
  const nowMs = params.nowMs ?? Date.now();
  const base = params.previous
    ? {
        ...createDefaultProgressionState(),
        ...params.previous,
        unlockedAbilities: params.previous.unlockedAbilities ?? {},
        checkIns: params.previous.checkIns ?? {},
        claimedBounties: params.previous.claimedBounties ?? {},
        history: Array.isArray(params.previous.history) ? params.previous.history : [],
      }
    : createDefaultProgressionState();

  const slotMap = new Map(params.slots.map((s) => [s.id, s]));
  const prevEntities = base.rewardedEntities ?? {};
  const nextEntities: Record<string, { xp: number; cry: number }> = {};

  let totalXp = 0;
  let totalCry = 0;

  let selfStudySlots = 0;
  let recordingSlots = 0;
  let classSlots = 0;
  let partialSlots = 0;
  let tasksCount = 0;
  let checklistsCount = 0;
  let missedCount = 0;
  let papersCount = 0;
  let unitsCount = 0;

  const completedLinkedTaskIds = new Set<string>();
  const completedLinkedMissedIds = new Set<string>();

  const recordEntity = (key: string, xp: number, cry: number) => {
    // Preserve 2x Focus Rush credit if an existing entity already earned double XP
    const existing = prevEntities[key];
    const finalXp = existing && existing.xp > xp && existing.xp <= xp * 2 + 5 ? existing.xp : xp;
    const finalCry = existing && existing.cry > cry ? existing.cry : cry;
    nextEntities[key] = { xp: finalXp, cry: finalCry };
    totalXp += finalXp;
    totalCry += finalCry;
  };

  // 1. Completed & Partial Timetable Slots across all historical dailyLogs
  const sortedDates = Object.keys(params.dailyLogs).sort();
  for (const dateISO of sortedDates) {
    const log = params.dailyLogs[dateISO];
    if (!log) continue;

    for (const slotId of log.completedSlotIds ?? []) {
      const slot = slotMap.get(slotId);
      const entityKey = `slot:${dateISO}::${slotId}`;
      if (slot) {
        const reward = computeSlotReward(slot, params.missedItems);
        recordEntity(entityKey, reward.xp, reward.cry);
        if (reward.activityKind === 'class') classSlots += 1;
        else if (reward.activityKind === 'recording') recordingSlots += 1;
        else selfStudySlots += 1;

        if (slot.linkedTaskId) completedLinkedTaskIds.add(slot.linkedTaskId);
        if (slot.linkedMissedId) completedLinkedMissedIds.add(slot.linkedMissedId);
      } else {
        // Fallback for a historical one-off slot deleted after completion
        recordEntity(entityKey, 45, 18);
        selfStudySlots += 1;
      }
    }

    for (const slotId of log.incompleteSlotIds ?? []) {
      if ((log.completedSlotIds ?? []).includes(slotId)) continue;
      const loggedMins = log.loggedMinutesBySlot?.[slotId] ?? 0;
      if (loggedMins <= 0) continue;
      const slot = slotMap.get(slotId);
      const dur = slot ? Math.max(15, getDurationMinutes(slot.startTime, slot.endTime)) : 60;
      const full = slot ? computeSlotReward(slot, params.missedItems) : { xp: 45, cry: 18 };
      const ratio = Math.min(0.95, Math.max(0.15, loggedMins / dur));
      const partXp = Math.max(8, Math.round(full.xp * ratio));
      const partCry = Math.max(3, Math.round(full.cry * ratio));
      recordEntity(`partial:${dateISO}::${slotId}`, partXp, partCry);
      partialSlots += 1;
    }
  }

  // 2. Planner Tasks & Checklist sub-steps
  for (const task of params.tasks) {
    for (const item of task.checklist ?? []) {
      if (item.done) {
        recordEntity(
          `chk:${task.id}:${item.id}`,
          XP_VALUES.checklistSubItem,
          CRYSTAL_VALUES.checklistSubItem,
        );
        checklistsCount += 1;
      }
    }
    if (task.status === 'completed') {
      const alreadySlotRewarded = completedLinkedTaskIds.has(task.id);
      const r = computeTaskReward(task, { alreadySlotRewarded });
      recordEntity(`task:${task.id}`, r.xp, r.cry);
      tasksCount += 1;
    }
  }

  // 3. Missed Backlog Items covered
  for (const m of params.missedItems) {
    if (m.status === 'covered') {
      const alreadySlotRewarded = completedLinkedMissedIds.has(m.id);
      const r = computeMissedItemReward(m, { alreadySlotRewarded });
      recordEntity(`missed:${m.id}`, r.xp, r.cry);
      missedCount += 1;
    }
  }

  // 4. Past Papers logged & reviewed
  for (const p of params.papers) {
    const logR = computePaperLogReward(p);
    recordEntity(`paperlog:${p.id}`, logR.xp, logR.cry);
    papersCount += 1;

    if (p.reviewStatus === 'reviewed') {
      const existingRev = prevEntities[`review:${p.id}`];
      const hadFastChain = Boolean(existingRev && existingRev.xp >= 60);
      const revR = computePaperReviewReward(hadFastChain);
      recordEntity(`review:${p.id}`, revR.xp, revR.cry);
    }
  }

  // 5. Syllabus Units mastered
  for (const [unitId, covered] of Object.entries(params.unitCoveredMap)) {
    if (covered) {
      recordEntity(`unit:${unitId}`, XP_VALUES.unitCovered, CRYSTAL_VALUES.unitCovered);
      unitsCount += 1;
    }
  }

  // 6. Preserve claimed bounties & existing COC check-in penalties (no phantom historical penalties)
  let bountyXp = 0;
  let bountyCry = 0;
  for (const bId of Object.keys(base.claimedBounties ?? {})) {
    const bSpec = BOUNTY_REWARD_MAP[bId];
    if (bSpec) {
      bountyXp += bSpec.xp;
      bountyCry += bSpec.cry;
    }
  }

  let penaltyXp = 0;
  for (const ci of Object.values(base.checkIns ?? {})) {
    if (
      ci.outcome === 'missed-rescued' ||
      ci.outcome === 'missed-dropped' ||
      ci.outcome === 'failed-locked'
    ) {
      penaltyXp += ci.xpDelta; // negative
    }
  }

  const lifetimeXpEarned = totalXp + bountyXp;
  const finalXp = Math.max(0, lifetimeXpEarned + penaltyXp);
  const targetLeagueSpec = computeRawLeagueFromXp(finalXp);
  const highestOrder = Math.max(
    targetLeagueSpec.order,
    getLeagueOrder(base.highestLeagueReached),
  );
  const highestLeagueReached = LEAGUES[highestOrder]?.id ?? targetLeagueSpec.id;

  // Award starter (30) + league promotion bonuses (45 per league tier reached) + activity/bounty crystals minus spent ability & Vault object costs
  const promoCry = targetLeagueSpec.order * CRYSTAL_VALUES.leaguePromoBonus;
  const spentOnAbilities = Object.entries(base.unlockedAbilities ?? {}).reduce((acc, [id, on]) => {
    if (!on) return acc;
    const spec = ABILITIES.find((a) => a.id === id);
    return acc + (spec?.unlockCostCrystals ?? 0);
  }, 0);
  const spentOnArtifacts = Object.entries(base.ownedArtifacts ?? {}).reduce((acc, [id, on]) => {
    if (!on) return acc;
    const spec = VAULT_ARTIFACTS.find((a) => a.id === id);
    return acc + (spec?.costCrystals ?? 0);
  }, 0);
  const spentOnRings = Object.entries(base.ownedRingSkins ?? {}).reduce((acc, [id, on]) => {
    if (!on || id === 'classic') return acc;
    const spec = RING_SKINS.find((r) => r.id === id);
    return acc + (spec?.costCrystals ?? 0);
  }, 0);
  const spentOnFrames = Object.entries(base.ownedCrestFrames ?? {}).reduce((acc, [id, on]) => {
    if (!on || id === 'none') return acc;
    const spec = CREST_FRAMES.find((f) => f.id === id);
    return acc + (spec?.costCrystals ?? 0);
  }, 0);
  const totalSpent = spentOnAbilities + spentOnArtifacts + spentOnRings + spentOnFrames;
  const computedCrystals = Math.max(
    0,
    30 + totalCry + bountyCry + promoCry - totalSpent,
  );
  const finalCrystals = params.previous
    ? Math.max(base.crystals, computedCrystals)
    : computedCrystals;

  const { streakDays, lastStudyDateISO } = computeStreakFromLogs(params.dailyLogs, new Date(nowMs));

  const deltaFromPreviousXp = finalXp - (params.previous?.xp ?? 0);

  const summary: RecalculationSummary = {
    totalXp: finalXp,
    totalCrystals: finalCrystals,
    league: targetLeagueSpec,
    selfStudySlots,
    recordingSlots,
    classSlots,
    partialSlots,
    tasks: tasksCount,
    checklists: checklistsCount,
    missed: missedCount,
    papers: papersCount,
    units: unitsCount,
    deltaFromPreviousXp,
  };

  const parts: string[] = [];
  if (selfStudySlots > 0) parts.push(`${selfStudySlots} study`);
  if (classSlots > 0) parts.push(`${classSlots} class`);
  if (recordingSlots > 0) parts.push(`${recordingSlots} rec`);
  if (tasksCount > 0) parts.push(`${tasksCount} tasks`);
  if (papersCount > 0) parts.push(`${papersCount} papers`);
  if (unitsCount > 0) parts.push(`${unitsCount} units`);

  const syncLog: ProgressLogEntry | null =
    finalXp > 0 || parts.length > 0
      ? {
          id: `xp-recalc-${nowMs}`,
          timestampMs: nowMs,
          deltaXp: params.previous ? deltaFromPreviousXp : finalXp,
          deltaCrystals: params.previous ? Math.max(0, finalCrystals - base.crystals) : finalCrystals,
          label:
            parts.length > 0
              ? `Synced History (${parts.slice(0, 4).join(', ')})`
              : 'Synced Historical XP Curve',
          tone: 'gain',
        }
      : null;

  const next: ProgressionState = {
    ...base,
    xp: finalXp,
    lifetimeXpEarned,
    crystals: finalCrystals,
    currentLeague: targetLeagueSpec.id,
    highestLeagueReached,
    zenithSeasonMondayISO:
      targetLeagueSpec.id === 'zenith'
        ? base.zenithSeasonMondayISO ?? getMondayISOForDate(getTodayISO(new Date(nowMs)))
        : undefined,
    zenithBestXp:
      targetLeagueSpec.id === 'zenith'
        ? Math.max(base.zenithBestXp ?? ZENITH_FLOOR_XP, finalXp)
        : base.zenithBestXp,
    streakDays: Math.max(base.streakDays, streakDays),
    lastStudyDateISO: lastStudyDateISO || base.lastStudyDateISO,
    rewardedEntities: nextEntities,
    xpRulesVersion: XP_RULES_VERSION,
    history: syncLog ? [syncLog, ...base.history.filter((h) => !h.id.startsWith('xp-recalc-'))].slice(0, 40) : base.history,
  };

  return { next, summary };
}

/* =====================================================================
 * DAILY & WEEKLY ARENA BOUNTIES
 * ===================================================================== */

export interface ArenaBountyItem {
  id: string;
  cadence: 'daily' | 'weekly';
  periodKey: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardXp: number;
  rewardCrystals: number;
  claimed: boolean;
  readyToClaim: boolean;
}

export function evaluateArenaBounties(params: {
  progression: ProgressionState;
  slots: TimetableSlot[];
  tasks: StudyTask[];
  missedItems: MissedLessonItem[];
  papers: PaperEntry[];
  dailyLogs: Record<string, DayCompletionLog>;
  unitCoveredMap: Record<string, boolean>;
  fridayAnchor?: FridayAnchor;
  fridayOverrides?: FridayWeekOverrides;
  now?: Date;
}): ArenaBountyItem[] {
  const now = params.now ?? new Date();
  const todayISO = getTodayISO(now);
  const mondayISO = getMondayISOForDate(todayISO);
  const weekDays = getWeekDaysForOffset(0, now);
  const claimedMap = params.progression.claimedBounties ?? {};

  const todayDoneSlots = params.dailyLogs[todayISO]?.completedSlotIds.length ?? 0;
  const rewardedKeys = Object.keys(params.progression.rewardedEntities ?? {});
  const tasksDoneCount = params.tasks.filter((t) => t.status === 'completed').length;
  const checklistDoneCount = params.tasks.reduce(
    (acc, t) => acc + t.checklist.filter((c) => c.done).length,
    0,
  );
  const coveredUnitsCount = Object.values(params.unitCoveredMap).filter(Boolean).length;
  const coveredMissedCount = params.missedItems.filter((m) => m.status === 'covered').length;
  const reviewedPapersCount = params.papers.filter((p) => p.reviewStatus === 'reviewed').length;

  const warmupProgress = Math.min(2, todayDoneSlots + (tasksDoneCount > 0 && todayDoneSlots === 0 ? 1 : 0));

  const rescueCount = Object.values(params.progression.checkIns).filter(
    (c) => c.dateISO === todayISO && c.outcome === 'completed' && c.slotId.startsWith('slot-rescue-'),
  ).length;
  const terminatorProgress = Math.min(1, coveredMissedCount + reviewedPapersCount + rescueCount);

  const subjectsDoneThisWeek = new Set<SubjectId>();
  for (const wd of weekDays) {
    const doneIds = params.dailyLogs[wd.dateISO]?.completedSlotIds ?? [];
    for (const sid of doneIds) {
      const sl = params.slots.find((s) => s.id === sid);
      if (sl) subjectsDoneThisWeek.add(sl.subject);
    }
  }
  if (subjectsDoneThisWeek.size < 3) {
    for (const t of params.tasks) {
      if (t.status === 'completed') subjectsDoneThisWeek.add(t.subject);
    }
  }
  const trioProgress = Math.min(3, subjectsDoneThisWeek.size);

  const climberUnitsOrSteps = Math.min(
    4,
    coveredUnitsCount * 4 + checklistDoneCount + (rewardedKeys.length >= 4 ? 1 : 0),
  );

  const specs: Array<Omit<ArenaBountyItem, 'claimed' | 'readyToClaim'>> = [
    {
      id: 'daily_warmup',
      cadence: 'daily',
      periodKey: todayISO,
      title: 'Daily Momentum Warm-Up',
      description: 'Tick off 2 timetable slots (or 1 slot + 1 planner task) today.',
      progress: warmupProgress,
      target: 2,
      rewardXp: 35,
      rewardCrystals: 15,
    },
    {
      id: 'daily_backlog_paper',
      cadence: 'daily',
      periodKey: todayISO,
      title: 'Backlog & Paper Sharp',
      description: 'Clear 1 Missed backlog item, review 1 Past Paper, or complete a Rescue slot.',
      progress: terminatorProgress,
      target: 1,
      rewardXp: 40,
      rewardCrystals: 18,
    },
    {
      id: 'weekly_balanced_trio',
      cadence: 'weekly',
      periodKey: mondayISO,
      title: 'Balanced Trio (Bio · Phy · Chem)',
      description: 'Complete at least 1 slot or task in all 3 A/L subjects this week.',
      progress: trioProgress,
      target: 3,
      rewardXp: 85,
      rewardCrystals: 36,
    },
    {
      id: 'weekly_syllabus_climber',
      cadence: 'weekly',
      periodKey: mondayISO,
      title: 'Checklist & Syllabus Climber',
      description: 'Master 1 full Syllabus Unit or tick off 4 Planner checklist sub-steps.',
      progress: climberUnitsOrSteps,
      target: 4,
      rewardXp: 70,
      rewardCrystals: 30,
    },
  ];

  return specs.map((b) => {
    const claimed = claimedMap[b.id] === b.periodKey;
    return {
      ...b,
      claimed,
      readyToClaim: !claimed && b.progress >= b.target,
    };
  });
}

/* =====================================================================
 * PROGRESSION-LOCKED APPEARANCE STUDIO CATALOG
 * ===================================================================== */

export const ACCENT_PRESETS: Array<{
  id: AccentPresetId;
  label: string;
  requiredLeague: LeagueId;
  swatchClass: string;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
}> = [
  { id: 'arctic', label: 'Arctic', requiredLeague: 'bronze', swatchClass: 'bg-blue-600', primaryHex: '#2563EB', secondaryHex: '#22D3EE', glowRgba: 'rgba(37,99,235,0.42)' },
  { id: 'cyan', label: 'Frost Cyan', requiredLeague: 'bronze', swatchClass: 'bg-cyan-500', primaryHex: '#06B6D4', secondaryHex: '#38BDF8', glowRgba: 'rgba(6,182,212,0.45)' },
  { id: 'emerald', label: 'Bio Emerald', requiredLeague: 'silver', swatchClass: 'bg-emerald-500', primaryHex: '#10B981', secondaryHex: '#2DD4BF', glowRgba: 'rgba(16,185,129,0.45)' },
  { id: 'cobalt', label: 'Deep Cobalt', requiredLeague: 'silver', swatchClass: 'bg-sky-600', primaryHex: '#0284C7', secondaryHex: '#3B82F6', glowRgba: 'rgba(2,132,199,0.45)' },
  { id: 'violet', label: 'Plasma', requiredLeague: 'gold', swatchClass: 'bg-violet-500', primaryHex: '#8B5CF6', secondaryHex: '#38BDF8', glowRgba: 'rgba(139,92,246,0.48)' },
  { id: 'holo', label: 'Holo Prism', requiredLeague: 'diamond', swatchClass: 'bg-gradient-to-tr from-cyan-400 to-violet-500', primaryHex: '#22D3EE', secondaryHex: '#A855F7', glowRgba: 'rgba(34,211,238,0.52)' },
  { id: 'solar-gold', label: 'Apex Gold', requiredLeague: 'apex', swatchClass: 'bg-gradient-to-tr from-amber-400 to-cyan-400', primaryHex: '#F59E0B', secondaryHex: '#22D3EE', glowRgba: 'rgba(245,158,11,0.52)' },
];

export const SUBJECT_PALETTES: Array<{
  id: SubjectPaletteId;
  label: string;
  requiredLeague: LeagueId;
  desc: string;
}> = [
  { id: 'classic', label: 'Classic Lab', requiredLeague: 'bronze', desc: 'Emerald Bio · Orange Phy · Violet Chem' },
  { id: 'neon-frost', label: 'Neon Frost', requiredLeague: 'gold', desc: 'Bright cyan-infused high-glow borders' },
  { id: 'pastel-prism', label: 'Pastel Prism', requiredLeague: 'platinum', desc: 'Soft iridescent crystalline wash' },
  { id: 'vivid-lab', label: 'Apex Vivid', requiredLeague: 'apex', desc: 'Saturated high-contrast luminous glass' },
];

export const AURORA_THEMES: Array<{
  id: AuroraThemeId;
  label: string;
  requiredLeague: LeagueId;
  lightBg: string;
  darkBg: string;
  orb1: string;
  orb2: string;
}> = [
  {
    id: 'sapphire',
    label: 'Arctic Sapphire',
    requiredLeague: 'bronze',
    lightBg: '#CFE3FF',
    darkBg: '#02071A',
    orb1: 'rgba(37,99,235,0.44)',
    orb2: 'rgba(34,211,238,0.38)',
  },
  {
    id: 'polar-dawn',
    label: 'Polar Dawn',
    requiredLeague: 'platinum',
    lightBg: '#D8ECFF',
    darkBg: '#06112E',
    orb1: 'rgba(14,165,233,0.46)',
    orb2: 'rgba(167,139,250,0.34)',
  },
  {
    id: 'bio-reef',
    label: 'Bioluminescent',
    requiredLeague: 'platinum',
    lightBg: '#CCF5EE',
    darkBg: '#02181E',
    orb1: 'rgba(16,185,129,0.42)',
    orb2: 'rgba(34,211,238,0.42)',
  },
  {
    id: 'midnight-violet',
    label: 'Plasma Dusk',
    requiredLeague: 'platinum',
    lightBg: '#DCE4FF',
    darkBg: '#090624',
    orb1: 'rgba(124,58,237,0.42)',
    orb2: 'rgba(56,189,248,0.38)',
  },
  {
    id: 'cyber-holo',
    label: 'Cyber Holo',
    requiredLeague: 'diamond',
    lightBg: '#CCF0FF',
    darkBg: '#020E24',
    orb1: 'rgba(6,182,212,0.52)',
    orb2: 'rgba(168,85,247,0.40)',
  },
  {
    id: 'liquid-chrome',
    label: 'Liquid Chrome',
    requiredLeague: 'diamond',
    lightBg: '#E2ECFA',
    darkBg: '#050C1C',
    orb1: 'rgba(148,163,184,0.48)',
    orb2: 'rgba(56,189,248,0.40)',
  },
  {
    id: 'abyssal-gold',
    label: 'Abyssal Gold',
    requiredLeague: 'apex',
    lightBg: '#DFEAFF',
    darkBg: '#04091E',
    orb1: 'rgba(245,158,11,0.38)',
    orb2: 'rgba(34,211,238,0.48)',
  },
  {
    id: 'custom',
    label: 'Theme Forge',
    requiredLeague: 'apex',
    lightBg: '#CFE3FF',
    darkBg: '#020B24',
    orb1: 'rgba(37,99,235,0.45)',
    orb2: 'rgba(34,211,238,0.42)',
  },
];

export const PARTICLE_MODES: Array<{
  id: LiveParticlesMode;
  label: string;
  requiredLeague: LeagueId;
}> = [
  { id: 'off', label: 'Off', requiredLeague: 'bronze' },
  { id: 'crystals', label: 'Ice Crystals', requiredLeague: 'diamond' },
  { id: 'sparks', label: 'Bio Sparks', requiredLeague: 'apex' },
  { id: 'stardust', label: 'Apex Stardust', requiredLeague: 'apex' },
];

export function resolveEffectiveStudio(
  studio: AppearanceStudioConfig,
  currentLeague: LeagueId,
  progression?: ProgressionState,
): AppearanceStudioConfig {
  const acc = ACCENT_PRESETS.find((a) => a.id === studio.accentPreset);
  const pal = SUBJECT_PALETTES.find((p) => p.id === studio.subjectPalette);
  const aur = AURORA_THEMES.find((a) => a.id === studio.auroraTheme);
  const part = PARTICLE_MODES.find((p) => p.id === studio.liveParticles);

  const ownedRings = progression?.ownedRingSkins ?? { classic: true };
  const ownedFrames = progression?.ownedCrestFrames ?? { none: true };
  const desiredRing = studio.ringSkin ?? 'classic';
  const desiredFrame = studio.crestFrame ?? 'none';

  return {
    ...studio,
    accentPreset:
      acc && isLeagueAtLeast(currentLeague, acc.requiredLeague)
        ? studio.accentPreset
        : 'arctic',
    customTitle: isLeagueAtLeast(currentLeague, 'silver') ? studio.customTitle : '',
    subjectPalette:
      pal && isLeagueAtLeast(currentLeague, pal.requiredLeague)
        ? studio.subjectPalette
        : 'classic',
    auroraTheme:
      aur && isLeagueAtLeast(currentLeague, aur.requiredLeague)
        ? studio.auroraTheme
        : 'sapphire',
    prismBorders: isLeagueAtLeast(currentLeague, 'diamond') ? studio.prismBorders : false,
    liveParticles:
      part && isLeagueAtLeast(currentLeague, part.requiredLeague)
        ? studio.liveParticles
        : 'off',
    completionFx: isLeagueAtLeast(currentLeague, 'diamond')
      ? studio.completionFx
      : 'ripple',
    ringSkin: desiredRing === 'classic' || ownedRings[desiredRing] ? desiredRing : 'classic',
    crestFrame: desiredFrame === 'none' || ownedFrames[desiredFrame] ? desiredFrame : 'none',
  };
}

/* =====================================================================
 * SCHOLAR VAULT — COLLECTIBLE OBJECTS, RING SKINS & TACTICAL GEAR
 * ===================================================================== */

export interface VaultArtifactSpec {
  id: VaultArtifactId;
  name: string;
  category: 'Biology' | 'Physics' | 'Chemistry' | 'Exam' | 'Crown';
  description: string;
  costCrystals: number;
  requiredLeague: LeagueId;
  accentHex: string;
}

export const VAULT_ARTIFACTS: VaultArtifactSpec[] = [
  {
    id: 'dna_helix',
    name: 'Sapphire DNA Helix',
    category: 'Biology',
    description: 'Crystalline double-helix desk specimen. Part of the Scholar Trio (+10%💎 bonus).',
    costCrystals: 85,
    requiredLeague: 'silver',
    accentHex: '#10B981',
  },
  {
    id: 'quantum_pendulum',
    name: 'Quantum Chronometer',
    category: 'Physics',
    description: 'Precision brass-sapphire pendulum relic. Part of the Scholar Trio (+10%💎 bonus).',
    costCrystals: 85,
    requiredLeague: 'silver',
    accentHex: '#F97316',
  },
  {
    id: 'alchemist_flask',
    name: "Alchemist's Flask",
    category: 'Chemistry',
    description: 'Luminous reaction vessel for deep focus. Completes the Scholar Trio (+10%💎 bonus).',
    costCrystals: 85,
    requiredLeague: 'gold',
    accentHex: '#8B5CF6',
  },
  {
    id: 'astrolabe_compass',
    name: 'Exam Astrolabe',
    category: 'Exam',
    description: 'Celestial brass dial calibrated toward your 2027 A/L exam horizon.',
    costCrystals: 140,
    requiredLeague: 'platinum',
    accentHex: '#38BDF8',
  },
  {
    id: 'zenith_crown_relic',
    name: 'Zenith Obsidian Crown',
    category: 'Crown',
    description: 'Exclusive sovereign monolith forged only for scholars who cross 5,000 XP.',
    costCrystals: 240,
    requiredLeague: 'zenith',
    accentHex: '#FBBF24',
  },
];

export interface RingSkinSpec {
  id: RingSkinId;
  name: string;
  description: string;
  costCrystals: number;
  stop1: string;
  stop2: string;
  stop3: string;
  dashed?: boolean;
}

export const RING_SKINS: RingSkinSpec[] = [
  {
    id: 'classic',
    name: 'Accent Flow',
    description: 'Follows your selected Appearance Studio Accent Glow.',
    costCrystals: 0,
    stop1: '#2563EB',
    stop2: '#22D3EE',
    stop3: '#34D399',
  },
  {
    id: 'cryo',
    name: 'Cryo Crystal Ring',
    description: 'Faceted arctic-cyan segmented precision arc on your Home gauge.',
    costCrystals: 70,
    stop1: '#06B6D4',
    stop2: '#67E8F9',
    stop3: '#E0F2FE',
    dashed: true,
  },
  {
    id: 'solar',
    name: 'Solar Corona Ring',
    description: 'Molten gold-emerald energy arc for high-output weeks.',
    costCrystals: 110,
    stop1: '#F59E0B',
    stop2: '#FB923C',
    stop3: '#34D399',
  },
  {
    id: 'prism',
    name: 'Prismatic Orbit',
    description: 'Tri-spectrum violet, cyan & gold orbit around your completion %.',
    costCrystals: 150,
    stop1: '#A855F7',
    stop2: '#22D3EE',
    stop3: '#FBBF24',
    dashed: true,
  },
];

export interface CrestFrameSpec {
  id: CrestFrameId;
  name: string;
  description: string;
  costCrystals: number;
  requiredLeague: LeagueId;
}

export const CREST_FRAMES: CrestFrameSpec[] = [
  {
    id: 'none',
    name: 'Clean Emblem',
    description: 'Standard unframed League crest.',
    costCrystals: 0,
    requiredLeague: 'bronze',
  },
  {
    id: 'titanium_halo',
    name: 'Titanium Halo',
    description: 'Crisp orbital ring framing your League crest across Arena & Home.',
    costCrystals: 75,
    requiredLeague: 'silver',
  },
  {
    id: 'diamond_laurel',
    name: 'Diamond Laurel',
    description: 'Twin crystalline scholar laurels cradling your rank badge.',
    costCrystals: 130,
    requiredLeague: 'gold',
  },
  {
    id: 'zenith_wings',
    name: 'Zenith Crown Wings',
    description: 'Golden-sapphire sovereign wings framing your crest everywhere.',
    costCrystals: 210,
    requiredLeague: 'diamond',
  },
];

export interface TacticalGearSpec {
  id: 'pardon_scroll' | 'scholar_hourglass';
  name: string;
  tagline: string;
  description: string;
  costCrystals: number;
  maxCharges: number;
}

export const TACTICAL_GEAR: TacticalGearSpec[] = [
  {
    id: 'pardon_scroll',
    name: 'Pardon Scroll',
    tagline: 'Zero-penalty miss waiver',
    description: 'Use during any missed check-in to excuse an unavoidable delay with 0 XP lost (max 2).',
    costCrystals: 45,
    maxCharges: 2,
  },
  {
    id: 'scholar_hourglass',
    name: 'Scholar Hourglass',
    tagline: 'Instant +2× Rush + 25 XP',
    description: 'Ignites a 90m 2× Focus Rush immediately with an instant +25 XP spark (max 3).',
    costCrystals: 40,
    maxCharges: 3,
  },
];
