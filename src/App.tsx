/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Peer, { DataConnection } from 'peerjs';
import {
  AssessmentRecord,
  InteractionMode,
  LeaderboardEntry,
  MasteryStore,
  Student,
  SynergyScanPayload,
  WorkspaceTab,
} from './types/krd';
import {
  computeKRDStep,
  computeStudentDiagnostic,
  getStudentKey,
} from './utils/krdEngine';
import { soundFX } from './utils/sound';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { InteractiveWheelStage } from './components/InteractiveWheelStage';
import { SmartControlDeck } from './components/SmartControlDeck';
import {
  ClassroomPBDManager,
  PrintJobConfig,
} from './components/ClassroomPBDManager';
import { LCDClassroomView } from './components/LCDClassroomView';
import { SynergyQRHub } from './components/SynergyQRHub';
import { PrintableWorksheetArea } from './components/PrintableWorksheetArea';

const DEFAULT_DEMO_STUDENTS: Student[] = [
  { name: 'Ahmad Danial Bin Razak', kls: '4 INTAN' },
  { name: 'Nur Aisyah Binti Kamal', kls: '4 INTAN' },
  { name: 'Muhammad Harith Bin Zaidi', kls: '4 INTAN' },
  { name: 'Siti Sarah Binti Roslan', kls: '4 BERLIAN' },
  { name: 'Chong Wei Liang', kls: '4 BERLIAN' },
  { name: 'Kavitha A/P Rajan', kls: '4 BERLIAN' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('wheel');

  // Persistent LocalStorage State (backward-compatible with krd_students_v3 & krd_records_v3)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem('krd_students_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to demo students
    }
    return DEFAULT_DEMO_STUDENTS;
  });

  const [records, setRecords] = useState<AssessmentRecord[]>(() => {
    try {
      const raw = localStorage.getItem('krd_records_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to empty
    }
    return [];
  });

  const [masteryStore, setMasteryStore] = useState<MasteryStore>(() => {
    try {
      const raw = localStorage.getItem('krd_mastery_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return {};
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('krd_students_v3', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('krd_records_v3', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('krd_mastery_v1', JSON.stringify(masteryStore));
  }, [masteryStore]);

  // Active Student Selection
  const [selectedClass, setSelectedClass] = useState<string>('4 INTAN');
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    return students[0] || null;
  });

  // Wheel & Pedagogical State
  const [mode, setMode] = useState<InteractionMode>('learn');
  const [currentSifir, setCurrentSifir] = useState<number | null>(2);
  const [activeMultiplier, setActiveMultiplier] = useState<number | null>(1);
  const [learnSubStep, setLearnSubStep] = useState<number>(1);
  const [revealedSectors, setRevealedSectors] = useState<Record<number, string>>({});
  const [sectorStatuses, setSectorStatuses] = useState<
    Record<number, 'correct' | 'assisted' | 'pending'>
  >({});
  const [score, setScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Print Job State
  const [printJob, setPrintJob] = useState<PrintJobConfig | null>(null);

  // Synergy (PeerJS) & Live Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [synergyRole, setSynergyRole] = useState<'none' | 'host' | 'client'>('none');
  const [synergyCode, setSynergyCode] = useState<string | null>(null);
  const [isSynergyConnected, setIsSynergyConnected] = useState<boolean>(false);
  const [synergyStatusText, setSynergyStatusText] = useState<string>('Mod Luar Talian');
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(null), 3200);
  };

  // Practice Timer Effect
  useEffect(() => {
    if (!isTimerRunning || mode === 'learn') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, mode]);

  // Auto-Play Effect in Learn Mode
  useEffect(() => {
    if (!isAutoPlaying || mode !== 'learn' || !currentSifir) return;
    const timer = setTimeout(() => {
      const m = activeMultiplier || 1;
      if (learnSubStep < 3) {
        const nextStep = learnSubStep + 1;
        setLearnSubStep(nextStep);
        if (nextStep === 3) {
          const stepInfo = computeKRDStep(currentSifir, m);
          const formatted =
            stepInfo.currResult < 10
              ? `0${stepInfo.currResult}`
              : `${stepInfo.currResult}`;
          setRevealedSectors((prev) => ({ ...prev, [m]: formatted }));
          setSectorStatuses((prev) => ({ ...prev, [m]: 'correct' }));
          soundFX.playTap();
        }
      } else {
        if (m < 10) {
          setActiveMultiplier(m + 1);
          setLearnSubStep(1);
        } else {
          setIsAutoPlaying(false);
        }
      }
    }, 1300);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, mode, currentSifir, activeMultiplier, learnSubStep]);

  const resetWheelSession = (nextSifir: number | null = currentSifir, nextMode: InteractionMode = mode) => {
    setCurrentSifir(nextSifir);
    setActiveMultiplier(nextSifir ? 1 : null);
    setLearnSubStep(1);
    setRevealedSectors({});
    setSectorStatuses({});
    setScore({ correct: 0, total: 0 });
    setElapsedSeconds(0);
    setIsTimerRunning(nextMode !== 'learn' && nextSifir !== null);
    setIsAutoPlaying(false);
  };

  const handleSelectSifir = (sifir: number) => {
    soundFX.playTap();
    resetWheelSession(sifir, mode);
  };

  const handleSetMode = (nextMode: InteractionMode) => {
    soundFX.playTap();
    setMode(nextMode);
    resetWheelSession(currentSifir, nextMode);
  };

  const handleSelectMultiplier = (m: number) => {
    soundFX.playTap();
    setIsAutoPlaying(false);
    setActiveMultiplier(m);
    setLearnSubStep(1);
    if (mode !== 'learn' && !isTimerRunning) {
      setIsTimerRunning(true);
    }
  };

  const handleAdvanceLearnSubStep = () => {
    if (!currentSifir || !activeMultiplier) return;
    soundFX.playTap();
    const next = learnSubStep + 1;
    setLearnSubStep(next);
    if (next === 3) {
      const info = computeKRDStep(currentSifir, activeMultiplier);
      const formatted =
        info.currResult < 10 ? `0${info.currResult}` : `${info.currResult}`;
      setRevealedSectors((prev) => ({ ...prev, [activeMultiplier]: formatted }));
      setSectorStatuses((prev) => ({ ...prev, [activeMultiplier]: 'correct' }));
    }
  };

  const handleCompleteSector = (
    multiplier: number,
    answerStr: string,
    wasCleanCorrect: boolean,
    saErrorCount: number,
    puluhErrorCount: number
  ) => {
    if (!currentSifir) return;

    const studentName = activeStudent?.name || 'Tetamu';
    const studentClass = activeStudent?.kls || 'KENDIRI';
    const studentKey = getStudentKey(studentName, studentClass);

    // Update Diagnostic Telemetry Store
    if (saErrorCount > 0 || puluhErrorCount > 0) {
      setMasteryStore((prev) => {
        const studentObj = prev[studentKey] || {};
        const sifirObj = studentObj[currentSifir] || {
          saErrors: 0,
          puluhErrors: 0,
          weakMultipliers: {},
        };
        return {
          ...prev,
          [studentKey]: {
            ...studentObj,
            [currentSifir]: {
              saErrors: sifirObj.saErrors + saErrorCount,
              puluhErrors: sifirObj.puluhErrors + puluhErrorCount,
              weakMultipliers: {
                ...sifirObj.weakMultipliers,
                [multiplier]: (sifirObj.weakMultipliers[multiplier] || 0) + 1,
              },
            },
          },
        };
      });
    }

    const updatedRevealed = { ...revealedSectors, [multiplier]: answerStr };
    const alreadyDone = revealedSectors[multiplier] !== undefined;

    setRevealedSectors(updatedRevealed);
    setSectorStatuses((prev) => ({
      ...prev,
      [multiplier]: wasCleanCorrect ? 'correct' : 'assisted',
    }));

    const nextCorrect = alreadyDone
      ? score.correct
      : score.correct + (wasCleanCorrect ? 1 : 0);
    const nextTotal = alreadyDone ? score.total : score.total + 1;
    setScore({ correct: nextCorrect, total: nextTotal });

    // Check if all 10 sectors are now complete!
    const completedCount = Object.keys(updatedRevealed).length;
    if (completedCount >= 10) {
      setIsTimerRunning(false);
      soundFX.playFanfare();
      try {
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
      } catch {
        // Ignore in headless environments
      }

      const finalTime = Math.max(1, elapsedSeconds);
      const newRecord: AssessmentRecord = {
        name: studentName,
        kls: studentClass,
        sifir: currentSifir,
        score: nextCorrect,
        maxScore: 10,
        time: finalTime,
        date: new Date().toLocaleDateString('ms-MY'),
        mode: mode === 'guided' ? 'guided' : 'speed',
      };
      setRecords((prev) => [...prev, newRecord]);
      setActiveMultiplier(null);
      showToast(
        `Syabas ${studentName}! Sifir ${currentSifir} selesai · Skor ${nextCorrect}/10 (${finalTime}s)`
      );
    } else {
      // Automatically move to next unanswered multiplier (1..10)
      for (let offset = 1; offset <= 10; offset++) {
        const candidate = ((multiplier - 1 + offset) % 10) + 1;
        if (updatedRevealed[candidate] === undefined) {
          setActiveMultiplier(candidate);
          break;
        }
      }
    }
  };

  // Synergy (PeerJS) Handlers
  const handleProcessScanPayload = (payload: SynergyScanPayload) => {
    const timeSec = payload.timeSec || 60;
    const m = Math.floor(timeSec / 60);
    const s = timeSec % 60;
    const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

    // Save to local gradebook records
    const newRecord: AssessmentRecord = {
      name: payload.name,
      kls: payload.kls,
      sifir: payload.sifir,
      score: payload.score,
      maxScore: payload.maxScore,
      time: timeSec,
      date: new Date().toLocaleDateString('ms-MY'),
      mode: 'paper',
    };
    setRecords((prev) => [...prev, newRecord]);

    // Add or update Live Leaderboard
    setLeaderboard((prev) => {
      const filtered = prev.filter(
        (item) => !(item.name === payload.name && item.kls === payload.kls)
      );
      return [
        ...filtered,
        {
          id: `${payload.name}-${payload.kls}-${Date.now()}`,
          name: payload.name,
          kls: payload.kls,
          sifir: payload.sifir,
          score: payload.score,
          maxScore: payload.maxScore,
          timeStr,
          timestamp: timeSec,
        },
      ];
    });

    // If connected as Client (Teacher Phone), also send over PeerJS to Host LCD
    if (synergyRole === 'client' && connRef.current && connRef.current.open) {
      connRef.current.send({
        type: 'SCAN_ENTRY',
        payload,
      });
    }

    showToast(
      `Rekod ${payload.name} (${payload.score}/${payload.maxScore}) dikemas kini!`
    );
  };

  const handleStartHostSession = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const peerId = `cx-${code}`;
    if (peerRef.current) peerRef.current.destroy();

    setSynergyRole('host');
    setSynergyCode(code);
    setIsSynergyConnected(false);
    setSynergyStatusText(`Menunggu Telefon (${code})`);

    try {
      const peer = new Peer(peerId);
      peerRef.current = peer;

      peer.on('open', () => {
        setSynergyStatusText(`Host Sedia · Kod: ${code}`);
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        setIsSynergyConnected(true);
        setSynergyStatusText(`Telefon Tersambung (${code})`);
        soundFX.playBeep();
        showToast('Telefon Guru berjaya disambungkan ke Skrin LCD!');

        conn.on('data', (raw: unknown) => {
          const msg = raw as { type?: string; payload?: SynergyScanPayload };
          if (msg && msg.type === 'SCAN_ENTRY' && msg.payload) {
            soundFX.playBeep();
            handleProcessScanPayload(msg.payload);
          }
        });
      });

      peer.on('error', () => {
        setSynergyStatusText('Ralat Rangkaian PeerJS');
      });
    } catch {
      setSynergyStatusText('Mod Tempatan Aktif');
    }
  };

  const handleJoinClientSession = (codeInput: string) => {
    const cleanCode = codeInput.trim().toUpperCase();
    if (!cleanCode) return;
    if (peerRef.current) peerRef.current.destroy();

    setSynergyRole('client');
    setSynergyCode(cleanCode);
    setSynergyStatusText(`Menyambung ke ${cleanCode}...`);

    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(`cx-${cleanCode}`);
        connRef.current = conn;

        conn.on('open', () => {
          setIsSynergyConnected(true);
          setSynergyStatusText(`Tersambung ke LCD (${cleanCode})`);
          soundFX.playBeep();
          showToast('Berjaya disambungkan ke Skrin LCD!');
        });

        conn.on('error', () => {
          setSynergyStatusText('Gagal menyambung ke Host');
        });
      });
    } catch {
      setSynergyStatusText('Ralat Sambungan');
    }
  };

  // Trigger Print Worksheet Job
  const handleTriggerPrintJob = (job: PrintJobConfig) => {
    setPrintJob(job);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const currentDiagnostic = computeStudentDiagnostic(
    activeStudent?.name || 'Tetamu',
    activeStudent?.kls || 'KENDIRI',
    records,
    masteryStore
  );

  const showSaCycleHighlight =
    Boolean(currentSifir && activeMultiplier) &&
    (mode === 'learn' || mode === 'guided');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <a
          href="#wheel"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('wheel');
          }}
          className="text-xl font-extrabold tracking-tight text-indigo-950 font-display whitespace-nowrap shrink-0"
        >
          CirculoX
        </a>

        {/* Zone 2: 4 Single-Line Text Navigation Links */}
        <nav className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-semibold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'wheel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Roda Sifir
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'records'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Rekod & PBD
          </button>
          <button
            onClick={() => setActiveTab('lcd')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'lcd'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Paparan LCD
          </button>
          <button
            onClick={() => setActiveTab('synergy')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'synergy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sinergi QR
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            onClick={() =>
              setActiveTab(activeTab === 'synergy' ? 'wheel' : 'synergy')
            }
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeTab === 'synergy' ? 'Kembali ke Roda' : 'Imbas QR'}
          </button>
        </div>
      </header>

      {/* Main Workspace Container (1440px Baseline) */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-5">
        {activeTab === 'wheel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Zone (60% / 7 Cols): Interactive Stage */}
            <div className="lg:col-span-7">
              <InteractiveWheelStage
                currentSifir={currentSifir}
                activeMultiplier={activeMultiplier}
                mode={mode}
                revealedSectors={revealedSectors}
                sectorStatuses={sectorStatuses}
                showSaCycleHighlight={showSaCycleHighlight}
                onSelectSifir={handleSelectSifir}
                onSelectMultiplier={handleSelectMultiplier}
              />
            </div>

            {/* Right Zone (40% / 5 Cols): Smart Control & Concept Deck */}
            <div className="lg:col-span-5">
              <SmartControlDeck
                students={students}
                selectedClass={selectedClass}
                activeStudent={activeStudent}
                diagnostic={currentDiagnostic}
                mode={mode}
                currentSifir={currentSifir}
                activeMultiplier={activeMultiplier}
                learnSubStep={learnSubStep}
                revealedSectors={revealedSectors}
                elapsedSeconds={elapsedSeconds}
                score={score}
                isAutoPlaying={isAutoPlaying}
                onSelectClass={(kls) => {
                  setSelectedClass(kls);
                  const firstInClass =
                    students.find((s) => s.kls === kls) || null;
                  setActiveStudent(firstInClass);
                }}
                onSelectStudent={(st) => setActiveStudent(st)}
                onSetMode={handleSetMode}
                onSelectSifir={handleSelectSifir}
                onSelectMultiplier={handleSelectMultiplier}
                onAdvanceLearnSubStep={handleAdvanceLearnSubStep}
                onToggleAutoPlay={() => setIsAutoPlaying((prev) => !prev)}
                onResetSession={() => resetWheelSession(currentSifir, mode)}
                onCompleteSector={handleCompleteSector}
              />
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <ClassroomPBDManager
            students={students}
            records={records}
            masteryStore={masteryStore}
            onAddBulkStudents={(bulkText) => {
              const parsed: Student[] = [];
              bulkText.split('\n').forEach((line) => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                  const name = parts[0].trim();
                  const kls = parts[1].trim().toUpperCase();
                  if (name && kls) parsed.push({ name, kls });
                }
              });
              if (parsed.length > 0) {
                setStudents((prev) => [...prev, ...parsed]);
                showToast(`${parsed.length} murid baharu ditambah!`);
              }
            }}
            onRemoveStudent={(idx) => {
              setStudents((prev) => prev.filter((_, i) => i !== idx));
            }}
            onAddRecord={(rec) => {
              setRecords((prev) => [...prev, rec]);
              showToast(`Rekod Sifir ${rec.sifir} untuk ${rec.name} disimpan!`);
            }}
            onImportDatabase={(newStudents, newRecords) => {
              setStudents(newStudents);
              setRecords(newRecords);
              showToast('Pangkalan data berjaya dipulihkan!');
            }}
            onClearAllData={() => {
              setRecords([]);
              setMasteryStore({});
              showToast('Semua rekod markah telah dikosongkan.');
            }}
            onTriggerPrintJob={handleTriggerPrintJob}
          />
        )}

        {activeTab === 'lcd' && (
          <LCDClassroomView
            students={students}
            leaderboard={leaderboard}
            synergyCode={synergyCode}
            isSynergyConnected={isSynergyConnected}
            onOpenSynergyTab={() => setActiveTab('synergy')}
            onClearLeaderboard={() => setLeaderboard([])}
            onAddQuizEntry={(entry) =>
              setLeaderboard((prev) => [...prev, entry])
            }
          />
        )}

        {activeTab === 'synergy' && (
          <SynergyQRHub
            students={students}
            synergyRole={synergyRole}
            synergyCode={synergyCode}
            isSynergyConnected={isSynergyConnected}
            synergyStatusText={synergyStatusText}
            onStartHostSession={handleStartHostSession}
            onJoinClientSession={handleJoinClientSession}
            onProcessScanPayload={handleProcessScanPayload}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-200/70 bg-white">
        CirculoX Pintar · Inovasi Kit Roda Darab Interaktif & Sistem Pengurusan PdP Bilik Darjah (by dz.)
      </footer>

      {/* Toast Notification */}
      {toastBanner && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-xl border border-slate-700">
          {toastBanner}
        </div>
      )}

      {/* Offline Banner */}
      <OfflineIndicator />

      {/* Hidden Printable Worksheet DOM for window.print() */}
      <PrintableWorksheetArea job={printJob} />
    </div>
  );
}
