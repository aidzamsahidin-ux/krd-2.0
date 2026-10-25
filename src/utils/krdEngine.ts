import {
  AssessmentRecord,
  KRDActionRule,
  KRDStepAnalysis,
  MasteryStore,
  SifirDiagnosticStat,
  StudentMasterySummary,
} from '../types/krd';

export const KRD_ACTIONS: Record<number, KRDActionRule> = {
  1: {
    sifir: 1,
    val: 1,
    type: 'plus',
    display: '+1',
    description: 'Tambah 1 pada digit Sa bagi setiap langkah.',
  },
  2: {
    sifir: 2,
    val: 2,
    type: 'plus',
    description: 'Tambah 2 (nombor genap berurutan) pada digit Sa.',
    display: '+2',
  },
  3: {
    sifir: 3,
    val: 3,
    type: 'plus',
    display: '+3',
    description: 'Gerak +3 ke hadapan pada kitaran digit Sa (0–9).',
  },
  4: {
    sifir: 4,
    val: 4,
    type: 'plus',
    display: '+4',
    description: 'Gerak +4 ke hadapan pada kitaran digit Sa (0–9).',
  },
  5: {
    sifir: 5,
    val: 5,
    type: 'both',
    display: '±5',
    description: 'Digit Sa hanya berselang-seli antara 5 dan 0.',
  },
  6: {
    sifir: 6,
    val: 4,
    type: 'minus',
    display: '-4',
    description: 'Undur 4 langkah (-4) pada kitaran digit Sa (0–9).',
  },
  7: {
    sifir: 7,
    val: 3,
    type: 'minus',
    display: '-3',
    description: 'Undur 3 langkah (-3) pada kitaran digit Sa (0–9).',
  },
  8: {
    sifir: 8,
    val: 2,
    type: 'minus',
    display: '-2',
    description: 'Undur 2 langkah (-2) pada kitaran digit Sa (0–9).',
  },
  9: {
    sifir: 9,
    val: 1,
    type: 'minus',
    display: '-1',
    description: 'Undur 1 langkah (-1) pada digit Sa dan tambah 1 pada Puluh.',
  },
};

