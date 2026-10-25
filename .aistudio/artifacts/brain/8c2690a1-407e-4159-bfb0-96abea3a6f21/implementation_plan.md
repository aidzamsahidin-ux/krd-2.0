# CirculoX Pintar — Kit Roda Darab Interaktif & Sistem PdP Kelas (PWA)

Transformasi menyeluruh aplikasi **CirculoX** daripada prototaip HTML tunggal kepada aplikasi web progresif (PWA) moden berasaskan React dan TypeScript yang memfokuskan **Pembelajaran Kendiri (Self-Paced Mastery)** menggunakan algoritma **Rumus Kit Roda Darab (KRD)** secara luar talian sepenuhnya, digabungkan dengan **Sistem Pengurusan Bilik Darjah, Kuiz LCD Langsung, dan Sinergi Pengimbas Pintar**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Sila semak keputusan seni bina dan ciri utama yang telah diselaraskan berdasarkan maklum balas anda sebelum pembangunan kod dimulakan.

- **Keputusan Disahkan 1 — Fokus Pembelajaran Kendiri**: Menyediakan **3 Mod Interaktif Lengkap**:
  1. *Mod Belajar (Visualisasi KRD)*: Animasi interaktif Garis Nombor Ajaib (`+1` hingga `-1`), visualisasi pusingan digit Sa (0–9), dan perbandingan visual *Puluh Lama → Puluh Baru* (Peraturan A: Sa Menurun `+1 Puluh`, Peraturan B: Sa Naik/Kekal `+0 Puluh`).
  2. *Mod Latihan Berpandu 2-Langkah*: Murid mengira dan memasukkan jawapan bagi **Langkah 1 (Cari Digit Sa)** dan **Langkah 2 (Cari Digit Puluh)** secara berperingkat menggunakan pad nombor pada skrin, disertai petunjuk pintar automatik apabila tersilap.
  3. *Mod Cabaran Pantas (Time Attack)*: Murid mengisi terus kesemua 10 sektor Roda Darab menggunakan pad nombor pantas dengan kiraan masa automatik, analisis ketepatan, dan penyimpanan rekod terus ke profil murid.
- **Keputusan Disahkan 2 — Sistem Diagnostik & Lencana Penguasaan**: Enjin Diagnostik Pintar berasaskan rumus KRD (100% luar talian) yang menjejak penguasaan Sifir 1–9 bagi setiap murid, menganugerahkan lencana penguasaan (*Gangsa, Perak, Emas*), mengenal pasti sifir atau gandaan spesifik yang sering silap (contoh: kekeliruan ketika digit Sa melintasi sempadan 0), dan mencadangkan latihan sasaran.
- **Keputusan Disahkan 3 — Inovasi PdP Kelas & Sinergi Guru**:
  - *Pengimbas Sinergi Pintar (Telefon Guru ↔ Paparan LCD)*: Apabila guru mengimbas kod QR pada lembaran kerja murid, telefon guru memaparkan panel pantas untuk memilih sifir, memasukkan markah (atau mengesahkan siap), dan menghantar data masa nyata ke skrin LCD melalui PeerJS.
  - *Mod Paparan LCD Dwi-Fungsi*: Menyokong **Mod Lumba Kertas (QR Race)** dengan podium pemenang dan **Mod Kuiz Kelas Langsung** di mana soalan Roda Darab dipaparkan di skrin besar bersama carta kedudukan kelas.
  - *Cetakan Lembaran Kerja PDF Bertahap*: Guru boleh mencetak lembaran kerja mengikut tahap — sama ada **Tahap Fokus (1–2 Sifir Pilihan)**, **Tahap Pertengahan (Sifir Mudah vs Sifir Sukar)**, atau **Set Lengkap (Sifir 2–9)** lengkap dengan Kod QR unik setiap murid.
- **Keputusan Disahkan 4 — Seni Bina Moden & Sokongan PWA Penuh**: Dibina semula dalam **React + TypeScript + Tailwind CSS** dengan sokongan pemasangan PWA dalam aplikasi (*In-App Install Prompt*), caching aset luar talian melalui Service Worker, serta keserasian penuh data sedia ada (`krd_students_v3` dan `krd_records_v3` dalam `localStorage`).

---

### 1. Overview & Core Concept

