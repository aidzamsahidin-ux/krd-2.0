import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  QrCode,
  Radio,
  Smartphone,
  Sparkles,
  StopCircle,
} from 'lucide-react';
import { Student, SynergyScanPayload } from '../types/krd';
import { soundFX } from '../utils/sound';

interface SynergyQRHubProps {
  students: Student[];
  synergyRole: 'none' | 'host' | 'client';
  synergyCode: string | null;
  isSynergyConnected: boolean;
  synergyStatusText: string;
  onStartHostSession: () => void;
  onJoinClientSession: (code: string) => void;
  onProcessScanPayload: (payload: SynergyScanPayload) => void;
}

export const SynergyQRHub: React.FC<SynergyQRHubProps> = ({
  students,
  synergyRole,
  synergyCode,
  isSynergyConnected,
  synergyStatusText,
  onStartHostSession,
  onJoinClientSession,
  onProcessScanPayload,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanned or Selected Student for Smart Grading
  const [detectedStudent, setDetectedStudent] = useState<Student | null>(
    students[0] || null
  );
  const [selectedSifir, setSelectedSifir] = useState<number>(0); // 0 = Set Lengkap (80m), 1..9 = Sifir spesifik (10m)
  const [enteredScore, setEnteredScore] = useState<number>(80);
  const [enteredTimeSec, setEnteredTimeSec] = useState<number>(120);
  const [recentSubmissionToast, setRecentSubmissionToast] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, []);

  const handleToggleCamera = async () => {
    setCameraError(null);
    if (isCameraActive && scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop error
      }
      scannerRef.current = null;
      setIsCameraActive(false);
      return;
    }

    try {
      const qr = new Html5Qrcode('qr-reader');
      scannerRef.current = qr;
      setIsCameraActive(true);

      await qr.start(
        { facingMode: 'environment' },
        { fps: 20, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (decodedText.startsWith('LOGIN:')) {
            const parts = decodedText.replace('LOGIN:', '').split('|');
            if (parts.length >= 2) {
              soundFX.playBeep();
              setDetectedStudent({
                name: parts[0].trim(),
                kls: parts[1].trim(),
              });
            }
          }
        },
        () => {}
      );
    } catch {
      setIsCameraActive(false);
      setCameraError(
        'Kamera tidak dapat diakses pada pelayar ini. Anda masih boleh memilih murid di bawah untuk menghantar skor ke LCD & Rekod.'
      );
    }
  };

  const handleSifirPick = (s: number) => {
    setSelectedSifir(s);
    if (s === 0) {
      setEnteredScore(80);
    } else {
      setEnteredScore(10);
    }
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectedStudent) return;

    const maxScore = selectedSifir === 0 ? 80 : 10;
    const clampedScore = Math.min(maxScore, Math.max(0, Number(enteredScore)));

    soundFX.playCorrect();
    onProcessScanPayload({
      name: detectedStudent.name,
      kls: detectedStudent.kls,
      sifir: selectedSifir,
      score: clampedScore,
      maxScore,
      timeSec: Math.max(5, Number(enteredTimeSec)),
    });

    setRecentSubmissionToast(
      `Rekod ${detectedStudent.name} (${clampedScore}/${maxScore}) berjaya disimpan & dihantar!`
    );
    setTimeout(() => setRecentSubmissionToast(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 6 Cols: Sinergi Device Pairing (Host LCD vs Teacher Phone) */}
      <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                01. Sinergi Peranti (Telefon Guru ↔ Paparan LCD)
              </h2>
              <p className="text-xs text-slate-500">
                Sambungkan telefon pintar guru sebagai pengimbas kod QR jarak jauh ke komputer LCD kelas
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700">
            {synergyStatusText}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Host Box (Komputer LCD) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-indigo-700">
                Pilihan A · Komputer Skrin LCD (Host)
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Jana kod sesi 5-digit pada komputer yang disambungkan ke projektor kelas.
              </p>
            </div>

            <div className="py-3 px-4 rounded-xl bg-white border border-slate-200 text-center">
              <p className="text-[10px] font-semibold text-slate-400">
                KOD SESI SINERGI
              </p>
              <p className="text-3xl font-mono font-bold tracking-widest text-slate-900 mt-0.5 select-all">
                {synergyCode || '-----'}
              </p>
            </div>

            <button
              onClick={onStartHostSession}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {synergyCode ? 'Jana Kod Sesi Baharu' : 'Aktifkan Mod Host LCD'}
            </button>
          </div>

          {/* Client Box (Telefon Pintar Guru) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Pilihan B · Telefon Guru (Pengimbas)</span>
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Masukkan kod 5-digit yang tertera di skrin LCD untuk menghantar markah secara langsung.
              </p>
            </div>

            <input
              type="text"
              maxLength={5}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="CONTOH: A7B2X"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-mono text-xl font-bold uppercase tracking-widest text-slate-900 outline-none focus:border-indigo-500"
            />

            <button
              onClick={() => {
                if (joinCodeInput.trim()) {
                  onJoinClientSession(joinCodeInput.trim());
                }
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isSynergyConnected && synergyRole === 'client'
                ? 'Tersambung ke LCD'
                : 'Sambung ke Skrin LCD'}
            </button>
          </div>
        </div>
      </section>

      {/* Right 6 Cols: Smart Camera QR Scanner & Instant Score Grader */}
      <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                02. Pengimbas QR & Pemarkahan Pintar
              </h2>
              <p className="text-xs text-slate-500">
                Imbas Kod QR pada kertas murid atau pilih murid untuk merekodkan sifir, skor, dan masa
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleCamera}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isCameraActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {isCameraActive ? (
              <>
                <StopCircle className="w-4 h-4" />
                <span>Tutup Kamera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Buka Kamera QR</span>
              </>
            )}
          </button>
        </div>

        {/* Camera Viewport Container */}
        <div
          className={`w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center ${
            isCameraActive ? 'min-h-[260px]' : 'h-24'
          }`}
        >
          <div id="qr-reader" className="w-full max-w-xs" />
          {!isCameraActive && (
            <p className="text-xs text-slate-400 px-4 text-center">
              Tekan <strong>Buka Kamera QR</strong> untuk mengimbas kod QR lembaran kerja murid, atau pilih murid secara terus di bawah.
            </p>
          )}
        </div>

        {cameraError && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            {cameraError}
          </div>
        )}

        {/* Smart Grading Form */}
        <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Murid Dikesan / Dipilih
            </label>
            <select
              value={detectedStudent ? `${detectedStudent.name}|${detectedStudent.kls}` : ''}
              onChange={(e) => {
                const parts = e.target.value.split('|');
                if (parts.length >= 2) {
                  setDetectedStudent({ name: parts[0], kls: parts[1] });
                }
              }}
              aria-label="Pilih Murid"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
            >
              {students.length === 0 && (
                <option value="">Sila tambah murid di tab Rekod & PBD dahulu</option>
              )}
              {students.map((s) => (
                <option key={`${s.name}|${s.kls}`} value={`${s.name}|${s.kls}`}>
                  {s.name} ({s.kls})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Sifir / Jenis Lembaran Kerja
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              <button
                type="button"
                onClick={() => handleSifirPick(0)}
                className={`py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  selectedSifir === 0
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                2–9
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSifirPick(s)}
                  className={`py-2 rounded-xl border font-mono text-xs font-bold cursor-pointer ${
                    selectedSifir === s
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ×{s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Skor Betul (/{selectedSifir === 0 ? 80 : 10})
              </label>
              <input
                type="number"
                min={0}
                max={selectedSifir === 0 ? 80 : 10}
                value={enteredScore}
                onChange={(e) => setEnteredScore(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masa Diambil (Saat)
              </label>
              <input
                type="number"
                min={1}
                max={1800}
                value={enteredTimeSec}
                onChange={(e) => setEnteredTimeSec(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-lg font-bold text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!detectedStudent}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSynergyConnected && synergyRole === 'client'
                ? 'Hantar Skor Terus ke Skrin LCD'
                : 'Simpan Rekod & Hantar ke Carta LCD'}
            </span>
          </button>

          {recentSubmissionToast && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{recentSubmissionToast}</span>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};
