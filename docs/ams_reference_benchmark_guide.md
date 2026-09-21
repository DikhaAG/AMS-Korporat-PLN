# Panduan Benchmark Referensi UI & Arsitektur: AMS Korporat PLN

Dokumen ini merupakan panduan implementasi komprehensif yang memetakan antarmuka referensi sistem persuratan/naskah dinas korporat PLN (AMS Korporat) dengan standar arsitektur pada **PRD**, **ADR (Architectural Decision Records)**, dan **Mail Flow Case Study**.

---

## 1. Ikhtisar Struktur Navigasi & Tata Letak (Layout)

Berdasarkan benchmark UI AMS Korporat, aplikasi mengusung tema **PLN Corporate Teal** (`#145f74` / `#0e4a5a`) dengan pembagian zona kerja:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] AMS KORPORAT       [Search: Filter ▾ | Rentang Tanggal 📅 | Kata Kunci 🔍 [Cari]]  🔔 [Profil]│
├───────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR           │ WORKSPACE / DATA TABLE / DETAIL VIEW                                        │
│ ┌───────────────┐ │ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ + BUAT NASKAH │ │ │ Toolbar: Breadcrumb / Filter Cepat Status & Tanggal / Cetak & Refresh   │ │
│ └───────────────┘ │ ├─────────────────────────────────────────────────────────────────────────┤ │
│ • SURAT MASUK     │ │ DATA TABLE (TanStack Table + URL state via nuqs)                        │ │
│   - Surat Masuk   │ │ [✓] No | Nomor Surat | Dari | Hal | Tgl Surat | Tgl Terima | TTE | Aksi │ │
│   - Terkirim      │ ├─────────────────────────────────────────────────────────────────────────┤ │
│ • SURAT KELUAR    │ │ DUAL-PANE DETAIL & DISPOSITION VIEW (`/document/[id]`)                  │ │
│   - Persetujuan   │ │ ┌───────────────────────────────┐ ┌───────────────────────────────────┐ │ │
│   - Telusuri      │ │ │ Data Surat                    │ │ Disposisi / Teruskan / Reviu    │ │ │
│   - Konsep        │ │ │ • Agenda & Nomor Surat        │ │ • Mode: Disposisi vs Teruskan   │ │ │
│   - Terkirim      │ │ │ • Pengesahan TTE & Masa Aktif │ │ • 12 Checklist Tindakan Standar │ │ │
│   - Dibatalkan    │ │ │ • Lampiran PDF & Isi Naskah   │ │ • Pohon Riwayat (Lineage Tree)  │ │ │
│ • NOTA DINAS      │ │ └───────────────────────────────┘ └───────────────────────────────────┘ │ │
│ • SMT & ADMIN     │ └─────────────────────────────────────────────────────────────────────────┘ │
└───────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Navigasi Sidebar & Pembuatan Naskah

### A. Tombol Utama `+ BUAT NASKAH DINAS`
Dropdown menu pembuatan naskah terbagi dalam kategori:
1. **Naskah Dinas Korespondensi**:
   - *Surat Keluar* (Eksternal / Antar-unit)
   - *Nota Dinas* (Internal unit kerja)
   - *Naskah Dinas Gabungan* (Surat Keluar + Nota Dinas)
2. **Naskah Dinas Lainnya**:
   - *Surat Keputusan (SK)*
   - *Surat Edaran (SE)*
   - *Surat Tugas (ST)*
3. **Menu Tambahan**:
   - *Digital Sign Upload* (Unggah berkas untuk penandatanganan elektronik mandiri)
   - *Admin Panel* (Tata kelola posisi, pengguna, dan alur surat)

### B. Struktur Menu Sidebar
- **SURAT MASUK**:
  - `Surat Masuk` (Badge jumlah surat belum diproses, misal: `46`)
  - `Terkirim`
- **SURAT KELUAR**:
  - `Persetujuan` (Badge dokumen butuh reviu/paraf/TTE, misal: `1`)
  - `Telusuri` (Pencarian arsip keluar)
  - `Konsep` (Draft naskah)
  - `Terkirim` (Naskah sah & terkirim)
  - `Dibatalkan` (Naskah dibatalkan / ditolak)
- **NOTA DINAS**:
  - `Nota Dinas` (Badge nota dinas masuk, misal: `2`)
  - `Persetujuan` / `Telusuri` / `Konsep` / `Terkirim` / `Dibatalkan`
- **NASKAH DINAS GABUNGAN**
- **SISTEM MANAJEMEN TERINTEGRASI (SMT)** & **FAVORIT**