- **What It Does**:
  **CirculoX Pintar** ialah ekosistem pembelajaran sifir darab berasaskan kaedah **Kit Roda Darab (KRD)** dan **Garis Nombor Ajaib**. Ia menyelesaikan masalah murid menghafal sifir secara buta tuli dengan memecahkan setiap pendaraban kepada dua langkah logik yang mudah:
  1. **Langkah 1 (Cari Sa)**: Menggunakan kunci gerakan Garis Nombor Ajaib (`+1, +2, +3, +4, ±5, -4, -3, -2, -1`) daripada digit Sa sebelumnya.
  2. **Langkah 2 (Cari Puluh)**: Memerhatikan corak perubahan digit Sa — jika digit Sa menurun (*Peraturan A*), tambah `1` pada nilai Puluh sebelumnya; jika digit Sa menaik atau sama (*Peraturan B*), kekalkan nilai Puluh sebelumnya.
- **Target Audience / Persona**:
  - **Murid Sekolah Rendah (Pembelajaran Kendiri)**: Menggunakan tablet, komputer bilik makmal, atau telefon pintar di rumah untuk belajar langkah demi langkah, menjawab latihan berpandu, dan mengumpul lencana penguasaan Sifir 1–9.
  - **Guru Matematik (PdP Bilik Darjah)**: Menggunakan skrin pintar/projektor LCD untuk demonstrasi interaktif, menjalankan aktiviti kuiz/perlumbaan bilik darjah menggunakan telefon pintar sebagai pengimbas QR jarak jauh (*Sinergi*), dan mencetak lembaran kerja berbeza mengikut tahap murid.
