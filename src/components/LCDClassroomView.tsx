import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  Play,
  Radio,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { LeaderboardEntry, Student } from '../types/krd';
import { KRD_ACTIONS, computeKRDStep } from '../utils/krdEngine';
import { soundFX } from '../utils/sound';

interface LCDClassroomViewProps {
  students: Student[];
  leaderboard: LeaderboardEntry[];
  synergyCode: string | null;
  isSynergyConnected: boolean;
  onOpenSynergyTab: () => void;
  onClearLeaderboard: () => void;
  onAddQuizEntry: (entry: LeaderboardEntry) => void;
}

export const LCDClassroomView: React.FC<LCDClassroomViewProps> = ({
  students,
  leaderboard,
  synergyCode,
  isSynergyConnected,
  onOpenSynergyTab,
  onClearLeaderboard,
  onAddQuizEntry,
}) => {
  const [lcdSubMode, setLcdSubMode] = useState<'race' | 'quiz'>('race');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [durationPreset, setDurationPreset] = useState<number>(600);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showPodium, setShowPodium] = useState<boolean>(false);

  // Live Classroom Wheel Quiz State
  const [quizSifir, setQuizSifir] = useState<number>(7);
  const [quizMultiplier, setQuizMultiplier] = useState<number>(8);
  const [revealQuizStep, setRevealQuizStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedQuizStudent, setSelectedQuizStudent] = useState<string>('');

  const uniqueClasses = Array.from(new Set(students.map((s) => s.kls))).sort();

  const filteredLeaderboard = leaderboard
    .filter((item) => classFilter === 'all' || item.kls === classFilter)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp - b.timestamp;
    });

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          triggerPodiumCelebration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const triggerPodiumCelebration = () => {
    setShowPodium(true);
    soundFX.playFanfare();
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore confetti errors in headless environments
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setShowPodium(false);
    const total = durationPreset === -1 ? customMinutes * 60 : durationPreset;
    setTimeLeft(total);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRandomizeQuizQuestion = () => {
    soundFX.playTap();
    const randomSifir = Math.floor(Math.random() * 8) + 2; // 2..9
    const randomMult = Math.floor(Math.random() * 8) + 2; // 2..9
    setQuizSifir(randomSifir);
    setQuizMultiplier(randomMult);
    setRevealQuizStep(0);
  };

  const handleAwardQuizPoint = () => {
    const target =
      students.find((s) => `${s.name}|${s.kls}` === selectedQuizStudent) ||
      students[0];
    if (!target) return;
    soundFX.playCorrect();
    onAddQuizEntry({
      id: `${Date.now()}`,
      name: target.name,
      kls: target.kls,
      sifir: quizSifir,
      score: 10,
      maxScore: 10,
      timeStr: 'Kuiz Pantas',
      timestamp: 1,
    });
  };

  const quizAnalysis = computeKRDStep(quizSifir, quizMultiplier);
  const topThree = filteredLeaderboard.slice(0, 3);
  const runnerUps = filteredLeaderboard.slice(3, 11);

  return (
    <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 min-h-[78vh] flex flex-col justify-between">
      {/* Top LCD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenSynergyTab}
            className="flex items-center gap-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-4 py-2.5 text-left transition-colors cursor-pointer"
          >
            <Radio
              className={`w-5 h-5 ${
                isSynergyConnected ? 'text-emerald-400' : 'text-indigo-400'
              }`}
            />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                Status Sinergi Telefon Guru
              </p>
              <p className="text-xs font-bold text-white">
                {isSynergyConnected
                  ? `Tersambung (${synergyCode})`
                  : synergyCode
                    ? `Kod Sesi: ${synergyCode} (Menunggu...)`
                    : 'Klik untuk Sambung Telefon'}
              </p>
            </div>
          </button>

          {/* Sub-mode Toggle: Lumba Kertas QR vs Kuiz Roda Kelas */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                setLcdSubMode('race');
                setShowPodium(false);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                lcdSubMode === 'race'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1. Mod Lumba Kertas (QR)
            </button>
            <button
              onClick={() => {
                setLcdSubMode('quiz');
                setShowPodium(false);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                lcdSubMode === 'quiz'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2. Mod Kuiz Kelas Langsung
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Tapis Kelas di LCD"
            className="rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              showPodium ? setShowPodium(false) : triggerPodiumCelebration()
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>{showPodium ? 'Tutup Podium' : 'Papar Podium Pemenang'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {showPodium ? (
        /* ================= PODIUM PEMENANG TOP 3 ================= */
        <div className="my-auto py-8 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold mb-2">
            <Trophy className="w-5 h-5" />
            <span>Keputusan Rasmi Cabaran CirculoX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white mb-10">
            Podium Pemenang Terpantas & Tepat
          </h2>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 items-end w-full max-w-4xl px-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <p className="text-sm sm:text-lg font-bold text-white truncate max-w-full">
                {topThree[1]?.name || '—'}
              </p>
              <p className="text-xs font-mono text-slate-400 mb-3 tabular-nums">
                {topThree[1]
                  ? `Skor ${topThree[1].score}/${topThree[1].maxScore} · ${topThree[1].timeStr}`
                  : 'Tiada peserta'}
              </p>
              <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-slate-700 border-t-4 border-slate-400 flex flex-col items-center justify-start pt-4">
                <span className="text-3xl sm:text-4xl font-bold font-display text-slate-300">
                  2
                </span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <Award className="w-8 h-8 text-amber-400 mb-1" />
              <p className="text-base sm:text-2xl font-bold text-amber-300 truncate max-w-full">
                {topThree[0]?.name || '—'}
              </p>
              <p className="text-xs sm:text-sm font-mono text-amber-100 mb-3 tabular-nums">
                {topThree[0]
                  ? `Skor ${topThree[0].score}/${topThree[0].maxScore} · ${topThree[0].timeStr}`
                  : 'Tiada peserta'}
              </p>
              <div className="w-full h-48 sm:h-60 rounded-t-2xl bg-amber-500 text-slate-950 border-t-4 border-amber-200 flex flex-col items-center justify-start pt-5 shadow-lg">
                <span className="text-4xl sm:text-5xl font-bold font-display">
                  1
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <p className="text-sm sm:text-lg font-bold text-white truncate max-w-full">
                {topThree[2]?.name || '—'}
              </p>
              <p className="text-xs font-mono text-slate-400 mb-3 tabular-nums">
                {topThree[2]
                  ? `Skor ${topThree[2].score}/${topThree[2].maxScore} · ${topThree[2].timeStr}`
                  : 'Tiada peserta'}
              </p>
              <div className="w-full h-28 sm:h-32 rounded-t-2xl bg-amber-800/80 border-t-4 border-amber-500 flex flex-col items-center justify-start pt-3">
                <span className="text-2xl sm:text-3xl font-bold font-display text-amber-200">
                  3
                </span>
              </div>
            </div>
          </div>

          {runnerUps.length > 0 && (
            <div className="w-full max-w-4xl mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {runnerUps.map((r, i) => (
                <div
                  key={r.id}
                  className="rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs flex items-center justify-between"
                >
                  <span className="truncate pr-2 font-semibold">
                    {i + 4}. {r.name}
                  </span>
                  <span className="font-mono text-emerald-400 tabular-nums shrink-0">
                    {r.score}/{r.maxScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : lcdSubMode === 'race' ? (
        /* ================= SUB-MODE 1: LUMBA KERTAS & CARTA KEDUDUKAN ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
          {/* Giant Countdown Timer (Left 6 Cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center text-center space-y-5">
            <span className="text-xs font-semibold text-indigo-300 tracking-wider">
              Masa Ujian & Perlumbaan Sifir Bilik Darjah
            </span>
            <div className="text-7xl sm:text-8xl xl:text-9xl font-mono font-bold tracking-tight text-white tabular-nums leading-none">
              {formatTimer(timeLeft)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 bg-slate-800/90 border border-slate-700 p-3 rounded-2xl">
              <select
                value={durationPreset}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDurationPreset(val);
                  setIsRunning(false);
                  if (val !== -1) setTimeLeft(val);
                }}
                aria-label="Pilih Tempoh Masa"
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value={300}>5 Minit</option>
                <option value={600}>10 Minit</option>
                <option value={900}>15 Minit</option>
                <option value={-1}>Masa Sendiri...</option>
              </select>

              {durationPreset === -1 && (
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customMinutes}
                  onChange={(e) => {
                    const m = Math.max(1, Number(e.target.value));
                    setCustomMinutes(m);
                    setTimeLeft(m * 60);
                  }}
                  className="w-16 rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-center font-mono text-xs font-bold text-white"
                />
              )}

              <button
                onClick={() => setIsRunning((prev) => !prev)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunning ? 'Jeda Masa' : 'Mula Masa'}</span>
              </button>

              <button
                onClick={handleResetTimer}
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Live Leaderboard (Right 6 Cols) */}
          <div className="lg:col-span-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 p-5 flex flex-col h-[420px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Carta Kedudukan Langsung ({filteredLeaderboard.length})
                </h3>
              </div>
              {leaderboard.length > 0 && (
                <button
                  onClick={onClearLeaderboard}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kosongkan Carta</span>
                </button>
              )}
            </div>

            {filteredLeaderboard.length === 0 ? (
              <div className="my-auto text-center py-10 px-4 text-slate-400 space-y-2">
                <Sparkles className="w-7 h-7 text-indigo-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-200">
                  Menunggu Imbasan Kod QR Kertas Murid
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Gunakan tab <strong>Sinergi QR</strong> atau telefon pintar guru untuk mengimbas kertas murid yang telah siap.
                </p>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                {filteredLeaderboard.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {entry.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {entry.kls} · Sifir {entry.sifir === 0 ? '2–9' : entry.sifir}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono shrink-0 tabular-nums">
                      <p className="text-sm font-bold text-emerald-400">
                        {entry.score}/{entry.maxScore}
                      </p>
                      <p className="text-[11px] text-slate-400">{entry.timeStr}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= SUB-MODE 2: KUIZ KELAS LANGSUNG (INTERACTIVE PROJECTOR QUIZ) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
          <div className="lg:col-span-7 bg-slate-800/70 rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-indigo-300">
                  Kuiz Interaktif Bilik Darjah (Kaedah KRD)
                </span>
                <h2 className="text-2xl font-bold text-white mt-0.5">
                  Berapakah nilai {quizSifir} × {quizMultiplier}?
                </h2>
              </div>
              <button
                onClick={handleRandomizeQuizQuestion}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Soalan Rawak Baharu</span>
              </button>
            </div>

            {/* Quick Sifir & Multiplier Picker for Teacher */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Sifir:</span>
                {[2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuizSifir(s);
                      setRevealQuizStep(0);
                    }}
                    className={`w-7 h-7 rounded-lg font-mono font-bold cursor-pointer ${
                      quizSifir === s
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Darab:</span>
                {[2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setQuizMultiplier(m);
                      setRevealQuizStep(0);
                    }}
                    className={`w-7 h-7 rounded-lg font-mono font-bold cursor-pointer ${
                      quizMultiplier === m
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Progressive Step Reveal Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
              <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-400">
                    Langkah 1 · Digit Sa
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sa Lama ({quizSifir}×{quizMultiplier - 1} = {String(quizAnalysis.prevResult).padStart(2, '0')}) ialah{' '}
                    <strong className="text-white">{quizAnalysis.prevSa}</strong>. Kunci:{' '}
                    <strong className="text-amber-300">{quizAnalysis.action.display}</strong>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Sa Baru:</span>
                  {revealQuizStep >= 1 ? (
                    <span className="text-3xl font-mono font-bold text-amber-400">
                      {quizAnalysis.currSa}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundFX.playTap();
                        setRevealQuizStep(1);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                    >
                      Papar Langkah 1
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-400">
                    Langkah 2 · Digit Puluh
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puluh Lama ialah <strong className="text-white">{quizAnalysis.prevPuluh}</strong>. Bandingkan Sa Lama ({quizAnalysis.prevSa}) → Sa Baru.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Puluh Baru:</span>
                  {revealQuizStep >= 2 ? (
                    <span className="text-3xl font-mono font-bold text-indigo-400">
                      {quizAnalysis.currPuluh}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundFX.playTap();
                        setRevealQuizStep(2);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold cursor-pointer"
                    >
                      Papar Langkah 2
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-400">
                    Langkah 3 · Jawapan Akhir
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gabungkan Puluh Baru dan Sa Baru untuk {quizSifir} × {quizMultiplier}.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Jawapan:</span>
                  {revealQuizStep >= 3 ? (
                    <span className="text-4xl font-mono font-bold text-emerald-400">
                      {quizAnalysis.currResult}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundFX.playCorrect();
                        setRevealQuizStep(3);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Papar Jawapan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Award Points to Student */}
            {students.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80">
                <span className="text-xs text-slate-300">
                  Berikan 10 Mata Ganjaran Kuiz kepada Murid:
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedQuizStudent}
                    onChange={(e) => setSelectedQuizStudent(e.target.value)}
                    aria-label="Pilih Murid Pemenang Kuiz"
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white outline-none"
                  >
                    {students.map((s) => (
                      <option key={`${s.name}|${s.kls}`} value={`${s.name}|${s.kls}`}>
                        {s.name} ({s.kls})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAwardQuizPoint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tambah ke Carta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Compact Live Leaderboard */}
          <div className="lg:col-span-5 bg-slate-800/60 rounded-2xl border border-slate-700 p-5 flex flex-col h-[380px]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Carta Mata Kuiz & Lumba ({filteredLeaderboard.length})</span>
            </h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              {filteredLeaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="rounded-xl bg-slate-900 px-3.5 py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white truncate">
                    {idx + 1}. {entry.name} ({entry.kls})
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {entry.score}/{entry.maxScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Quick Reference Footer on LCD */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Rumus KRD: Langkah 1 Cari Sa (Garis Nombor Ajaib) · Langkah 2 Cari Puluh (Sa Turun +1, Sa Naik Kekal)</span>
        <span className="font-mono">CirculoX Bilik Darjah Pintar</span>
      </div>
    </div>
  );
};
