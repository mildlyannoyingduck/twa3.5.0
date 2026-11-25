import {
  Activity,
  ArrowLeft,
  Award,
  BookCheck,
  Check,
  Compass,
  Crown,
  Flame,
  Gem,
  History,
  Hourglass,
  Lock,
  RefreshCw,
  ScrollText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import {
  AbilityId,
  AppearanceStudioConfig,
  CrestFrameId,
  DayCompletionLog,
  FridayAnchor,
  FridayWeekOverrides,
  MissedLessonItem,
  PaperEntry,
  ProgressionState,
  RingSkinId,
  StudyTask,
  TimetableSlot,
  VaultArtifactId,
} from '../types';
import { haptics } from '../utils/haptics';
import {
  ABILITIES,
  ArenaBountyItem,
  computeProgressiveSelfStudyXp,
  CREST_FRAMES,
  CRYSTAL_VALUES,
  crystalsFromXp,
  evaluateArenaBounties,
  getDivisionInfo,
  getLeagueSpec,
  hasArtifactTrioBonus,
  isAbilityActive,
  isFocusRushActive,
  isLeagueAtLeast,
  LEAGUES,
  RecalculationSummary,
  RING_SKINS,
  TACTICAL_GEAR,
  VAULT_ARTIFACTS,
  XP_VALUES,
  ZENITH_FLOOR_XP,
} from '../utils/progressionEngine';
import { LEAGUE_AURA_STYLE, LeagueCrest } from './LeagueCrest';
import { VaultObjectArt } from './VaultObjectArt';

type ArenaTab = 'road' | 'powers' | 'vault' | 'bounties' | 'log';
type LogFilter = 'all' | 'gain' | 'penalty' | 'other';

interface XPArenaOverlayProps {
  open: boolean;
  progression: ProgressionState;
  studio?: AppearanceStudioConfig;
  slots: TimetableSlot[];
  tasks: StudyTask[];
  missedItems: MissedLessonItem[];
  papers: PaperEntry[];
  dailyLogs: Record<string, DayCompletionLog>;
  unitCoveredMap: Record<string, boolean>;
  fridayAnchor?: FridayAnchor;
  fridayOverrides?: FridayWeekOverrides;
  activeMissedCount: number;
  onUnlockAbility: (abilityId: AbilityId) => void;
  onBuyCharge: (abilityId: 'streak_shield' | 'focus_rush') => void;
  onBuyVaultArtifact?: (artifactId: VaultArtifactId) => void;
  onEquipVaultArtifact?: (artifactId: VaultArtifactId | null) => void;
  onBuyRingSkin?: (skinId: RingSkinId) => void;
  onBuyCrestFrame?: (frameId: CrestFrameId) => void;
  onBuyTacticalGear?: (gearId: 'pardon_scroll' | 'scholar_hourglass') => void;
  onUseScholarHourglass?: () => void;
  onOpenFocusRush: () => void;
  onRunSmartGapFiller: () => { addedCount: number; message: string };
  onOpenWeeklyFocusSuggest: () => void;
  onClaimBounty: (bounty: ArenaBountyItem) => void;
  onRecalculateHistoryXp?: () => RecalculationSummary;
  onClose: () => void;
}

const ABILITY_ICONS: Record<AbilityId, typeof Shield> = {
  streak_shield: Shield,
  focus_rush: Zap,
  smart_gap_filler: Wand2,
  subject_balance_radar: Activity,
  focus_soundscapes: Volume2,
  review_chain_radar: Sparkles,
  exam_readiness_index: Award,
};

function formatHistoryTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const XPArenaOverlay = memo(function XPArenaOverlay({
  open,
  progression,
  studio,
  slots,
  tasks,
  missedItems,
  papers,
  dailyLogs,
  unitCoveredMap,
  fridayAnchor,
  fridayOverrides,
  activeMissedCount,
  onUnlockAbility,
  onBuyCharge,
  onBuyVaultArtifact,
  onEquipVaultArtifact,
  onBuyRingSkin,
  onBuyCrestFrame,
  onBuyTacticalGear,
  onUseScholarHourglass,
  onOpenFocusRush,
  onRunSmartGapFiller,
  onOpenWeeklyFocusSuggest,
  onClaimBounty,
  onRecalculateHistoryXp,
  onClose,
}: XPArenaOverlayProps) {
  const [arenaTab, setArenaTab] = useState<ArenaTab>('road');
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const nowMs = Date.now();
  const divInfo = getDivisionInfo(progression.xp, progression.currentLeague);
  const aura = LEAGUE_AURA_STYLE[progression.currentLeague];
  const activeFrame = studio?.crestFrame ?? 'none';
  const trioActive = hasArtifactTrioBonus(progression);
  const zenithSurplus = Math.max(0, progression.xp - ZENITH_FLOOR_XP);
  const projectedZenithCrystals = Math.max(25, 25 + Math.round((zenithSurplus / 100) * 15));
  const dowToday = new Date(nowMs).getDay(); // 0=Sun..6=Sat
  const daysToMonday = dowToday === 1 ? 7 : (8 - dowToday) % 7 || 7;
  const shieldHoursLeft =
    progression.promoShieldUntilMs > nowMs
      ? Math.max(1, Math.ceil((progression.promoShieldUntilMs - nowMs) / 3600000))
      : 0;
  const rushActive = isFocusRushActive(progression, nowMs);
  const rushMinsLeft = rushActive
    ? Math.max(1, Math.ceil((progression.focusRushUntilMs - nowMs) / 60000))
    : 0;

  const bounties = useMemo(
    () =>
      evaluateArenaBounties({
        progression,
        slots,
        tasks,
        missedItems,
        papers,
        dailyLogs,
        unitCoveredMap,
        fridayAnchor,
        fridayOverrides,
      }),
    [progression, slots, tasks, missedItems, papers, dailyLogs, unitCoveredMap, fridayAnchor, fridayOverrides],
  );

  const claimableCount = bounties.filter((b) => b.readyToClaim).length;

  const filteredHistory = useMemo(() => {
    return progression.history.filter((h) => {
      if (logFilter === 'gain') return h.deltaXp > 0 && h.tone !== 'bounty';
      if (logFilter === 'penalty') return h.deltaXp < 0 || h.tone === 'penalty';
      if (logFilter === 'other') return h.tone === 'shop' || h.tone === 'bounty' || h.tone === 'reversal';
      return true;
    });
  }, [progression.history, logFilter]);

  if (!open) return null;

  const pushToast = (msg: string) => {
    setActionToast(msg);
    window.setTimeout(() => {
      setActionToast((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kithnuka XP Arena"
      className="fixed inset-0 z-[72] overflow-y-auto bg-[#CFE3FF]/94 text-[#07142B] backdrop-blur-xl dark:bg-[#02071A]/94 dark:text-white"
    >
      {/* Ambient Arena Halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden [transform:translateZ(0)]"
      >
        <div className="arctic-grid-bg absolute inset-0 opacity-75" />
        <div
          className="absolute left-1/2 top-[-120px] h-[420px] w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-2xl"
          style={{
            background: `radial-gradient(circle, ${divInfo.league.glowRgba} 0%, rgba(37,99,235,0) 70%)`,
          }}
        />
      </div>

      {/* Sticky Arena Header */}
      <header className="ios-glass-topbar sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              onClose();
            }}
            className="ios-glass-control inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#07142B] transition-transform active:scale-95 dark:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <LeagueCrest
              league={progression.currentLeague}
              division={divInfo.division}
              frame={activeFrame}
              size="xs"
            />
            <span className="font-brand truncate text-sm font-bold tracking-tight text-[#07142B] dark:text-white sm:text-base">
              Kithnuka&apos;s XP Arena
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="ios-glass-control flex items-center gap-1 rounded-full px-2.5 py-1">
              <Gem className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-300" />
              <span className="tabular-nums text-xs font-bold">{progression.crystals}</span>
            </div>
            <div className="ios-glass-control flex items-center gap-1 rounded-full px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="tabular-nums text-xs font-bold">{progression.streakDays}d</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-3.5 pb-16 pt-4 sm:px-6">
        {/* Hero Rank Stage Card */}
        <section
          className={`ios-glass-hero relative overflow-hidden rounded-[32px] border p-5 sm:p-6 ${aura.ringBorder} ${aura.glowShadow}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <LeagueCrest
                league={progression.currentLeague}
                division={divInfo.division}
                frame={activeFrame}
                size="xl"
                showDivision
                withAura
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm ${aura.pillBg}`}
                  >
                    {divInfo.league.shortName} · Div {divInfo.roman}
                  </span>
                  {progression.equippedArtifact && (
                    <span className="ios-glass-control inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#07142B] dark:text-sky-100">
                      <VaultObjectArt artifactId={progression.equippedArtifact} size="xs" />
                      <span>
                        {VAULT_ARTIFACTS.find((a) => a.id === progression.equippedArtifact)?.name}
                      </span>
                    </span>
                  )}
                  {rushActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Zap className="h-3 w-3" />
                      2× Rush ({rushMinsLeft}m)
                    </span>
                  )}
                </div>

                <h1 className="font-brand mt-1 text-xl font-bold tracking-tight text-[#07142B] dark:text-white sm:text-2xl">
                  Kithnuka · {divInfo.league.name}
                </h1>
                <p className="mt-0.5 text-xs text-[#0B234A]/75 dark:text-sky-100/80">
                  {divInfo.league.unlockSummary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:w-auto">
              <div className="ios-glass-tile rounded-[20px] px-3 py-2 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                  Trophies
                </p>
                <p className="tabular-nums mt-0.5 text-base font-extrabold text-[#07142B] dark:text-white">
                  {progression.xp}
                </p>
              </div>
              <div className="ios-glass-tile rounded-[20px] px-3 py-2 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                  Lifetime
                </p>
                <p className="tabular-nums mt-0.5 text-base font-extrabold text-blue-700 dark:text-cyan-300">
                  {progression.lifetimeXpEarned}
                </p>
              </div>
              <div className="ios-glass-tile rounded-[20px] px-3 py-2 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                  Peak
                </p>
                <p className="mt-0.5 text-xs font-extrabold text-[#07142B] dark:text-white">
                  {getLeagueSpec(progression.highestLeagueReached).shortName}
                </p>
              </div>
            </div>
          </div>

          {/* Trophy Progress Bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
              <span className="tabular-nums text-[#07142B] dark:text-sky-100">
                {divInfo.nextLeague
                  ? `${progression.xp} / ${divInfo.nextLeague.minXp} Trophies to ${divInfo.nextLeague.name}`
                  : `Zenith Crown · ${progression.xp} XP (+${zenithSurplus} Monday Push)`}
              </span>
              <span className="tabular-nums text-blue-700 dark:text-cyan-300">
                {divInfo.progressPercent}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-blue-950/15 p-0.5 dark:bg-white/12">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${divInfo.league.badgeGradient} transition-[width] duration-300`}
                style={{ width: `${Math.max(5, divInfo.progressPercent)}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            {shieldHoursLeft > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>24h Demotion Shield active ({shieldHoursLeft}h remaining)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#0B234A]/75 dark:text-sky-200/80">
                <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                <span>Self-Study outpaces Classes · Misses scale -20 to -140 XP</span>
              </span>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {onRecalculateHistoryXp && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.success();
                    const res = onRecalculateHistoryXp();
                    pushToast(
                      `Synced ${res.totalXp} XP (${res.league.shortName} · ${res.totalCrystals}💎) from history!`,
                    );
                  }}
                  className="ios-glass-control inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-blue-700 transition-transform active:scale-95 dark:text-cyan-300"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Sync Historical XP</span>
                </button>
              )}

              {claimableCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setArenaTab('bounties');
                  }}
                  className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-700 transition-transform active:scale-95 dark:text-emerald-300"
                >
                  {claimableCount} Bounty Ready to Claim →
                </button>
              )}
            </div>
          </div>
        </section>

        {actionToast && (
          <div className="animate-sheet-in mt-3 rounded-full bg-emerald-500/20 px-4 py-2 text-center text-xs font-bold text-emerald-800 dark:text-emerald-200">
            {actionToast}
          </div>
        )}

        {/* 5 Arena Section Tabs */}
        <div className="ios-glass-control mt-4 grid grid-cols-5 gap-1 rounded-full p-1">
          {(
            [
              { id: 'road', label: 'Road', Icon: Trophy },
              { id: 'powers', label: 'Powers', Icon: Swords },
              { id: 'vault', label: 'Vault', Icon: ShoppingBag },
              {
                id: 'bounties',
                label: claimableCount > 0 ? `Bounty (${claimableCount})` : 'Bounty',
                Icon: BookCheck,
              },
              { id: 'log', label: 'XP Log', Icon: History },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = arenaTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setArenaTab(id);
                }}
                className={`flex min-h-[38px] items-center justify-center gap-1 rounded-full px-1.5 text-[10.5px] font-bold transition-colors sm:gap-1.5 sm:px-2 sm:text-xs ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-cyan-400 dark:text-[#04143B]'
                    : 'text-[#0B234A]/78 dark:text-sky-100/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: 7-LEAGUE TROPHY ROAD & ZENITH MONDAY SEASON */}
        {arenaTab === 'road' && (
          <div className="mt-4 space-y-3">
            {/* Zenith Crown Monday 00:00 Season Reset Card */}
            <div className="ios-glass-hero rounded-[26px] border border-amber-400/55 p-4 shadow-[0_0_24px_rgba(251,191,36,0.18)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4.5 w-4.5 text-amber-500" />
                  <h2 className="text-sm font-bold text-[#07142B] dark:text-white">
                    Zenith Crown Weekly Season (5,000+ XP)
                  </h2>
                </div>
                <span className="tabular-nums rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                  Resets Monday 00:00 · in {daysToMonday}d
                </span>
              </div>
              <p className="mt-1 text-xs text-[#0B234A]/78 dark:text-sky-200/80">
                Cross <strong>5,000 XP</strong> to enter Zenith Crown. Every Monday at 00:00, XP resets back to 5,000 XP and surplus XP converts into bonus Focus Crystals — all abilities, Vault objects, and Lifetime XP remain yours forever.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="ios-glass-tile rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                    Current Push
                  </p>
                  <p className="tabular-nums mt-0.5 text-sm font-extrabold text-amber-700 dark:text-amber-300">
                    {progression.currentLeague === 'zenith' ? `+${zenithSurplus} XP` : `${Math.max(0, 5000 - progression.xp)} away`}
                  </p>
                </div>
                <div className="ios-glass-tile rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                    Mon Payout
                  </p>
                  <p className="tabular-nums mt-0.5 text-sm font-extrabold text-cyan-600 dark:text-cyan-300">
                    {progression.currentLeague === 'zenith' ? `+${projectedZenithCrystals}💎` : '25+💎'}
                  </p>
                </div>
                <div className="ios-glass-tile rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                    Best Season
                  </p>
                  <p className="tabular-nums mt-0.5 text-sm font-extrabold text-[#07142B] dark:text-white">
                    {progression.zenithBestXp ? `${progression.zenithBestXp} XP` : '—'}
                  </p>
                </div>
                <div className="ios-glass-tile rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B234A]/65 dark:text-sky-200/70">
                    Seasons Won
                  </p>
                  <p className="tabular-nums mt-0.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    {progression.zenithSeasonsCompleted ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {[...LEAGUES].reverse().map((lg) => {
              const isCurrent = lg.id === progression.currentLeague;
              const unlocked = isLeagueAtLeast(progression.currentLeague, lg.id);
              const lgAura = LEAGUE_AURA_STYLE[lg.id];
              const tierAbilities = ABILITIES.filter((a) => a.requiredLeague === lg.id);

              return (
                <div
                  key={lg.id}
                  className={`ios-glass relative overflow-hidden rounded-[26px] border p-4 transition-opacity ${
                    isCurrent
                      ? `${lgAura.ringBorder} ${lgAura.glowShadow}`
                      : unlocked
                        ? 'border-emerald-400/45'
                        : 'opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <LeagueCrest
                        league={lg.id}
                        frame={isCurrent ? activeFrame : 'none'}
                        size="lg"
                        withAura={isCurrent}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm font-extrabold sm:text-base ${lg.textClass}`}>
                            {lg.name}
                          </h3>
                          {isCurrent && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white ${lgAura.pillBg}`}
                            >
                              Current Rank
                            </span>
                          )}
                          {!isCurrent && unlocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/18 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <Check className="h-3 w-3" />
                              Cleared
                            </span>
                          )}
                          {!unlocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/10 px-2 py-0.5 text-[10px] font-semibold text-[#0B234A]/70 dark:bg-white/10 dark:text-sky-200/70">
                              <Lock className="h-3 w-3" />
                              {lg.minXp} XP
                            </span>
                          )}
                        </div>

                        <p className="tabular-nums mt-0.5 text-xs font-semibold text-[#07142B] dark:text-sky-100">
                          {lg.maxXp >= 999999 ? `${lg.minXp}+ Trophy XP` : `${lg.minXp} – ${lg.maxXp - 1} Trophy XP`}
                          {lg.order > 0 ? ` · +${CRYSTAL_VALUES.leaguePromoBonus}💎 Promo Bonus` : ''}
                        </p>
                        <p className="mt-1 text-[11.5px] text-[#0B234A]/80 dark:text-sky-200/80">
                          {lg.unlockSummary}
                        </p>

                        {tierAbilities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {tierAbilities.map((ab) => (
                              <span
                                key={ab.id}
                                className="ios-glass-control rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold text-[#07142B] dark:text-sky-100"
                              >
                                Power: {ab.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: POWERS & WEEKLY LOADOUT */}
        {arenaTab === 'powers' && (
          <div className="mt-4 space-y-3">
            {/* All-Tiers Core Weekly Auto-Suggest */}
            <div className="ios-glass-hero rounded-[26px] border border-cyan-400/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-[#07142B] dark:text-white">
                        Weekly Self-Study Auto-Suggest
                      </p>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        All Tiers Unlocked
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#0B234A]/78 dark:text-sky-200/80">
                      Finds your least self-study focused subject this week and recommends the best next task &amp; open slot.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    onClose();
                    onOpenWeeklyFocusSuggest();
                  }}
                  className="min-h-[38px] shrink-0 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95 dark:bg-blue-500"
                >
                  Open Auto-Suggest
                </button>
              </div>
            </div>

            {ABILITIES.map((ab) => {
              const Icon = ABILITY_ICONS[ab.id];
              const reqLeague = getLeagueSpec(ab.requiredLeague);
              const leagueMet = isLeagueAtLeast(progression.currentLeague, ab.requiredLeague);
              const unlocked = Boolean(progression.unlockedAbilities[ab.id]);
              const activeNow = isAbilityActive(progression, ab.id);
              const canAffordUnlock = progression.crystals >= ab.unlockCostCrystals;
              const canAffordCharge =
                ab.chargeCostCrystals !== undefined &&
                progression.crystals >= ab.chargeCostCrystals;

              return (
                <div
                  key={ab.id}
                  className={`ios-glass rounded-[24px] p-4 ${!leagueMet ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] ${
                          activeNow
                            ? 'bg-blue-600 text-white dark:bg-cyan-400 dark:text-[#04143B]'
                            : 'bg-blue-500/15 text-blue-700 dark:text-sky-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-bold text-[#07142B] dark:text-white">
                            {ab.name}
                          </p>
                          <span className={`text-[11px] font-bold ${reqLeague.textClass}`}>
                            · {reqLeague.shortName}+
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-[#0B234A]/78 dark:text-sky-200/80">
                          {ab.description}
                        </p>
                      </div>
                    </div>

                    {!leagueMet ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-950/10 px-3 py-1.5 text-[11px] font-semibold text-[#0B234A]/75 dark:bg-white/10 dark:text-sky-200/75">
                        <Lock className="h-3 w-3" />
                        {reqLeague.shortName}
                      </span>
                    ) : !unlocked ? (
                      <button
                        type="button"
                        disabled={!canAffordUnlock}
                        onClick={() => {
                          haptics.success();
                          onUnlockAbility(ab.id);
                          pushToast(`Unlocked ${ab.name}!`);
                        }}
                        className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-45 dark:bg-blue-500"
                      >
                        <Gem className="h-3.5 w-3.5" />
                        <span>Buy {ab.unlockCostCrystals}</span>
                      </button>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/18 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  {activeNow && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-950/10 pt-2.5 dark:border-white/10">
                      {ab.id === 'streak_shield' && (
                        <>
                          <span className="tabular-nums text-xs font-semibold text-[#07142B] dark:text-sky-100">
                            Charges stocked: {progression.streakShieldCharges}
                          </span>
                          <button
                            type="button"
                            disabled={!canAffordCharge}
                            onClick={() => {
                              haptics.success();
                              onBuyCharge('streak_shield');
                              pushToast('Bought +1 Streak Shield charge!');
                            }}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-blue-600/15 px-3 text-xs font-semibold text-blue-700 disabled:opacity-45 dark:bg-cyan-400/15 dark:text-cyan-200"
                          >
                            <Gem className="h-3.5 w-3.5" />
                            <span>+1 Charge ({ab.chargeCostCrystals})</span>
                          </button>
                        </>
                      )}

                      {ab.id === 'focus_rush' && (
                        <>
                          <span className="tabular-nums text-xs font-semibold text-[#07142B] dark:text-sky-100">
                            {rushActive
                              ? `2× Rush Live (${rushMinsLeft}m left)`
                              : `Charges stocked: ${progression.focusRushCharges}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canAffordCharge}
                              onClick={() => {
                                haptics.success();
                                onBuyCharge('focus_rush');
                                pushToast('Bought +1 Focus Rush charge!');
                              }}
                              className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-blue-600/15 px-3 text-xs font-semibold text-blue-700 disabled:opacity-45 dark:bg-cyan-400/15 dark:text-cyan-200"
                            >
                              <Gem className="h-3.5 w-3.5" />
                              <span>+1 ({ab.chargeCostCrystals})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                haptics.tap();
                                onClose();
                                onOpenFocusRush();
                              }}
                              className="min-h-[32px] rounded-full bg-blue-600 px-3.5 text-xs font-semibold text-white dark:bg-blue-500"
                            >
                              Open Focus Rush
                            </button>
                          </div>
                        </>
                      )}

                      {ab.id === 'smart_gap_filler' && (
                        <>
                          <span className="text-xs text-[#0B234A]/75 dark:text-sky-200/80">
                            {activeMissedCount} active missed item(s) waiting
                          </span>
                          <button
                            type="button"
                            disabled={activeMissedCount === 0}
                            onClick={() => {
                              const res = onRunSmartGapFiller();
                              if (res.addedCount > 0) haptics.success();
                              pushToast(res.message);
                            }}
                            className="min-h-[32px] rounded-full bg-blue-600 px-3.5 text-xs font-semibold text-white disabled:opacity-45 dark:bg-blue-500"
                          >
                            Auto-Slot Missed Now
                          </button>
                        </>
                      )}

                      {(ab.id === 'subject_balance_radar' ||
                        ab.id === 'focus_soundscapes' ||
                        ab.id === 'review_chain_radar' ||
                        ab.id === 'exam_readiness_index') && (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Passive perk active automatically across your workspace
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SCHOLAR VAULT OBJECTS & GEAR SHOP */}
        {arenaTab === 'vault' && (
          <div className="mt-4 space-y-4">
            {/* Shelf & Scholar Trio Bonus Summary */}
            <div className="ios-glass-hero rounded-[26px] border border-cyan-400/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#07142B] dark:text-white">
                    Scholar Vault Display Shelf
                  </p>
                  <p className="mt-0.5 text-xs text-[#0B234A]/78 dark:text-sky-200/80">
                    Own DNA Helix + Quantum Chronometer + Alchemist&apos;s Flask to unlock a permanent <strong>+10%💎 bonus</strong> on every Crystal reward.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    trioActive
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'ios-glass-control text-[#07142B] dark:text-sky-100'
                  }`}
                >
                  {trioActive
                    ? 'Trio Bonus Active (+10%💎)'
                    : `Trio: ${(['dna_helix', 'quantum_pendulum', 'alchemist_flask'] as VaultArtifactId[]).filter((id) => progression.ownedArtifacts?.[id]).length}/3`}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {VAULT_ARTIFACTS.map((art) => {
                  const owned = Boolean(progression.ownedArtifacts?.[art.id]);
                  const equipped = progression.equippedArtifact === art.id;
                  return (
                    <button
                      key={`shelf-${art.id}`}
                      type="button"
                      disabled={!owned}
                      onClick={() => {
                        haptics.tick();
                        onEquipVaultArtifact?.(equipped ? null : art.id);
                      }}
                      className={`ios-glass-tile flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-transform active:scale-95 disabled:opacity-40 ${
                        equipped ? 'ring-2 ring-cyan-400' : ''
                      }`}
                    >
                      <VaultObjectArt artifactId={art.id} size="xs" />
                      <span>{art.category}</span>
                      {equipped && <Check className="h-3 w-3 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collectible Desk Artifacts */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B234A]/70 dark:text-sky-200/75">
                Collectible Desk Objects
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {VAULT_ARTIFACTS.map((art) => {
                  const owned = Boolean(progression.ownedArtifacts?.[art.id]);
                  const equipped = progression.equippedArtifact === art.id;
                  const reqSpec = getLeagueSpec(art.requiredLeague);
                  const leagueMet = isLeagueAtLeast(progression.currentLeague, art.requiredLeague);
                  const canAfford = progression.crystals >= art.costCrystals;
                  return (
                    <div
                      key={art.id}
                      className={`ios-glass flex items-center justify-between gap-3 rounded-[24px] p-3.5 ${
                        !leagueMet && !owned ? 'opacity-80' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="ios-glass-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]">
                          <VaultObjectArt artifactId={art.id} size="md" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs font-bold text-[#07142B] dark:text-white">
                              {art.name}
                            </p>
                            <span className={`text-[10px] font-bold ${reqSpec.textClass}`}>
                              {reqSpec.shortName}+
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#0B234A]/78 dark:text-sky-200/80">
                            {art.description}
                          </p>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptics.tick();
                            onEquipVaultArtifact?.(equipped ? null : art.id);
                          }}
                          className={`min-h-[34px] shrink-0 rounded-full px-3 text-[11px] font-bold ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'ios-glass-control text-[#07142B] dark:text-white'
                          }`}
                        >
                          {equipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : !leagueMet ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-950/10 px-2.5 py-1.5 text-[10.5px] font-semibold text-[#0B234A]/75 dark:bg-white/10 dark:text-sky-200/75">
                          <Lock className="h-3 w-3" />
                          {reqSpec.shortName}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            haptics.success();
                            onBuyVaultArtifact?.(art.id);
                            pushToast(`Acquired & equipped ${art.name}!`);
                          }}
                          className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm disabled:opacity-45 dark:bg-blue-500"
                        >
                          <Gem className="h-3 w-3" />
                          <span>{art.costCrystals}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Home Progress Ring Skins & Crest Frames */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B234A]/70 dark:text-sky-200/75">
                  Home Progress Ring Skins
                </h2>
                {RING_SKINS.filter((r) => r.id !== 'classic').map((ring) => {
                  const owned = Boolean(progression.ownedRingSkins?.[ring.id]);
                  const equipped = (studio?.ringSkin ?? 'classic') === ring.id;
                  const canAfford = progression.crystals >= ring.costCrystals;
                  return (
                    <div
                      key={ring.id}
                      className="ios-glass flex items-center justify-between gap-2.5 rounded-[22px] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="h-8 w-8 shrink-0 rounded-full border-2 border-white/70 shadow-sm"
                          style={{
                            background: `conic-gradient(${ring.stop1}, ${ring.stop2}, ${ring.stop3}, ${ring.stop1})`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#07142B] dark:text-white">
                            {ring.name}
                          </p>
                          <p className="truncate text-[10.5px] text-[#0B234A]/75 dark:text-sky-200/75">
                            {ring.description}
                          </p>
                        </div>
                      </div>
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptics.tick();
                            onBuyRingSkin?.(equipped ? 'classic' : ring.id);
                          }}
                          className={`min-h-[32px] shrink-0 rounded-full px-3 text-[11px] font-bold ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'ios-glass-control text-[#07142B] dark:text-white'
                          }`}
                        >
                          {equipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            haptics.success();
                            onBuyRingSkin?.(ring.id);
                            pushToast(`Equipped ${ring.name}!`);
                          }}
                          className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 text-[11px] font-bold text-white disabled:opacity-45 dark:bg-blue-500"
                        >
                          <Gem className="h-3 w-3" />
                          <span>{ring.costCrystals}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B234A]/70 dark:text-sky-200/75">
                  League Crest Frames
                </h2>
                {CREST_FRAMES.filter((f) => f.id !== 'none').map((frame) => {
                  const owned = Boolean(progression.ownedCrestFrames?.[frame.id]);
                  const equipped = activeFrame === frame.id;
                  const reqSpec = getLeagueSpec(frame.requiredLeague);
                  const leagueMet = isLeagueAtLeast(progression.currentLeague, frame.requiredLeague);
                  const canAfford = progression.crystals >= frame.costCrystals;
                  return (
                    <div
                      key={frame.id}
                      className="ios-glass flex items-center justify-between gap-2.5 rounded-[22px] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <LeagueCrest
                          league={progression.currentLeague}
                          frame={frame.id}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-bold text-[#07142B] dark:text-white">
                              {frame.name}
                            </p>
                            <span className={`text-[10px] font-bold ${reqSpec.textClass}`}>
                              {reqSpec.shortName}+
                            </span>
                          </div>
                          <p className="truncate text-[10.5px] text-[#0B234A]/75 dark:text-sky-200/75">
                            {frame.description}
                          </p>
                        </div>
                      </div>
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptics.tick();
                            onBuyCrestFrame?.(equipped ? 'none' : frame.id);
                          }}
                          className={`min-h-[32px] shrink-0 rounded-full px-3 text-[11px] font-bold ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'ios-glass-control text-[#07142B] dark:text-white'
                          }`}
                        >
                          {equipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : !leagueMet ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-950/10 px-2.5 py-1 text-[10px] font-semibold text-[#0B234A]/75 dark:bg-white/10 dark:text-sky-200/75">
                          <Lock className="h-3 w-3" />
                          {reqSpec.shortName}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            haptics.success();
                            onBuyCrestFrame?.(frame.id);
                            pushToast(`Equipped ${frame.name}!`);
                          }}
                          className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 text-[11px] font-bold text-white disabled:opacity-45 dark:bg-blue-500"
                        >
                          <Gem className="h-3 w-3" />
                          <span>{frame.costCrystals}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical Gear Consumables */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B234A]/70 dark:text-sky-200/75">
                Tactical Study Gear (Consumables)
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TACTICAL_GEAR.map((gear) => {
                  const isPardon = gear.id === 'pardon_scroll';
                  const charges = isPardon
                    ? progression.pardonScrollCharges ?? 0
                    : progression.hourglassCharges ?? 0;
                  const canAfford = progression.crystals >= gear.costCrystals;
                  const atMax = charges >= gear.maxCharges;
                  return (
                    <div key={gear.id} className="ios-glass rounded-[24px] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-500/15 text-blue-700 dark:text-cyan-300">
                            {isPardon ? (
                              <ScrollText className="h-5 w-5" />
                            ) : (
                              <Hourglass className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#07142B] dark:text-white">
                              {gear.name}
                            </p>
                            <p className="text-[11px] font-semibold text-blue-700 dark:text-cyan-300">
                              {gear.tagline} · Stocked {charges}/{gear.maxCharges}
                            </p>
                            <p className="mt-1 text-xs leading-snug text-[#0B234A]/78 dark:text-sky-200/80">
                              {gear.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-950/10 pt-2.5 dark:border-white/10">
                        <button
                          type="button"
                          disabled={atMax || !canAfford}
                          onClick={() => {
                            haptics.success();
                            onBuyTacticalGear?.(gear.id);
                            pushToast(`Stocked +1 ${gear.name}!`);
                          }}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-blue-600 px-3.5 text-xs font-bold text-white disabled:opacity-45 dark:bg-blue-500"
                        >
                          <Gem className="h-3.5 w-3.5" />
                          <span>{atMax ? 'Max Stock' : `Buy (${gear.costCrystals})`}</span>
                        </button>

                        {!isPardon && charges > 0 && onUseScholarHourglass && (
                          <button
                            type="button"
                            onClick={() => {
                              haptics.success();
                              onUseScholarHourglass();
                              pushToast('Scholar Hourglass Activated: +25 XP & 90m 2× Rush!');
                            }}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Ignite Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DAILY/WEEKLY BOUNTIES & RULEBOOK */}
        {arenaTab === 'bounties' && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#07142B] dark:text-white">
                  Daily &amp; Weekly Arena Bounties
                </h2>
                <span className="text-[11px] text-[#0B234A]/70 dark:text-sky-200/75">
                  Resets daily / every Monday
                </span>
              </div>

              {bounties.map((b) => {
                const pct = Math.min(100, Math.round((b.progress / Math.max(1, b.target)) * 100));
                return (
                  <div
                    key={b.id}
                    className={`ios-glass rounded-[24px] border p-4 ${
                      b.readyToClaim
                        ? 'border-emerald-400/75 shadow-[0_0_20px_rgba(16,185,129,0.22)]'
                        : 'border-white/50 dark:border-sky-300/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              b.cadence === 'daily'
                                ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-200'
                                : 'bg-violet-500/20 text-violet-800 dark:text-violet-200'
                            }`}
                          >
                            {b.cadence}
                          </span>
                          <p className="text-sm font-bold text-[#07142B] dark:text-white">
                            {b.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-[#0B234A]/78 dark:text-sky-200/80">
                          {b.description}
                        </p>

                        <div className="mt-2.5 flex items-center gap-2.5">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-950/12 dark:bg-white/12">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-[width] duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-[11px] font-bold text-[#07142B] dark:text-sky-100">
                            {b.progress}/{b.target}
                          </span>
                        </div>
                      </div>

                      {b.claimed ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/18 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          Claimed
                        </span>
                      ) : b.readyToClaim ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptics.success();
                            onClaimBounty(b);
                            pushToast(`Claimed +${b.rewardXp} XP & +${b.rewardCrystals}💎!`);
                          }}
                          className="min-h-[36px] shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                        >
                          Claim +{b.rewardXp} XP · +{b.rewardCrystals}💎
                        </button>
                      ) : (
                        <span className="ios-glass-control tabular-nums shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-[#0B234A]/75 dark:text-sky-200/80">
                          +{b.rewardXp} XP · +{b.rewardCrystals}💎
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Universal XP & COC Penalty Rulebook */}
            <div className="ios-glass rounded-[26px] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#07142B] dark:text-white">
                    Progressive Effort XP &amp; COC Stakes Rulebook
                  </h2>
                  <p className="mt-0.5 text-xs text-[#0B234A]/75 dark:text-sky-200/75">
                    Uncapped per-minute curve: Self-Study earns highest XP, Recordings ~0.5×, Classes ~0.42× (+10 physical grit).
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  {
                    label: 'Self-Study (30m / 1h / 2h / 3h)',
                    xp: `+${computeProgressiveSelfStudyXp(30)} / +${computeProgressiveSelfStudyXp(60)} / +${computeProgressiveSelfStudyXp(120)} / +${computeProgressiveSelfStudyXp(180)} XP`,
                    cry: '+40%💎',
                    good: true,
                  },
                  {
                    label: 'Deep Focus 4h+ (Uncapped)',
                    xp: `+${computeProgressiveSelfStudyXp(240)} XP (4h) · Scales forever`,
                    cry: `+${crystalsFromXp(computeProgressiveSelfStudyXp(240))}💎`,
                    good: true,
                  },
                  {
                    label: 'Missed Recording Catch-Up',
                    xp: '+13 XP / 30m (~0.5× Study)',
                    cry: '+40%💎',
                    good: true,
                  },
                  {
                    label: 'Class Attended (Online / Physical)',
                    xp: '+11 XP / 30m (+10 Physical)',
                    cry: '+40%💎',
                    good: true,
                  },
                  {
                    label: 'Planner Task (30m–3h+)',
                    xp: `Study curve × Priority (+${XP_VALUES.taskWrapUpBonus} wrap-up)`,
                    cry: '+40%💎',
                    good: true,
                  },
                  {
                    label: 'Checklist Sub-Step Done',
                    xp: `+${XP_VALUES.checklistSubItem} XP`,
                    cry: `+${CRYSTAL_VALUES.checklistSubItem}💎`,
                    good: true,
                  },
                  {
                    label: 'Syllabus Unit Mastered',
                    xp: `+${XP_VALUES.unitCovered} XP`,
                    cry: `+${CRYSTAL_VALUES.unitCovered}💎`,
                    good: true,
                  },
                  {
                    label: 'Past Paper Logged / 75%+',
                    xp: `+${XP_VALUES.paperLog} XP (+${XP_VALUES.paperHighScoreBonus} bonus)`,
                    cry: `+${crystalsFromXp(XP_VALUES.paperLog)}💎`,
                    good: true,
                  },
                  {
                    label: 'Past Paper Mistake Review',
                    xp: `+${XP_VALUES.paperReview} XP (1.5× Fast Chain)`,
                    cry: `+${CRYSTAL_VALUES.paperReview}💎`,
                    good: true,
                  },
                  {
                    label: '1× Rescue Slot Comeback',
                    xp: `Study curve +${XP_VALUES.rescueComebackBonus} XP`,
                    cry: '+40%💎',
                    good: true,
                  },
                  {
                    label: 'Split Session Check-In',
                    xp: 'Pro-rated by minutes',
                    cry: 'Zero Penalty',
                    good: true,
                  },
                  {
                    label: '1st Miss / 2nd Miss Double Bust',
                    xp: '-20..-75 / -45..-140 XP',
                    cry: '50% Stake → Lock',
                    good: false,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="ios-glass-tile flex items-center justify-between gap-2 rounded-[18px] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-[#07142B] dark:text-sky-100">
                      {row.label}
                    </span>
                    <span
                      className={`tabular-nums shrink-0 font-bold ${
                        row.good
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {row.xp} · {row.cry}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FILTERABLE XP & TROPHY LOG */}
        {arenaTab === 'log' && (
          <div className="mt-4 space-y-3">
            <div className="ios-glass-control grid grid-cols-4 gap-1 rounded-full p-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'gain', label: 'Gains' },
                  { id: 'penalty', label: 'Penalties' },
                  { id: 'other', label: 'Bounties & Shop' },
                ] as { id: LogFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setLogFilter(f.id);
                  }}
                  className={`min-h-[34px] rounded-full px-2 text-[11px] font-bold transition-colors ${
                    logFilter === f.id
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                      : 'text-[#0B234A]/75 dark:text-sky-200/75'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredHistory.length === 0 ? (
              <div className="ios-glass rounded-[26px] px-5 py-10 text-center text-xs text-[#0B234A]/72 dark:text-sky-200/75">
                No XP entries in this filter yet. Tick off any slot, task, checklist step, or syllabus unit to start climbing!
              </div>
            ) : (
              <div className="ios-glass rounded-[26px] divide-y divide-blue-950/8 p-2 dark:divide-white/8">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.deltaXp < 0 ? (
                        <TrendingDown className="h-4 w-4 shrink-0 text-rose-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#07142B] dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-[#0B234A]/60 dark:text-sky-200/65">
                          {formatHistoryTime(item.timestampMs)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`tabular-nums shrink-0 font-bold ${
                        item.deltaXp < 0
                          ? 'text-rose-600 dark:text-rose-300'
                          : 'text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {item.deltaXp >= 0 ? `+${item.deltaXp}` : item.deltaXp} XP
                      {item.deltaCrystals !== 0
                        ? ` · ${item.deltaCrystals > 0 ? `+${item.deltaCrystals}` : item.deltaCrystals}💎`
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