- **Key Value**:
  Menghapuskan semua pepijat pada versi asal (seperti Mod Latihan yang tidak berfungsi, ralat pemilihan murid `noStudentText`, dan Garis Nombor Ajaib yang statik) sambil menjadikan aplikasi jauh lebih pintar dengan bimbingan diagnostik automatik tanpa memerlukan sambungan internet atau kunci API luaran.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Aliran Pembelajaran Kendiri Murid**:
     - Murid memilih kelas dan nama mereka (atau Mod Tetamu) → Panel Diagnostik memaparkan lencana Sifir 1–9 yang telah dikuasai serta **Cadangan Sifir Hari Ini** berdasarkan rekod kelemahan.
     - Murid memilih sifir (1–9) → **Garis Nombor Ajaib** di bahagian atas menonjolkan kunci sifir tersebut (contoh: Sifir 8 = `-2`).
     - Dalam **Mod Belajar**, murid menekan mana-mana sektor pada Roda Darab (atau menekan butang *Mainkan Semua*). Roda digit Sa berputar secara visual menunjukkan tolakan/tambahan pada kitaran 0–9, diikuti perbandingan *Puluh Lama vs Puluh Baru*.
     - Dalam **Mod Latihan 2-Langkah**, murid menekan sektor roda → sistem meminta murid menekan jawapan **Digit Sa** dahulu pada pad kekunci. Jika tersilap, Pembantu Pintar KRD memaparkan petunjuk visual pada kitaran 0–9 (contoh: *"Sa lama ialah 6. Tolak 2 daripada 6 dapat berapa?"*). Selepas betul, murid memilih sama ada Puluh **Kekal (+0)** atau **Tambah 1 (+1)** dan memasukkan digit Puluh.
     - Dalam **Mod Cabaran Pantas**, murid melengkapkan kesemua 10 sektor roda sepantas mungkin. Sebaik selesai, masa dan skor direkodkan secara automatik, lencana baharu dianugerahkan, dan analisis kesilapan dipaparkan.
  2. **Aliran PdP Guru & Sinergi LCD**:
     - Guru membuka **Paparan LCD** di skrin hadapan kelas (menyokong Mod Lumba Kertas QR atau Mod Kuiz Roda Kelas) dan menjana Kod Sesi 5-digit.
     - Guru menyambungkan telefon pintar melalui **Sinergi** → mengimbas kod QR pada kertas murid yang siap → memilih sifir serta markah terus di skrin telefon → nama, skor, dan masa murid terus muncul di carta kedudukan LCD secara langsung.
  3. **Aliran Pengurusan Data & Cetakan PDF Bertahap**:
     - Guru membuka **Pengurusan Data & Rekod**, melihat jadual matriks penguasaan murid (Sifir 1–9, purata masa, dan cadangan Tahap Penguasaan), serta menjana cetakan lembaran kerja PDF mengikut kelas dan tahap pilihan.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Tactile Educational Sandbox** — bersih, berstruktur tinggi, mesra murid dan profesional untuk guru, mengikut prinsip *Two-Zone Educational Sandbox Layout*.
  - *Color Palette & Mood (60-30-10 Discipline)*:
    - **60% Dominant Canvas**: Latar belakang cerah yang tenang (`#F8FAFC` Slate-50 dengan tona lembut `#EEF2FF` Indigo-50 pada kanvas simulasi) untuk kebolehbacaan tinggi di skrin telefon dan projektor kelas; manakala **Mod Paparan LCD** menggunakan kanvas kontras tinggi gelap (`#0F172A` Slate-900 / `#1E1B4B` Indigo-950) supaya jelas dilihat dari belakang bilik darjah.
    - **30% Structural Surfaces**: Panel putih bersih (`#FFFFFF`) dengan sempadan nipis (`1px solid #E2E8F0`) dan tipografi sekunder (`#475569`).
    - **10% Semantic Focal Accents**:
      - Aksen Utama / Aktif: Indigo Elektrik (`#4F46E5`)
      - Langkah 1 (Kunci Sa): Amber Terang (`#D97706`) dengan label eksplisit `LANGKAH 1 · DIGIT SA`
      - Langkah 2 (Peraturan Puluh Kekal / Betul): Zamrud (`#059669`)
      - Langkah 2 (Peraturan Puluh +1 / Perhatian): Merah Koral (`#DC2626`)
  - *Typography & Hierarchy (2+1 Font Rule)*:
    - **Display / Tajuk & Angka Roda**: `Outfit` (600 SemiBold / 700 Bold) — bentuk geometri bulat yang sangat jelas untuk angka pendaraban kanak-kanak.
    - **Body & Panduan PdP**: `Plus Jakarta Sans` (400 Regular / 600 SemiBold) — sangat mudah dibaca untuk arahan Bahasa Melayu.
    - **Data, Masa & Markah**: `JetBrains Mono` dengan `tabular-nums` (`font-variant-numeric: tabular-nums`) supaya semua kiraan detik masa dan jadual skor sejajar dengan kemas.
  - *Component Styling & Layout*:
    - **Top Bar Contract (3 Zon)**: Bar navigasi atas yang bersih dengan 3 zon:
      1. *Zon Jenama*: Teks jenama tunggal `CirculoX` (`whitespace-nowrap shrink-0`).
      2. *Zon Navigasi*: 4 pautan ruang kerja utama (`Roda Sifir`, `Rekod & PBD`, `Paparan LCD`, `Sinergi QR`).
      3. *Zon Tindakan Utama*: Butang pemasangan PWA (`Pasang Aplikasi`) atau pemilih profil murid aktif.
    - **Two-Zone Sandbox Workspace (Desktop 1440px & Tablet)**:
      - *Zon Kiri (60% Lebar — Pentas Visual Interaktif)*: Menempatkan **Garis Nombor Ajaib Interaktif** di bahagian atas, **SVG Roda Darab Interaktif 10-Sektor** di tengah, dan **Gelung Kitaran Digit Sa (0–9)** di bawah roda.
      - *Zon Kanan (40% Lebar — Dek Kawalan & Pembantu Pintar KRD)*: Menempatkan pemilih Mod (`Belajar`, `Latihan 2-Langkah`, `Cabaran Pantas`), pemilih Sifir 1–9 (dengan penunjuk lencana penguasaan), kad langkah KRD / pad kekunci jawapan interaktif, dan maklum balas Pembantu Pintar.

- **Interactive Feedback & Motion**:
  - Maklum balas pantas ($\le 200\text{ms}$) menggunakan animasi `transform` dan `opacity`.
  - Apabila sektor Roda Darab dipilih, sektor tersebut diserlahkan dengan jelas dan anak panah kitaran Sa bergerak mengikut nilai kunci (`+1` hingga `-1`).
  - Bunyi sintesis Web Audio API (boleh ditukar senyap/aktif) untuk jawapan betul, jawapan kurang tepat, imbasan QR berjaya, dan tamat cabaran bersama sambutan konfeti.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pembantu Pintar KRD Berasaskan Peraturan (Rule-Based Diagnostic Engine) vs. AI Luaran**
  - *Chosen Approach*: Membina enjin algoritma diagnostik KRD secara tempatan (100% client-side TypeScript).
  - *Why*: Matematik KRD mempunyai rumus deterministik yang tepat (Kunci Sa `+1..±5..-1` dan Peraturan Puluh A/B). Enjin tempatan memberikan maklum balas serta-merta (0ms kependaman), berfungsi 100% tanpa internet di sekolah luar bandar atau makmal komputer, dan tidak memerlukan kos API.
  - *Alternatives Considered*: Panggilan API LLM luaran ditolak kerana memerlukan internet berterusan dan melambatkan respons semasa murid menekan pad nombor.

