import React, { useState } from 'react';
import {
  Award,
  Download,
  FileSpreadsheet,
  Plus,
  Printer,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AssessmentRecord,
  MasteryStore,
  Student,
} from '../types/krd';
import { KRD_ACTIONS, computeStudentDiagnostic } from '../utils/krdEngine';

export interface PrintJobConfig {
  students: Student[];
  sifirs: number[];
  title: string;
  includeGuideHeader: boolean;
  qrDataUrls: Record<string, string>;
}

interface ClassroomPBDManagerProps {
  students: Student[];
  records: AssessmentRecord[];
  masteryStore: MasteryStore;
  onAddBulkStudents: (bulkText: string) => void;
  onRemoveStudent: (index: number) => void;
  onAddRecord: (record: AssessmentRecord) => void;
  onImportDatabase: (students: Student[], records: AssessmentRecord[]) => void;
  onClearAllData: () => void;
  onTriggerPrintJob: (job: PrintJobConfig) => void;
}

export const ClassroomPBDManager: React.FC<ClassroomPBDManagerProps> = ({
  students,
  records,
  masteryStore,
  onAddBulkStudents,
  onRemoveStudent,
  onAddRecord,
  onImportDatabase,
  onClearAllData,
  onTriggerPrintJob,
}) => {
  const [bulkInput, setBulkInput] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [printTier, setPrintTier] = useState<'full' | 'basic' | 'advanced' | 'custom'>('full');
  const [customPrintSifirs, setCustomPrintSifirs] = useState<number[]>([6, 7, 8, 9]);
  const [includeGuideHeader, setIncludeGuideHeader] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Manual Entry State
  const [manualStudentKey, setManualStudentKey] = useState('');
  const [manualSifir, setManualSifir] = useState(2);
  const [manualScore, setManualScore] = useState(10);
  const [manualTime, setManualTime] = useState(40);

  const uniqueClasses = Array.from(new Set(students.map((s) => s.kls))).sort();
  const filteredStudents =
    filterClass === 'all'
      ? students
      : students.filter((s) => s.kls === filterClass);

  const handleSeedDemoStudents = () => {
    const sample = [
      'Ahmad Danial Bin Razak, 4 INTAN',
      'Nur Aisyah Binti Kamal, 4 INTAN',
      'Muhammad Harith Bin Zaidi, 4 INTAN',
      'Siti Sarah Binti Roslan, 4 BERLIAN',
      'Chong Wei Liang, 4 BERLIAN',
      'Kavitha A/P Rajan, 4 BERLIAN',
    ].join('\n');
    onAddBulkStudents(sample);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ students, records }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circulox-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nama Murid',
      'Kelas',
      'Tahap Penguasaan (PBD)',
      'Sifir Dikuasai (/9)',
      'Sifir 1',
      'Sifir 2',
      'Sifir 3',
      'Sifir 4',
      'Sifir 5',
      'Sifir 6',
      'Sifir 7',
      'Sifir 8',
      'Sifir 9',
      'Cadangan Sifir',
    ];
    const rows = filteredStudents.map((st) => {
      const diag = computeStudentDiagnostic(st.name, st.kls, records, masteryStore);
      const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => {
        const stat = diag.sifirStats[s];
        return stat.attempts > 0 ? `${stat.bestScore}/10 (${stat.bestTime ?? '-'}s)` : '-';
      });
      return [
        `"${st.name}"`,
        `"${st.kls}"`,
        `"TP${diag.tahapPenguasaan}"`,
        diag.masteredCount,
        ...cols,
        `Sifir ${diag.recommendedSifir}`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekod-pbd-circulox-${filterClass}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (Array.isArray(parsed.students)) {
          onImportDatabase(parsed.students, parsed.records || []);
        }
      } catch {
        // Ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  const toggleCustomSifir = (s: number) => {
    setCustomPrintSifirs((prev) =>
      prev.includes(s)
        ? prev.length > 1
          ? prev.filter((item) => item !== s)
          : prev
        : [...prev, s].sort((a, b) => a - b)
    );
  };

  const handlePreparePrint = async () => {
    if (filteredStudents.length === 0) return;
    setIsGeneratingPdf(true);

    let sifirsToPrint = [2, 3, 4, 5, 6, 7, 8, 9];
    let title = 'Set Lengkap Roda Darab (Sifir 2 – 9)';

    if (printTier === 'basic') {
      sifirsToPrint = [2, 3, 4, 5];
      title = 'Lembaran Tahap Asas (Sifir 2, 3, 4 & 5)';
    } else if (printTier === 'advanced') {
      sifirsToPrint = [6, 7, 8, 9];
      title = 'Lembaran Tahap Kemahiran (Sifir 6, 7, 8 & 9)';
    } else if (printTier === 'custom') {
      sifirsToPrint = customPrintSifirs;
      title = `Lembaran Latihan Fokus (Sifir ${customPrintSifirs.join(', ')})`;
    }

    const qrDataUrls: Record<string, string> = {};
    for (const s of filteredStudents) {
      const key = `${s.name}|${s.kls}`;
      try {
        qrDataUrls[key] = await QRCode.toDataURL(`LOGIN:${s.name}|${s.kls}`, {
          width: 120,
          margin: 1,
          errorCorrectionLevel: 'L',
        });
      } catch {
        qrDataUrls[key] = '';
      }
    }

    setIsGeneratingPdf(false);
    onTriggerPrintJob({
      students: filteredStudents,
      sifirs: sifirsToPrint,
      title,
      includeGuideHeader,
      qrDataUrls,
    });
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent =
      filteredStudents.find((s) => `${s.name}|${s.kls}` === manualStudentKey) ||
      filteredStudents[0];
    if (!targetStudent) return;

    onAddRecord({
      name: targetStudent.name,
      kls: targetStudent.kls,
      sifir: manualSifir,
      score: Math.min(10, Math.max(0, Number(manualScore))),
      time: Math.max(1, Number(manualTime)),
      date: new Date().toLocaleDateString('ms-MY'),
      mode: 'manual',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Pengurusan Data Murid, Matriks PBD & Cetakan Lembaran Kerja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Urus senarai kelas, pantau Tahap Penguasaan (TP1–TP6) Sifir 1–9, dan cetak lembaran kerja PDF bertahap lengkap dengan Kod QR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            aria-label="Tapis Kelas"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kelas ({students.length} Murid)</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eksport CSV PBD</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simpan Backup</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: PBD Mastery Matrix & Recent Records */}
        <div className="lg:col-span-8 space-y-6">
          {/* PBD Mastery Matrix Table */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  01. Matriks Penguasaan Sifir 1–9 & Pelaporan PBD
                </h2>
                <p className="text-xs text-slate-500">
                  Menunjukkan skor terbaik bagi setiap sifir serta anggaran Tahap Penguasaan (TP1–TP6) automatik
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Emas: 10/10 (≤45s)</span>
                <span aria-hidden="true">·</span>
                <span>Perak: ≥8/10</span>
                <span aria-hidden="true">·</span>
                <span>Gangsa: ≥5/10</span>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  Tiada Senarai Murid Ditemui
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Masukkan nama murid di ruangan Input Pukal atau muatkan data contoh kelas untuk mencuba.
                </p>
                <button
                  onClick={handleSeedDemoStudents}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Muat Contoh Kelas (6 Murid)</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500">
                      <th className="py-2.5 pr-3">Nama Murid & Kelas</th>
                      <th className="py-2.5 px-2 text-center">TP</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                        <th key={s} className="py-2.5 px-1.5 text-center font-mono">
                          ×{s}
                        </th>
                      ))}
                      <th className="py-2.5 pl-3">Fokus Seterusnya</th>
                      <th className="py-2.5 pl-2 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.map((st) => {
                      const origIdx = students.findIndex(
                        (item) => item.name === st.name && item.kls === st.kls
                      );
                      const diag = computeStudentDiagnostic(
                        st.name,
                        st.kls,
                        records,
                        masteryStore
                      );

                      return (
                        <tr key={`${st.name}-${st.kls}`} className="hover:bg-slate-50/80">
                          <td className="py-3 pr-3">
                            <p className="font-bold text-slate-900">{st.name}</p>
                            <p className="text-[11px] text-slate-500">{st.kls}</p>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-indigo-700 tabular-nums">
                            TP{diag.tahapPenguasaan}
                          </td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => {
                            const stat = diag.sifirStats[s];
                            const cellStyle =
                              stat.badge === 'gold'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                : stat.badge === 'silver'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                                  : stat.badge === 'bronze'
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : 'bg-white text-slate-300 border-slate-100';

                            return (
                              <td key={s} className="py-3 px-1 text-center tabular-nums">
                                <div
                                  title={
                                    stat.attempts > 0
                                      ? `Sifir ${s}: Skor Terbaik ${stat.bestScore}/10 (${stat.bestTime ?? '-'}s)`
                                      : `Sifir ${s}: Belum diuji`
                                  }
                                  className={`w-8 h-8 mx-auto rounded-lg border flex flex-col items-center justify-center font-mono text-[11px] ${cellStyle}`}
                                >
                                  <span>{stat.attempts > 0 ? stat.bestScore : '-'}</span>
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-3 pl-3 text-xs text-slate-600 tabular-nums">
                            <span className="font-semibold text-slate-800">
                              Sifir {diag.recommendedSifir}
                            </span>{' '}
                            <span className="text-slate-400">
                              ({KRD_ACTIONS[diag.recommendedSifir].display})
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <button
                              onClick={() => onRemoveStudent(origIdx)}
                              title="Padam murid"
                              className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Gradebook Log */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  02. Log Rekod Latihan & Ujian Terkini ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Semua latihan kendiri murid dan imbasan QR disimpan secara automatik di sini
                </p>
              </div>
              {records.length > 0 && (
                <button
                  onClick={onClearAllData}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  Padam Semua Data
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada rekod markah disimpan.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {[...records].reverse().map((r, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-slate-500">{r.kls}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-slate-400">{r.date}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-800 tabular-nums">
                      <span>Sifir {r.sifir}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-emerald-700">
                        Skor {r.score}/{r.maxScore || 10}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{r.time}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns: Printable PDF Generator, Bulk Input & Manual Entry */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tiered Printable PDF Worksheet Generator */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Cetakan Lembaran Kerja PDF Bertahap
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Menjana lembaran kerja Roda Darab lengkap dengan Kod QR unik setiap murid untuk diimbas menggunakan telefon guru.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Tahap Lembaran Kerja
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintTier('basic')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    printTier === 'basic'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p>Tahap Asas</p>
                  <p className="text-[11px] text-slate-500 font-normal">Sifir 2, 3, 4 & 5</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTier('advanced')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    printTier === 'advanced'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p>Tahap Kemahiran</p>
                  <p className="text-[11px] text-slate-500 font-normal">Sifir 6, 7, 8 & 9</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTier('full')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    printTier === 'full'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p>Set Lengkap (80m)</p>
                  <p className="text-[11px] text-slate-500 font-normal">Semua Sifir 2 – 9</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTier('custom')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    printTier === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p>Pilihan Guru</p>
                  <p className="text-[11px] text-slate-500 font-normal">Pilih sifir spesifik</p>
                </button>
              </div>
            </div>

            {printTier === 'custom' && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Tandakan Sifir Pilihan:
                </p>
                <div className="grid grid-cols-9 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleCustomSifir(s)}
                      className={`py-1.5 rounded-lg border font-mono text-xs font-bold cursor-pointer ${
                        customPrintSifirs.includes(s)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGuideHeader}
                onChange={(e) => setIncludeGuideHeader(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Sertakan rujukan Garis Nombor Ajaib pada kepala kertas</span>
            </label>

            <button
              onClick={handlePreparePrint}
              disabled={filteredStudents.length === 0 || isGeneratingPdf}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isGeneratingPdf
                  ? 'Sedang Menjana Kod QR...'
                  : `Cetak PDF (${filteredStudents.length} Murid)`}
              </span>
            </button>
          </section>

          {/* Bulk Student Input */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Tambah Murid Secara Pukal
              </h2>
              <span className="text-[11px] text-slate-400">Format: Nama, Kelas</span>
            </div>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={'Contoh:\nAli Bin Abu, 4 Intan\nSiti Aminah, 4 Berlian'}
              className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (bulkInput.trim()) {
                    onAddBulkStudents(bulkInput);
                    setBulkInput('');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Senarai Murid</span>
              </button>
              <button
                onClick={() => setBulkInput('')}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </section>

          {/* Quick Manual Record Entry */}
          {filteredStudents.length > 0 && (
            <form
              onSubmit={handleSaveManualRecord}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Rekod Markah Manual Guru
                </h2>
              </div>
              <select
                value={manualStudentKey}
                onChange={(e) => setManualStudentKey(e.target.value)}
                aria-label="Pilih Murid untuk Rekod Manual"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                {filteredStudents.map((s) => (
                  <option key={`${s.name}|${s.kls}`} value={`${s.name}|${s.kls}`}>
                    {s.name} ({s.kls})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Sifir (1-9)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={manualSifir}
                    onChange={(e) => setManualSifir(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Skor (/10)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={manualScore}
                    onChange={(e) => setManualScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Masa (Saat)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={manualTime}
                    onChange={(e) => setManualTime(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Simpan Rekod Markah
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
