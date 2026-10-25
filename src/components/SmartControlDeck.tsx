import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  InteractionMode,
  KRDStepAnalysis,
  Student,
  StudentMasterySummary,
} from '../types/krd';
import { KRD_ACTIONS, computeKRDStep } from '../utils/krdEngine';
import { soundFX } from '../utils/sound';

interface SmartControlDeckProps {
  students: Student[];
  selectedClass: string;
  activeStudent: Student | null;
  diagnostic: StudentMasterySummary;
  mode: InteractionMode;
  currentSifir: number | null;
  activeMultiplier: number | null;
  learnSubStep: number;
  revealedSectors: Record<number, string>;
  elapsedSeconds: number;
  score: { correct: number; total: number };
  isAutoPlaying: boolean;
  onSelectClass: (kls: string) => void;
  onSelectStudent: (student: Student | null) => void;
  onSetMode: (mode: InteractionMode) => void;
  onSelectSifir: (sifir: number) => void;
  onSelectMultiplier: (m: number) => void;
  onAdvanceLearnSubStep: () => void;
  onToggleAutoPlay: () => void;
  onResetSession: () => void;
  onCompleteSector: (
    multiplier: number,
    answerStr: string,
    wasCleanCorrect: boolean,
    saErrorCount: number,
    puluhErrorCount: number
  ) => void;
}