- **Decision 2: Latihan Berpandu 2-Langkah & Mod Cabaran Pantas**
  - *Chosen Approach*: Memisahkan mod latihan kepada **Latihan 2-Langkah (Bimbingan Konsep)** dan **Cabaran Pantas (Kemahiran Kepantasan)**.
  - *Why*: Murid yang baru belajar sifir sukar (seperti Sifir 6, 7, 8, 9) sering gagal jika terus diminta jawapan akhir. Latihan 2-Langkah melatih otak mereka mengira *Sa* dahulu kemudian *Puluh*, manakala Cabaran Pantas menguji kelancaran penuh untuk tujuan rekod masa dan pertandingan kelas.

- **Decision 3: Sinergi Telefon Guru ↔ Paparan LCD dengan Skor Terbina Dalam**
  - *Chosen Approach*: Menaik taraf protokol mesej WebRTC (`PeerJS`) supaya pengimbas telefon guru boleh menghantar bukan sahaja masa tamat (`SCAN_ENTRY`), tetapi juga **Sifir yang diuji** dan **Markah (0–10 atau /80)** terus ke pangkalan data dan papan pendahulu LCD.
  - *Why*: Dalam kod asal, imbasan telefon hanya menghantar nama murid tanpa menyimpan rekod ke dalam buku rekod (`krd_records_v3`) dan tanpa menyemak markah. Penambahbaikan ini menjadikan telefon guru alat pemarkahan bilik darjah yang sebenar.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CirculoX PWA Application Shell                       │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌────────────────┐  │
│  │   Top Navigation Bar  │  │  PWA Service Worker &   │  │ Web Audio SFX  │  │
│  │ (4 Views + PWA Prompt)│  │  Offline Install Hook   │  │ & Confetti     │  │
│  └───────────┬───────────┘  └─────────────────────────┘  └────────────────┘  │
└──────────────┼───────────────────────────────────────────────────────────────┘
               │
       ┌───────┴───────────────────────────────────────────────┐
       ▼                                                       ▼
┌─────────────────────────────────────────┐   ┌────────────────────────────────┐
│   1. Ruang Kerja Sifir (PdP & Kendiri)  │   │  2. Pengurusan Kelas & PBD     │
│  ┌───────────────────────────────────┐  │   │  ┌──────────────────────────┐  │
│  │ Pentas Visual (Kiri - 60%)        │  │   │  │ Pengurus Murid (Pukal /  │  │
│  │ • Garis Nombor Ajaib (+1 .. -1)   │  │   │  │ Individu / Backup JSON)  │  │
│  │ • Roda Darab Interaktif SVG       │  │   │  ├──────────────────────────┤  │
│  │ • Visualisasi Kitaran Sa (0-9)    │  │   │  │ Matriks Penguasaan Sifir │  │
│  └─────────────────┬─────────────────┘  │   │  │ 1-9 & Analitik Kelas     │  │
│                    │                    │   │  ├──────────────────────────┤  │
│  ┌─────────────────▼─────────────────┐  │   │  │ Penjana PDF Lembaran     │  │
│  │ Dek Kawalan & Pintar (Kanan - 40%)│  │   │  │ Kerja Bertahap + Kod QR  │  │
│  │ • Profil Murid & Lencana Sifir    │  │   │  └──────────────────────────┘  │
│  │ • Enjin Cadangan Sifir Lemah      │  │   └────────────────────────────────┘
│  │ • Mod 1: Belajar (Langkah KRD)    │  │
│  │ • Mod 2: Latihan 2-Langkah (Sa/Pu)│  │   ┌────────────────────────────────┐
│  │ • Mod 3: Cabaran Pantas (Keypad)  │  │   │  3. Mod LCD & Sinergi PeerJS   │
│  └─────────────────┬─────────────────┘  │   │  ┌──────────────────────────┐  │
└────────────────────┼────────────────────┘   │  │ Skrin LCD: Masa Lumba,   │  │
                     │                        │  │ Kuiz Kelas & Podium Top 3│  │
                     ▼                        │  ├──────────────────────────┤  │