---

## 3. Data Table Persuratan (Inbox / Outbox)

### A. Komponen Filter Atas (Vanguard Filter Toolbar)
- **Kategori / Tipe**: Filter jenis naskah (Surat Masuk, Nota Dinas, Surat Keluar).
- **Rentang Tanggal**: Tanggal awal s/d Tanggal akhir (`YYYY-MM-DD`).
- **Pencarian Parameter**: Pilihan pencarian berdasarkan *Hal*, *Nomor Surat*, *Nomor Agenda*, atau *Pengirim*.
- **Input Kata Kunci**: Text input pencarian full-text.
- **Tombol Aksi**: Tombol `Cari`, Tombol `Reload / Muat Ulang`, dan Tombol `Cetak Rekap`.

### B. Kolom Data Table Standar
1. **Checkbox Selection**: Multi-select untuk disposisi/arsip massal.
2. **No**: Nomor urut baris (1, 2, 3, ...).
3. **Nomor Surat / Nota Dinas**: 
   - Ikon amplop / kertas merah/abu-abu.
   - Teks nomor surat berformat resmi: `XXXXX/KODE_KLASIFIKASI/KODE_POSISI/TAHUN` (misal: `47294/MRK.00.03/F01090300/2026`).
   - Tautan berwarna teal (`#145f74`) yang mengarah langsung ke halaman detail dokumen.
4. **Dari**: Jabatan struktural pengirim (misal: `EVP MRE PLN`, `GM UID S2JB PLN`, `KSDTI PLN`).
5. **Hal**: Perihal naskah dinas.
6. **Tgl Surat**: Tanggal naskah dibuat / disahkan.
7. **Tgl Terima**: Tanggal naskah masuk ke inbox posisi aktif.
8. **TTE / Status**:
   - Ikon QR Code (Naskah telah bertanda tangan elektronik tersertifikasi).
   - Indikator Urgensi: `!` (Penting/Segera) atau `!!` (Sangat Segera/Kilat).
9. **Action Quick Buttons**:
   - ⭐ *Favorit*
   - ✉️ *Tandai Telah Dibaca*
   - ↪️ *Disposisi Cepat*
   - 📎 *Unduh Lampiran*

---

## 4. Halaman Detail Dokumen & Disposisi (`/document/[id]`)

Mengadopsi tata letak **Dual-Pane Split View** (Gambar Benchmark 5):

### A. Top Action Bar
- Tombol `← kembali`: Kembali ke inbox atau daftar sebelumnya.
- Badge Status Naskah: `DRAFT`, `IN_REVIEW`, `NEEDS_REVISION`, `SIGNED_AND_PUBLISHED`, `REJECTED`.
- Tombol `Copy Nomor (Untuk PLH)`: Menyalin nomor naskah untuk administrasi pejabat pelaksana harian.
- Tombol `Cetak / Unduh PDF`.

### B. Panel Kiri: Data Surat & Metadata
Menampilkan tabel metadata resmi naskah dinas:
- **No Agenda**: Nomor registrasi agenda persuratan.
- **Tanggal Terima**: Waktu naskah diterima di inbox posisi aktif.
- **Nomor Surat**: Nomor resmi naskah dengan tombol salin.
- **Pengesahan**: Status TTE (Tanda Tangan Elektronik resmi PLN) atau status paraf.
- **Tanggal Surat**: Tanggal naskah diterbitkan.
- **Rentang Waktu Aktif**: Masa retensi aktif naskah (misal: 2 tahun sejak tanggal naskah).
- **Rentang Waktu Inaktif**: Masa retensi inaktif naskah (misal: 3 tahun setelah masa aktif berakhir) sesuai tata kelola arsip (ADR-006).
- **Hal**: Perihal lengkap naskah.
- **Dari**: Nama jabatan struktural pengirim naskah dinas.
- **Kepada**: Daftar berurutan seluruh jabatan penerima (1, 2, 3, ...).

#### Bottom Tab Panel Kiri:
1. **Isi Naskah**: Tampilan format surat resmi dengan typography naskah dinas PLN.
2. **Lampiran (Attachment)**: Kartu berkas lampiran pendukung (misal: PDF, Spreadsheet) dengan ukuran berkas dan tombol unduh.
3. **Pemeriksaan & Paraf**: Riwayat paraf verifikator sebelum penandatanganan akhir.

---

### C. Panel Kanan: Disposisi / Teruskan / Reviu