export const SmartControlDeck: React.FC<SmartControlDeckProps> = ({
  students,
  selectedClass,
  activeStudent,
  diagnostic,
  mode,
  currentSifir,
  activeMultiplier,
  learnSubStep,
  revealedSectors,
  elapsedSeconds,
  score,
  isAutoPlaying,
  onSelectClass,
  onSelectStudent,
  onSetMode,
  onSelectSifir,
  onSelectMultiplier,
  onAdvanceLearnSubStep,
  onToggleAutoPlay,
  onResetSession,
  onCompleteSector,
}) => {
  const [muted, setMuted] = useState(soundFX.muted);

  // Guided 2-Step State
  const [guidedPhase, setGuidedPhase] = useState<'sa' | 'puluh_rule' | 'puluh_digit' | 'done'>('sa');
  const [selectedSa, setSelectedSa] = useState<number | null>(null);
  const [selectedPuluhRule, setSelectedPuluhRule] = useState<'A' | 'B' | null>(null);
  const [guidedHint, setGuidedHint] = useState<string | null>(null);
  const [localSaErrors, setLocalSaErrors] = useState(0);
  const [localPuluhErrors, setLocalPuluhErrors] = useState(0);

  // Speed Mode State
  const [speedInput, setSpeedInput] = useState<string>('');
  const [speedFeedback, setSpeedFeedback] = useState<string | null>(null);

  const uniqueClasses = Array.from(new Set(students.map((s) => s.kls))).sort();
  const classStudents = selectedClass
    ? students.filter((s) => s.kls === selectedClass)
    : [];

  const stepAnalysis: KRDStepAnalysis | null =
    currentSifir && activeMultiplier
      ? computeKRDStep(currentSifir, activeMultiplier)
      : null;

  // Reset guided/speed local state whenever sifir, multiplier, or mode changes
  useEffect(() => {
    setGuidedPhase('sa');
    setSelectedSa(null);
    setSelectedPuluhRule(null);
    setGuidedHint(null);
    setLocalSaErrors(0);
    setLocalPuluhErrors(0);
    setSpeedInput('');
    setSpeedFeedback(null);
  }, [currentSifir, activeMultiplier, mode]);

  const toggleSound = () => {
    soundFX.muted = !muted;
    setMuted(soundFX.muted);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Guided Step 1 Handler: Student picks Sa digit (0..9)
  const handleGuidedSaPick = (digit: number) => {
    if (!stepAnalysis) return;
    if (digit === stepAnalysis.currSa) {
      soundFX.playCorrect();
      setSelectedSa(digit);
      setGuidedHint(null);
      setGuidedPhase('puluh_rule');
    } else {
      soundFX.playWrong();
      setLocalSaErrors((prev) => prev + 1);
      setGuidedHint(
        `Kurang tepat (${digit}). Lihat Langkah 1: Sa Lama ialah ${stepAnalysis.prevSa}. Gunakan kunci Sifir ${stepAnalysis.sifir} (${stepAnalysis.action.display}): ${stepAnalysis.saWrapExplanation}`
      );
    }
  };

  // Guided Step 2a Handler: Student picks whether Sa decreased (Rule A: +1 Puluh) or rose/stayed (Rule B: Puluh Kekal)
  const handleGuidedRulePick = (ruleCode: 'A' | 'B') => {
    if (!stepAnalysis) return;
    if (ruleCode === stepAnalysis.puluhRuleCode) {
      soundFX.playTap();
      setSelectedPuluhRule(ruleCode);
      setGuidedHint(null);
      setGuidedPhase('puluh_digit');
    } else {
      soundFX.playWrong();
      setLocalPuluhErrors((prev) => prev + 1);
      setGuidedHint(
        `Perhatikan perubahan Sa: daripada Sa Lama (${stepAnalysis.prevSa}) kepada Sa Baru (${stepAnalysis.currSa}). ${
          stepAnalysis.isSaDecreasing
            ? 'Nombor Sa telah MENURUN, jadi pilih Peraturan A (Tambah 1 pada Puluh).'
            : 'Nombor Sa MENAIK / KEKAL, jadi pilih Peraturan B (Puluh Kekal).'
        }`
      );
    }
  };

  // Guided Step 2b Handler: Student picks Puluh digit (0..9)
  const handleGuidedPuluhPick = (digit: number) => {
    if (!stepAnalysis) return;
    if (digit === stepAnalysis.currPuluh) {
      soundFX.playCorrect();
      setGuidedHint(null);
      setGuidedPhase('done');
      const formattedAns =
        stepAnalysis.currResult < 10
          ? `0${stepAnalysis.currResult}`
          : `${stepAnalysis.currResult}`;
      const wasClean = localSaErrors === 0 && localPuluhErrors === 0;
      onCompleteSector(
        stepAnalysis.multiplier,
        formattedAns,
        wasClean,
        localSaErrors,
        localPuluhErrors
      );
    } else {
      soundFX.playWrong();
      setLocalPuluhErrors((prev) => prev + 1);
      setGuidedHint(
        `Puluh Lama ialah ${stepAnalysis.prevPuluh}. Mengikut ${
          stepAnalysis.isSaDecreasing
            ? `Peraturan A (+1), ${stepAnalysis.prevPuluh} + 1 = ${stepAnalysis.currPuluh}`
            : `Peraturan B (Kekal), nilai Puluh kekal ${stepAnalysis.currPuluh}`
        }.`
      );
    }
  };

  // Speed Mode Number Pad Handler
  const handleSpeedDigitPress = (d: number) => {
    if (!stepAnalysis) return;
    soundFX.playTap();
    const nextInput = (speedInput + d.toString()).slice(0, 2);
    setSpeedInput(nextInput);
    setSpeedFeedback(null);

    const expectedStr =
      stepAnalysis.currResult < 10
        ? `0${stepAnalysis.currResult}`
        : `${stepAnalysis.currResult}`;
    const rawExpected = `${stepAnalysis.currResult}`;

    // Automatically check if user entered exact 2-digit answer (e.g. "08" or "16") or 1-digit if they press Check
    if (nextInput.length === 2) {
      if (nextInput === expectedStr) {
        soundFX.playCorrect();
        onCompleteSector(
          stepAnalysis.multiplier,
          expectedStr,
          localSaErrors === 0 && localPuluhErrors === 0,
          localSaErrors,
          localPuluhErrors
        );
      } else {
        soundFX.playWrong();
        const enteredPuluh = Number(nextInput[0]);
        const enteredSa = Number(nextInput[1]);
        const saWrong = enteredSa !== stepAnalysis.currSa ? 1 : 0;
        const puluhWrong = enteredPuluh !== stepAnalysis.currPuluh ? 1 : 0;
        setLocalSaErrors((p) => p + saWrong);
        setLocalPuluhErrors((p) => p + puluhWrong);
        setSpeedFeedback(
          `Jawapan ${nextInput} kurang tepat. Petunjuk KRD: Sa Baru = ${stepAnalysis.prevSa} ${stepAnalysis.action.display}, Puluh Lama = ${stepAnalysis.prevPuluh}.`
        );
        setSpeedInput('');
      }
    } else if (nextInput === rawExpected && stepAnalysis.currResult < 10) {
      // Allow single digit match for < 10 if desired, or let them see it immediately!
      soundFX.playCorrect();
      onCompleteSector(
        stepAnalysis.multiplier,
        expectedStr,
        localSaErrors === 0 && localPuluhErrors === 0,
        localSaErrors,
        localPuluhErrors
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Student Profile & Diagnostic Mastery Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Profil Murid & Diagnostik Kendiri
            </h2>
          </div>
          <button
            onClick={toggleSound}
            title={muted ? 'Aktifkan Bunyi' : 'Senyapkan Bunyi'}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <select
            value={selectedClass}
            onChange={(e) => onSelectClass(e.target.value)}
            aria-label="Pilih Kelas"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Kelas / Mod Tetamu</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>

          <select
            value={activeStudent?.name || ''}
            onChange={(e) => {
              const found = classStudents.find((s) => s.name === e.target.value) || null;
              onSelectStudent(found);
            }}
            aria-label="Pilih Murid"
            disabled={!selectedClass}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="">
              {selectedClass ? 'Pilih Nama Murid...' : 'Mod Kendiri (Tetamu)'}
            </option>
            {classStudents.map((s) => (
              <option key={`${s.name}-${s.kls}`} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Student & Smart Recommendation */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-slate-900">
                {activeStudent ? activeStudent.name : 'Murid Kendiri (Tetamu)'}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{activeStudent ? activeStudent.kls : 'Latihan Bebas'}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-semibold text-indigo-700">{diagnostic.tpLabel}</span>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {diagnostic.masteredCount}/9 Sifir Dikuasai
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 px-3 py-2">
            <div className="flex items-start gap-2 text-xs text-indigo-950">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{diagnostic.recommendationReason}</p>
            </div>
            <button
              onClick={() => onSelectSifir(diagnostic.recommendedSifir)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sifir {diagnostic.recommendedSifir}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Mode & Sifir Selector Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Mod Pembelajaran & Latihan
            </span>
            {mode !== 'learn' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 tabular-nums">
                <Timer className="w-3.5 h-3.5" />
                {formatTime(elapsedSeconds)} · Skor {score.correct}/{score.total}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => onSetMode('learn')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'learn'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Belajar
            </button>
            <button
              onClick={() => onSetMode('guided')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'guided'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Latihan 2-Langkah
            </button>
            <button
              onClick={() => onSetMode('speed')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'speed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Cabaran Pantas
            </button>
          </div>
        </div>

        {/* Sifir 1-9 Grid with Mastery Badges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Pilih Sifir (1–9) & Status Lencana
            </span>
            <button
              onClick={onResetSession}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Roda</span>
            </button>
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => {
              const stat = diagnostic.sifirStats[s];
              const isSelected = currentSifir === s;
              const badgeColor =
                stat?.badge === 'gold'
                  ? 'text-amber-500'
                  : stat?.badge === 'silver'
                    ? 'text-slate-400'
                    : stat?.badge === 'bronze'
                      ? 'text-amber-700'
                      : 'text-transparent';

              return (
                <button
                  key={s}
                  onClick={() => onSelectSifir(s)}
                  className={`relative flex flex-col items-center justify-center py-2 rounded-xl border font-display font-bold text-sm transition-all cursor-pointer tabular-nums ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <span>{s}</span>
                  <Award
                    className={`w-3 h-3 mt-0.5 ${
                      isSelected && stat?.badge !== 'none' ? 'text-amber-300' : badgeColor
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Dynamic Pedagogical Guide / Interactive Keypad Deck */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex-grow flex flex-col justify-between">
        {!currentSifir ? (
          <div className="my-auto text-center py-8 px-4">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              Pembantu Pintar KRD Sedia Membantu
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Pilih mana-mana Sifir 1 hingga 9 di atas. Anda boleh belajar konsep Langkah 1 (Cari Sa) & Langkah 2 (Cari Puluh), berlatih secara berpandu, atau menguji kepantasan.
            </p>
          </div>
        ) : !stepAnalysis ? (
          <div className="my-auto text-center py-6 px-3 space-y-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600">
                Sifir {currentSifir} · Kunci Garis Nombor Ajaib: {KRD_ACTIONS[currentSifir].display}
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {Object.keys(revealedSectors).length === 10
                  ? `Tahniah! Sifir ${currentSifir} Lengkap!`
                  : 'Pilih Sektor pada Roda Darab'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {KRD_ACTIONS[currentSifir].description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => onSelectMultiplier(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Mula Sektor 1 ({currentSifir} × 1)</span>
              </button>
              {mode === 'learn' && (
                <button
                  onClick={onToggleAutoPlay}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{isAutoPlaying ? 'Henti Auto-Main' : 'Mainkan Semua (1× – 10×)'}</span>
                </button>
              )}
            </div>
          </div>
        ) : mode === 'learn' ? (
          /* ================= MODE 1: BELAJAR (VISUALISASI KRD) ================= */
          <div className="flex flex-col justify-between h-full gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-xs text-slate-500">Penerangan Konsep KRD</span>
                  <h3 className="text-2xl font-bold text-slate-900 font-display tabular-nums">
                    {stepAnalysis.sifir} × {stepAnalysis.multiplier}
                  </h3>
                </div>
                <button
                  onClick={onToggleAutoPlay}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isAutoPlaying
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isAutoPlaying ? 'Sedang Auto-Main...' : 'Auto-Main Roda'}
                </button>
              </div>

              {/* Step 1: Cari Digit Sa */}
              {learnSubStep >= 1 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>Langkah 1 · Cari Digit Sa</span>
                    <span className="font-mono">Kunci {stepAnalysis.action.display}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center text-center bg-white rounded-lg p-2.5 border border-amber-100 tabular-nums">
                    <div>
                      <p className="text-[10px] text-slate-500">Sa Lama ({stepAnalysis.sifir}×{stepAnalysis.prevMultiplier})</p>
                      <p className="text-xl font-bold font-mono text-slate-800">{stepAnalysis.prevSa}</p>
                    </div>
                    <div className="text-base font-bold font-mono text-amber-600">
                      {stepAnalysis.action.display} →
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-700 font-semibold">Sa Baru</p>
                      <p className="text-2xl font-bold font-mono text-amber-700">{stepAnalysis.currSa}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stepAnalysis.saWrapExplanation}
                  </p>
                </div>
              )}

              {/* Step 2: Cari Digit Puluh */}
              {learnSubStep >= 2 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span>Langkah 2 · Cari Digit Puluh</span>
                    <span>
                      {stepAnalysis.isSaDecreasing ? 'Peraturan A (+1)' : 'Peraturan B (Kekal)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 items-center text-center bg-white rounded-lg p-2.5 border border-indigo-100 tabular-nums">
                    <div>
                      <p className="text-[10px] text-slate-500">Puluh Lama</p>
                      <p className="text-xl font-bold font-mono text-slate-800">{stepAnalysis.prevPuluh}</p>
                    </div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        stepAnalysis.isSaDecreasing ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {stepAnalysis.isSaDecreasing ? '+ 1 (Sa Turun)' : '+ 0 (Kekal)'}
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-700 font-semibold">Puluh Baru</p>
                      <p className="text-2xl font-bold font-mono text-indigo-700">{stepAnalysis.currPuluh}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stepAnalysis.puluhRuleExplanation}
                  </p>
                </div>
              )}

              {/* Step 3: Final Combined Result */}
              {learnSubStep >= 3 && (
                <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-300">Jawapan Lengkap (Puluh + Sa)</p>
                    <p className="text-sm font-semibold text-indigo-200 mt-0.5 tabular-nums">
                      {stepAnalysis.sifir} × {stepAnalysis.multiplier} = {stepAnalysis.currPuluh} (Puluh) & {stepAnalysis.currSa} (Sa)
                    </p>
                  </div>
                  <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                    {stepAnalysis.currResult < 10
                      ? `0${stepAnalysis.currResult}`
                      : stepAnalysis.currResult}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              {learnSubStep < 3 ? (
                <button
                  onClick={onAdvanceLearnSubStep}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Teruskan ke Langkah {learnSubStep + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const nextM = stepAnalysis.multiplier < 10 ? stepAnalysis.multiplier + 1 : 1;
                    onSelectMultiplier(nextM);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {stepAnalysis.multiplier < 10
                      ? `Sektor Seterusnya (${stepAnalysis.sifir} × ${stepAnalysis.multiplier + 1})`
                      : 'Ulang Semula dari Sektor 1'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : mode === 'guided' ? (
          /* ================= MODE 2: LATIHAN BERPANDU 2-LANGKAH ================= */
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-xs font-semibold text-indigo-600">
                    Latihan Berpandu 2-Langkah
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-display tabular-nums">
                    Kira {stepAnalysis.sifir} × {stepAnalysis.multiplier}
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-500 tabular-nums">
                  <p>Sebelum ({stepAnalysis.sifir}×{stepAnalysis.prevMultiplier}):</p>
                  <p className="font-mono font-bold text-slate-800">
                    Puluh {stepAnalysis.prevPuluh} · Sa {stepAnalysis.prevSa}
                  </p>
                </div>
              </div>

              {/* Phase 1: Ask Digit Sa */}
              {guidedPhase === 'sa' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-bold text-amber-900">
                      Langkah 1: Apakah Digit Sa Baru?
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Sa Lama ialah <strong>{stepAnalysis.prevSa}</strong>. Gunakan kunci Sifir {stepAnalysis.sifir} (<strong>{stepAnalysis.action.display}</strong>).
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleGuidedSaPick(d)}
                        className="py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 font-mono font-bold text-base text-slate-900 transition-colors cursor-pointer tabular-nums"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 2a: Ask Puluh Rule (A vs B) */}
              {guidedPhase === 'puluh_rule' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
                    <span>Langkah 1 Betul! Digit Sa Baru = <strong>{selectedSa}</strong></span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 space-y-2">
                    <p className="text-xs font-bold text-indigo-950">
                      Langkah 2A: Bandingkan Sa Lama ({stepAnalysis.prevSa}) → Sa Baru ({stepAnalysis.currSa})
                    </p>
                    <p className="text-xs text-indigo-800">
                      Adakah nilai digit Sa menurun atau menaik/kekal?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleGuidedRulePick('A')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 text-left transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-bold text-red-600">Peraturan A · Sa Menurun</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Tambah 1 pada Puluh Lama</p>
                      </button>
                      <button
                        onClick={() => handleGuidedRulePick('B')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 text-left transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-bold text-emerald-600">Peraturan B · Sa Menaik / Kekal</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Kekalkan Puluh Lama</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2b: Ask Puluh Digit */}
              {guidedPhase === 'puluh_digit' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3">
                    <p className="text-xs font-bold text-indigo-950">
                      Langkah 2B: Apakah Digit Puluh Baru? (Sa Baru = {selectedSa})
                    </p>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Puluh Lama ialah <strong>{stepAnalysis.prevPuluh}</strong> dan anda memilih{' '}
                      <strong>
                        {selectedPuluhRule === 'A' ? 'Tambah 1 (+1)' : 'Puluh Kekal (+0)'}
                      </strong>.
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleGuidedPuluhPick(d)}
                        className="py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 font-mono font-bold text-base text-slate-900 transition-colors cursor-pointer tabular-nums"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Hint Box when student makes a mistake */}
              {guidedHint && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 flex items-start gap-2 text-xs text-amber-950">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{guidedHint}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= MODE 3: CABARAN PANTAS (TIME ATTACK) ================= */
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-xs font-semibold text-emerald-700">
                    Mod Cabaran Pantas · Masukkan 2 Digit
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-display tabular-nums">
                    {stepAnalysis.sifir} × {stepAnalysis.multiplier} = ?
                  </h3>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xl font-bold tabular-nums min-w-[64px] text-center">
                  {speedInput || '__'}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSpeedDigitPress(d)}
                    className="py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 font-mono font-bold text-lg text-slate-900 active:scale-95 transition-all cursor-pointer tabular-nums"
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSpeedInput('')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Padam Digit
                </button>
                <span className="text-[11px] text-slate-500">
                  Tip: Untuk jawapan 1 digit (contoh 8), taip <strong>8</strong> atau <strong>08</strong>
                </span>
              </div>

              {speedFeedback && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950">
                  {speedFeedback}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