┌─────────────────────────────────────────┐   │  │ Pengimbas QR & Sinergi   │  │
│     LocalStorage Persistence Engine     │◄──┼──┤ Telefon Guru (Skor+Masa) │  │
│ • krd_students_v3 (Senarai Murid/Kelas) │   │  └──────────────────────────┘  │
│ • krd_records_v3  (Rekod Skor & Masa)   │   └────────────────────────────────┘
│ • krd_mastery_v1  (Diagnostik Kesilapan)│
└─────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Student (`krd_students_v3`)**: `{ id?: string, name: string, kls: string }` — mengekalkan keserasian 100% dengan fail JSON backup sedia ada.
  - **AssessmentRecord (`krd_records_v3`)**: `{ id?: string, name: string, kls: string, sifir: number, score: number, time: number, date: string, mode?: 'guided' | 'speed' | 'paper' }` — menyimpan rekod latihan kendiri dan imbasan kertas.
  - **DiagnosticProfile (`krd_mastery_v1`)**: Menyimpan statistik ketepatan mengikut sifir (1–9), rekod kesilapan spesifik (`saErrors` vs `puluhErrors`), dan status lencana (`none` | `bronze` | `silver` | `gold`) untuk menjana cadangan pembelajaran kendiri.

- **Interactive Component & State Mapping**:
  - **Enjin Matematik KRD (`krdEngine`)**:
    - Bagi sebarang `sifir` ($1..9$) dan gandaan $m$ ($1..10$):
      - `prevResult = sifir * (m - 1)` $\to$ `prevSa = prevResult % 10`, `prevPuluh = Math.floor(prevResult / 10)`
      - `currResult = sifir * m` $\to$ `currSa = currResult % 10`, `currPuluh = Math.floor(currResult / 10)`
      - `action = krdActions[sifir]` (`+1, +2, +3, +4, ±5, -4, -3, -2, -1`)
      - `isSaDecreasing = m > 1 && currSa < prevSa` (Peraturan A: `currPuluh = prevPuluh + 1`, termasuk kes khas Sifir 9 di mana Sa sentiasa menurun 1 dan Puluh sentiasa bertambah 1; Peraturan B: `currPuluh = prevPuluh`).
      - Nota khas bagi $m = 10$: Menjelaskan peralihan kepada gandaan $10 \times \text{sifir}$ secara visual.
  - **Aliran Mod Latihan 2-Langkah**:
    - `step = 'ask_sa'` $\to$ Murid memilih digit Sa ($0..9$) pada pad nombor. Jika salah, sistem mengira kesilapan dan memaparkan animasi anak panah dari `prevSa` mengikut kunci `action.display` pada gelung 0–9.
    - `step = 'ask_puluh_rule'` $\to$ Murid memilih sama ada Sa **Menurun (Tambah 1 pada Puluh)** atau **Menaik/Kekal (Puluh Kekal)**, kemudian memilih digit Puluh.
    - Apabila kedua-dua langkah selesai, sektor roda dikemas kini dengan jawapan penuh dan sistem beralih secara automatik ke sektor seterusnya ($m + 1$).
  - **Aliran Mod Cabaran Pantas**:
    - Pemasa bermula sebaik sahaja sektor pertama ditekan. Murid boleh menjawab mengikut urutan ($1 \to 10$) atau secara rawak. Pad nombor 2-digit mengesahkan jawapan serta-merta, mengemas kini skor `betul/10`, dan menyimpan rekod ke `krd_records_v3` sebaik sahaja kesemua 10 sektor selesai.
  - **Aliran Cetakan Lembaran Kerja PDF (`window.print()`)**:
    - Menyediakan pilihan cetakan:
      1. *Set Lengkap (Sifir 2–9)*: 8 Roda Darab pada 1 halaman A4 setiap murid bersama Kod QR `LOGIN:Nama|Kelas`.
      2. *Set Latihan Fokus (Sifir Pilihan)*: Guru memilih sifir tertentu (contoh: Sifir 6, 7, 8, 9 sahaja) dengan saiz roda lebih besar dan jadual rujukan Garis Nombor Ajaib di bahagian atas kertas.
    - Menjana Kod QR SVG/Canvas secara sinkron sebelum membuka dialog cetakan supaya tiada lagi masalah Kod QR kosong pada cetakan PDF.