export function computeKRDStep(sifir: number, multiplier: number): KRDStepAnalysis {
  const prevMultiplier = multiplier - 1;
  const prevResult = sifir * prevMultiplier;
  const currResult = sifir * multiplier;

  const prevSa = prevResult % 10;
  const currSa = currResult % 10;
  const prevPuluh = Math.floor(prevResult / 10);
  const currPuluh = Math.floor(currResult / 10);

  const action = KRD_ACTIONS[sifir] || KRD_ACTIONS[1];

  // Build step-by-step path around the 0-9 circle for visual animation
  const saCycleSteps: number[] = [prevSa];
  let pointer = prevSa;
  const dir = action.type === 'minus' ? -1 : 1;
  for (let i = 0; i < action.val; i++) {
    pointer = (pointer + dir + 10) % 10;
    saCycleSteps.push(pointer);
  }

  // Determine Puluh rule
  // Note: In KRD, from multiplier 1 onwards:
  // If multiplier === 1, prevResult is 00 (prevSa = 0, prevPuluh = 0) -> currSa = sifir, currPuluh = 0 (Rule B: Sa rises from 0 to sifir, Puluh stays 0)
  // For multiplier > 1: whenever currSa < prevSa, it means Sa decreased (Rule A: +1 Puluh).
  // Special case: if sifir === 5 and currSa === 0 (from 5 -> 0), currSa < prevSa is true -> +1 Puluh!
  // What if multiplier === 10 for sifir 1..9? prevSa = 10 - sifir (e.g. for sifir 2, 9x2=18 so prevSa=8, 10x2=20 so currSa=0; 0 < 8 is true -> +1 Puluh!).
  const isSaDecreasing = multiplier > 1 && currSa < prevSa;
  const puluhDelta: 0 | 1 = isSaDecreasing ? 1 : 0;
  const puluhRuleCode: 'A' | 'B' = isSaDecreasing ? 'A' : 'B';

  const puluhRuleTitle = isSaDecreasing
    ? 'Peraturan A (Sa Menurun): Tambah 1 pada Puluh'
    : 'Peraturan B (Sa Menaik / Kekal): Puluh Kekal';

  const puluhRuleExplanation =
    multiplier === 1
      ? `Permulaan roda (${sifir} × 1): Digit Sa meningkat dari 0 ke ${currSa}, maka nilai Puluh kekal 0.`
      : isSaDecreasing
        ? `Perhatikan digit Sa menurun daripada ${prevSa} kepada ${currSa}. Mengikut Peraturan A, kita tambah 1 pada Puluh Lama (${prevPuluh} + 1 = ${currPuluh}).`
        : `Perhatikan digit Sa meningkat daripada ${prevSa} kepada ${currSa}. Mengikut Peraturan B, nilai Puluh Lama dikekalkan (${prevPuluh} kekal ${currPuluh}).`;

  let saWrapExplanation = '';
  if (action.type === 'plus') {
    if (prevSa + action.val >= 10) {
      saWrapExplanation = `${prevSa} ${action.display} = ${prevSa + action.val} (lepasi 9 pada kitaran nombor → ambil digit Sa iaitu ${currSa}).`;
    } else {
      saWrapExplanation = `${prevSa} ${action.display} = ${currSa} secara terus pada Garis Nombor Ajaib.`;
    }
  } else if (action.type === 'minus') {
    if (prevSa - action.val < 0) {
      saWrapExplanation = `${prevSa} ${action.display}: undur ${action.val} langkah melepasi 0 pada kitaran 0–9 (atau ${prevSa} + 10 - ${action.val} = ${currSa}).`;
    } else {
      saWrapExplanation = `${prevSa} ${action.display} = ${currSa} secara terus.`;
    }
  } else {
    saWrapExplanation = `Sifir 5 mempunyai corak mudah: digit Sa sentiasa berselang-seli 5, 0, 5, 0. Selepas ${prevSa} ialah ${currSa}.`;
  }

  return {
    sifir,
    multiplier,
    prevMultiplier,
    prevResult,
    currResult,
    prevSa,
    currSa,
    prevPuluh,
    currPuluh,
    action,
    isSaDecreasing,
    puluhDelta,
    puluhRuleCode,
    puluhRuleTitle,
    puluhRuleExplanation,
    saWrapExplanation,
    saCycleSteps,
  };
}

export function getStudentKey(name: string, kls: string): string {
  return `${name.trim().toUpperCase()}|${kls.trim().toUpperCase()}`;
}

