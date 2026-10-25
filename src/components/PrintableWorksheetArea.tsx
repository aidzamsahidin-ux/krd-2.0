import React from 'react';
import { PrintJobConfig } from './ClassroomPBDManager';
import { KRD_ACTIONS } from '../utils/krdEngine';

function createPrintArcPath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a1: number,
  a2: number
): string {
  const rad1 = (a1 * Math.PI) / 180;
  const rad2 = (a2 * Math.PI) / 180;
  return `M ${cx + Math.cos(rad1) * r2} ${cy + Math.sin(rad1) * r2} A ${r2} ${r2} 0 0 1 ${
    cx + Math.cos(rad2) * r2
  } ${cy + Math.sin(rad2) * r2} L ${cx + Math.cos(rad2) * r1} ${
    cy + Math.sin(rad2) * r1
  } A ${r1} ${r1} 0 0 0 ${cx + Math.cos(rad1) * r1} ${cy + Math.sin(rad1) * r1} Z`;
}

export const PrintableWorksheetArea: React.FC<{ job: PrintJobConfig | null }> = ({
  job,
}) => {
  if (!job) return <div id="circulox-print-root" className="hidden" />;

  const isLargeWheelLayout = job.sifirs.length <= 4;
  const maxTotalMarks = job.sifirs.length * 10;

  return (
    <div id="circulox-print-root" className="hidden print:block bg-white text-black">
      {job.students.map((student, sIdx) => {
        const key = `${student.name}|${student.kls}`;
        const qrDataUrl = job.qrDataUrls[key];

        return (
          <div
            key={`${key}-${sIdx}`}
            className="print-page-break border-2 border-black p-6 flex flex-col justify-between"
          >
            {/* Header with Student Details & QR Code */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    CIRCULOX · KIT RODA DARAB (KRD)
                  </h1>
                  <p className="text-xs font-semibold text-neutral-700">
                    {job.title}
                  </p>
                  <div className="mt-2 text-sm">
                    <p>
                      <strong>NAMA MURID:</strong> {student.name}
                    </p>
                    <p>
                      <strong>KELAS:</strong> {student.kls}
                    </p>
                  </div>
                </div>
                {qrDataUrl && (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrDataUrl}
                      alt={`QR ${student.name}`}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 border border-black p-1"
                    />
                    <span className="text-[9px] font-mono mt-0.5">
                      IMBAS SKOR GURU
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Magic Number Line Reference Bar */}
              {job.includeGuideHeader && (
                <div className="mb-3 border border-black p-2 rounded-lg">
                  <p className="text-[10px] font-bold text-center mb-1">
                    RUJUKAN GARIS NOMBOR AJAIB (LANGKAH 1: CARI DIGIT SA · LANGKAH 2: SA TURUN TAMBAH 1 PULUH, SA NAIK KEKAL)
                  </p>
                  <div className="grid grid-cols-9 gap-1 text-center font-mono text-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div key={n} className="border border-black py-0.5">
                        <strong>Sifir {n}:</strong> {KRD_ACTIONS[n].display}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wheels Grid */}
              <div
                className={`grid gap-3 ${
                  isLargeWheelLayout ? 'grid-cols-2' : 'grid-cols-4'
                }`}
              >
                {job.sifirs.map((sifir) => (
                  <div
                    key={sifir}
                    className="border border-black rounded-lg p-2 flex flex-col items-center"
                  >
                    <div className="w-full flex items-center justify-between text-xs font-bold mb-1 px-1">
                      <span>SIFIR {sifir}</span>
                      <span className="font-mono">Kunci {KRD_ACTIONS[sifir].display}</span>
                    </div>
                    <div
                      className={
                        isLargeWheelLayout ? 'w-48 h-48' : 'w-36 h-36'
                      }
                    >
                      <svg viewBox="0 0 400 400" className="w-full h-full">
                        {Array.from({ length: 10 }, (_, k) => {
                          const a = k * 36 - 90;
                          const r = ((a + 18) * Math.PI) / 180;
                          return (
                            <g key={k}>
                              <path
                                d={createPrintArcPath(200, 200, 82, 180, a, a + 36)}
                                fill="none"
                                stroke="#000000"
                                strokeWidth="3"
                              />
                              <path
                                d={createPrintArcPath(200, 200, 44, 82, a, a + 36)}
                                fill="none"
                                stroke="#000000"
                                strokeWidth="2.5"
                              />
                              <text
                                x={200 + Math.cos(r) * 63}
                                y={200 + Math.sin(r) * 63}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="22"
                                fontWeight="800"
                              >
                                {k + 1}
                              </text>
                            </g>
                          );
                        })}
                        <circle
                          cx="200"
                          cy="200"
                          r="44"
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth="4"
                        />
                        <text
                          x="200"
                          y="200"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="30"
                          fontWeight="900"
                        >
                          {sifir}×
                        </text>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Grading Strip */}
            <div className="mt-3 pt-2 border-t-2 border-black flex items-center justify-between text-sm font-bold font-mono">
              <span>MARKAH: _______ / {maxTotalMarks}</span>
              <span>MASA DIAMBIL: _________ SAAT</span>
              <span>TAHAP PENGUASAAN: TP ___</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