#### 1. Skenario Naskah Dalam Reviu (`IN_REVIEW`)
- **Pemeriksaan & Paraf Verifikator**:
  - Catatan reviu / koreksi naskah.
  - Tombol **Setujui & Paraf**.
  - Tombol **Minta Revisi** (mengembalikan naskah ke konseptor).
  - Tombol **Tolak Naskah**.
- **Penandatangan Akhir (Signer)**:
  - Tombol **Tandatangani Secara Elektronik (TTE)**: Memberikan nomor resmi otomatis secara atomik (`document_counters` dengan kunci pesimis `FOR UPDATE`), menyematkan stempel TTE, dan mengubah status menjadi `SIGNED_AND_PUBLISHED`.

#### 2. Skenario Naskah Telah Sah (`SIGNED_AND_PUBLISHED`) - Form Disposisi Standar
- **Mode Transmisi (Radio)**:
  - `Disposisi`: Ditujukan ke bawahan struktural secara hierarkis (menggunakan hirarki posisi `ltree` - ADR-002).
  - `Teruskan`: Ditujukan ke posisi sejajar atau lintas unit kerja.
- **12 Checklist Aksi Standar PLN**:
  1. *1. Untuk Diketahui*
  2. *2. Untuk Diperhatikan*
  3. *3. Untuk Dipelajari*
  4. *4. Disiapkan Jawaban*
  5. *5. Jawab Langsung*
  6. *6. ACC Untuk Ditindak Lanjuti*
  7. *7. Ambil Langkah Seperlunya*
  8. *8. Dibicarakan*
  9. *9. Dilaporkan*
  10. *10. Segera Diselesaikan*
  11. *11. Copy untuk ....*
  12. *12. Lainnya*
- **Kepada**: Searchable Combobox daftar posisi penerima (mengambil data dinamis dari `org_positions`).
- **Keterangan**: Catatan arahan instruksi spesifik.
- **Tipe Disposisi (Radio)**:
  - `Terbuka`: Riwayat disposisi dapat dibaca oleh seluruh rantai disposisi unit kerja.
  - `Tertutup`: Riwayat disposisi hanya dapat dibaca oleh pemberi dan penerima instruksi (ADR-005).
- **Tombol Aksi**: `Kirim Disposisi` atau `Teruskan Naskah`.

#### 3. Bagian Bawah: Tindakan & Riwayat Tindakan (Pohon Disposisi)
- **Tab `Tindakan Untuk Saya`**:
  - Menampilkan instruksi aktif yang ditujukan kepada posisi pengguna saat ini, lengkap dengan checklist aksi yang harus dijalankan.
- **Tab `Riwayat Tindakan` (Lineage Tree)**:
  - Visualisasi pohon hierarki instruksi dari manajemen puncak hingga pelaksana di lapangan secara berurutan dengan penanda waktu, nama jabatan pengirim, penerima, dan catatan instruksi.

---

## 5. Ringkasan Kepatuhan ADR

| Keputusan Arsitektur | Implementasi pada Sistem |
| :--- | :--- |
| **ADR-001 (Next.js App Router)** | Server Components untuk tata letak shell, Client Components khusus untuk area form interaktif (`ComposerForm`, `DispositionForm`, `DataTable`). |
| **ADR-002 (Hierarki Posisi PBAC via ltree)** | Otorisasi berbasis posisi aktif pengguna (`activePositionId`), bukan role string statis. |
| **ADR-003 (State Machine Status Naskah)** | Validasi transisi status seragam (`DRAFT` → `IN_REVIEW` → `SIGNED_AND_PUBLISHED` / `NEEDS_REVISION` / `REJECTED`) dengan penguncian dokumen (`isLocked`). |
| **ADR-004 (Penomoran Otomatis Atomik)** | Pemanfaatan tabel `document_counters` dengan isolasi transaksi dan pessimistic lock `FOR UPDATE` untuk mencegah nomor ganda/race condition. |
| **ADR-005 (Pemisahan Disposisi vs Teruskan)** | Dukungan kolom `transmission_mode` (`DISPOSITION` vs `FORWARD`) dan `disposition_type` (`OPEN` vs `CLOSED`) dengan audit trail lengkap. |
| **ADR-006 (Tata Kelola Retensi Arsip)** | Kalkulasi otomatis rentang waktu aktif (+2 tahun) dan inaktif (+3 tahun) berdasarkan klasifikasi naskah dinas. |
| **ADR-008 (Validasi End-to-End)** | Skema Zod terpusat di `@/shared/schemas`, tRPC v11 untuk komunikasi API yang type-safe, dan TanStack Table + `nuqs` untuk sinkronisasi state URL. |