export function computeStudentDiagnostic(
  name: string,
  kls: string,
  records: AssessmentRecord[],
  masteryStore: MasteryStore
): StudentMasterySummary {
  const studentKey = getStudentKey(name, kls);
  const studentRecords = records.filter(
    (r) =>
      r.name.trim().toUpperCase() === name.trim().toUpperCase() &&
      r.kls.trim().toUpperCase() === kls.trim().toUpperCase()
  );
  const rawDiag = masteryStore[studentKey] || {};

  const sifirStats: Record<number, SifirDiagnosticStat> = {};
  let masteredCount = 0;
  let goldCount = 0;

  for (let s = 1; s <= 9; s++) {
    const sRecords = studentRecords.filter((r) => Number(r.sifir) === s);
    const diag = rawDiag[s] || { saErrors: 0, puluhErrors: 0, weakMultipliers: {} };

    let bestScore = 0;
    let bestTime: number | null = null;

    sRecords.forEach((r) => {
      const sc = Number(r.score) || 0;
      const tm = Number(r.time) || 999;
      if (sc > bestScore) {
        bestScore = sc;
        bestTime = tm;
      } else if (sc === bestScore && (bestTime === null || tm < bestTime)) {
        bestTime = tm;
      }
    });

    let badge: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
    if (sRecords.length > 0) {
      if (bestScore >= 10 && bestTime !== null && bestTime <= 45) {
        badge = 'gold';
      } else if (bestScore >= 8) {
        badge = 'silver';
      } else if (bestScore >= 5) {
        badge = 'bronze';
      }
    }

    if (badge === 'silver' || badge === 'gold') masteredCount++;
    if (badge === 'gold') goldCount++;

    const weakMultipliers = Object.entries(diag.weakMultipliers || {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m]) => Number(m));

    sifirStats[s] = {
      sifir: s,
      attempts: sRecords.length,
      bestScore,
      bestTime,
      saErrors: diag.saErrors || 0,
      puluhErrors: diag.puluhErrors || 0,
      weakMultipliers,
      badge,
    };
  }

  // Calculate Tahap Penguasaan (PBD TP1 - TP6)
  let tahapPenguasaan: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  let tpLabel = 'TP1 · Tahu Asas Sifir';

  if (goldCount >= 7 && masteredCount === 9) {
    tahapPenguasaan = 6;
    tpLabel = 'TP6 · Master Sifir Pantas & Kreatif';
  } else if (masteredCount >= 8) {
    tahapPenguasaan = 5;
    tpLabel = 'TP5 · Menguasai Semua Sifir Dengan Cekap';
  } else if (masteredCount >= 6) {
    tahapPenguasaan = 4;
    tpLabel = 'TP4 · Menguasai Sifir Utama & Sukar';
  } else if (masteredCount >= 3) {
    tahapPenguasaan = 3;
    tpLabel = 'TP3 · Menguasai Sifir Asas';
  } else if (studentRecords.length > 0) {
    tahapPenguasaan = 2;
    tpLabel = 'TP2 · Memahami Konsep Langkah KRD';
  }

  // Recommend next target Sifir intelligently
  // Pedagogical order of KRD difficulty: 1, 2, 5, 9, 3, 4, 8, 7, 6
  const pedagogicalOrder = [2, 5, 9, 3, 4, 8, 7, 6, 1];
  let recommendedSifir = 2;
  let recommendationReason =
    'Mulakan dengan Sifir 2 (+2) untuk membina keyakinan menggunakan Garis Nombor Ajaib.';

  // First check if any attempted sifir has high errors or bronze badge
  const needsReinforcement = pedagogicalOrder.find((s) => {
    const st = sifirStats[s];
    return st.attempts > 0 && (st.badge === 'none' || st.badge === 'bronze');
  });

  if (needsReinforcement) {
    const st = sifirStats[needsReinforcement];
    recommendedSifir = needsReinforcement;
    if (st.saErrors > st.puluhErrors) {
      recommendationReason = `Fokus semula Sifir ${needsReinforcement} (${KRD_ACTIONS[needsReinforcement].display}): kerap tersilap pada Langkah 1 (Cari Sa). Gunakan Mod Latihan 2-Langkah.`;
    } else if (st.puluhErrors > 0) {
      recommendationReason = `Fokus semula Sifir ${needsReinforcement}: perhatikan bila digit Sa menurun untuk tambah 1 pada Puluh (Langkah 2).`;
    } else {
      recommendationReason = `Tingkatkan skor Sifir ${needsReinforcement} (skor terbaik: ${st.bestScore}/10) untuk meraih Lencana Perak/Emas.`;
    }
  } else {
    const nextUntested = pedagogicalOrder.find(
      (s) => sifirStats[s].badge === 'none' || sifirStats[s].badge === 'bronze'
    );
    if (nextUntested) {
      recommendedSifir = nextUntested;
      recommendationReason = `Seterusnya: Sifir ${nextUntested} menggunakan kunci ${KRD_ACTIONS[nextUntested].display} pada Garis Nombor Ajaib.`;
    } else {
      const nextForGold = pedagogicalOrder.find((s) => sifirStats[s].badge !== 'gold') || 7;
      recommendedSifir = nextForGold;
      recommendationReason = `Semua sifir telah dikuasai! Cabar masa bawah 45 saat bagi Sifir ${nextForGold} untuk Lencana Emas.`;
    }
  }

  return {
    studentKey,
    sifirStats,
    masteredCount,
    goldCount,
    tahapPenguasaan,
    tpLabel,
    recommendedSifir,
    recommendationReason,
  };
}
