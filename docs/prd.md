## Dokumen Kebutuhan Produk: Sistem Tata Naskah Dinas Elektronik Korporat

Dokumen ini mendefinisikan arsitektur fungsional, spesifikasi teknis, skema data, dan batasan operasional untuk platform Tata Naskah Dinas Elektronik korporat berskala *enterprise*.

---

## Ringkasan Eksekutif dan Tujuan Produk

Sistem Tata Naskah Dinas Elektronik korporat dirancang untuk mendigitalisasi birokrasi persuratan resmi, alur pengesahan berjenjang, dan delegasi instruksi kerja antar-unit bisnis secara nir-kertas.

### Sasaran Utama

* Menghilangkan proses birokrasi fisik dokumen dinas melalui alur persetujuan digital berjenjang.
* Menjamin keabsahan dokumen naskah dinas dengan sistem penomoran terpusat bebas duplikasi dan pengesahan digital berbasis verifikasi kriptografis.
* Menyediakan pelacakan rantai komando secara *real-time* melalui pohon disposisi dokumen multi-cabang.
* Menjamin integritas audit kepatuhan korporat lewat pencatatan log forensik pada setiap mutasi data.

---

## Struktur Peran dan Hak Akses

Sistem menggunakan model *Position-Based Access Control*, di mana kewenangan melekat pada jabatan struktural dalam hierarki organisasi, bukan pada akun personal individu.

| Peran | Deskripsi Kewenangan | Lingkup Hak Akses |
| --- | --- | --- |
| **Pembuat Konsep** | Staf operasional penyusun draf naskah dinas. | Membuat konsep naskah, mengunggah lampiran, mengajukan draf ke atasan langsung, menarik draf kembali sebelum ditinjau. |
| **Pemeriksa / Verifikator** | Pejabat struktural tingkat menengah (seperti Asisten Manajer atau Manajer). | Memeriksa isi draf, membubuhkan paraf verifikasi, memberikan catatan koreksi, mengembalikan draf untuk perbaikan, meneruskan draf ke atasan berikutnya. |
| **Penandatangan Dokumen** | Pejabat berwenang pengambil keputusan tertinggi (seperti Senior Manajer atau General Manager). | Menyetujui naskah dinas, menolak dokumen secara permanen, memicu penerbitan nomor surat resmi, membubuhkan tanda tangan elektronik resmi. |
| **Pelaksana Disposisi** | Pejabat atau staf penerima pelimpahan tugas atas naskah dinas yang sudah terbit. | Membaca naskah dinas, membuat cabang disposisi turunan ke bawahan, menandai instruksi tindakan sebagai selesai, mengisi laporan tindak lanjut. |
| **Administrator Unit** | Pengelola persuratan sekretariat unit kerja. | Mengonfigurasi templat surat, memantau buku agenda penomoran, mendaftarkan surat masuk fisik dari pihak luar, mengelola berkas arsip aktif dan inaktif. |

---

## Spesifikasi Kebutuhan Fungsional

### Modul 1: Manajemen Struktur Organisasi dan Delegasi Jabatan

* **Pohon Hirarki Dinamis:** Sistem harus memetakan struktur organisasi korporat tanpa batasan kedalaman menggunakan model pohon berhierarki, mencakup relasi atasan langsung, unit kerja induk, dan unit kerja pelaksana.
* **Delegasi Wewenang Sementara:** Pejabat struktural berhak menunjuk Pelaksana Harian atau Pelaksana Tugas saat sedang cuti atau dinas luar.
* **Masa Berlaku Delegasi:** Penunjukan Pelaksana Harian wajib memiliki rentang waktu aktif yang ditentukan di awal. Seluruh hak persetujuan otomatis beralih ke Pelaksana Harian selama rentang waktu tersebut dan kembali ke pejabat definitif secara otomatis saat periode berakhir.
* **Audit Identitas Penandatangan:** Dokumen yang disetujui oleh pejabat pengganti wajib mencantumkan keterangan penandatanganan atas nama jabatan resmi.

### Modul 2: Pembangkitan Nomor Naskah Dinas Atomik

* **Algoritma Format Baku:** Sistem wajib mengompilasi nomor naskah secara dinamis berdasarkan pola:
`[Nomor Urut]/[Kode Klasifikasi Perihal]/[Kode Jabatan Unit Penerbit]/[Tahun Terbit]`
* **Pencegahan Nomor Ganda:** Pembangkitan nomor urut harus dieksekusi menggunakan isolasi transaksi tingkat tinggi dengan mekanisme *pessimistic locking* pada tabel penghitung naskah dinas untuk menghindari tabrakan nomor pada kondisi konkurensi tinggi.
* **Pemesanan Nomor Khusus:** Menyediakan fitur penomoran manual bagi naskah dinas bertanggal mundur yang berasal dari koordinasi luar jaringan dengan persetujuan administrator sekretariat.

### Modul 3: Siklus Hidup Naskah dan Mesin Alur Kerja Persetujuan

Siklus hidup dokumen dikelola menggunakan *finite state machine* terpusat.

```
[DRAFT] ---> [IN_REVIEW] ---> [NEEDS_REVISION] ---> [DRAFT]
                   |
                   v
             [APPROVED] ---> [SIGNED_AND_PUBLISHED]
                   |
                   v
              [REJECTED]

```

* **Draf dan Validasi Isian:** Pembuat naskah mengisi metadata berupa perihal, sifat naskah (biasa, segera, rahasia), daftar tembusan, isi naskah via *rich-text*, serta berkas lampiran pendukung.
* **Rantai Pemeriksa Fleksibel:** Jalur persetujuan dapat berjalan sekuensial mengikuti bagan hierarki struktural atau menyertakan peninjau tambahan non-struktural (seperti Pejabat Kepatuhan atau Legal) sebelum naskah mencapai penandatangan akhir.
* **Aksi Peninjauan Dokumen:** Pejabat peninjau memiliki hak aksi berupa:
* **Setuju:** Membubuhkan paraf digital dan meneruskan naskah ke peninjau berikutnya.
* **Revisi:** Mengembalikan naskah ke pembuat konsep disertai catatan perbaikan baris-per-baris, mengubah status menjadi `NEEDS_REVISION`, dan mengunci akses peninjau lain.
* **Tolak:** Membatalkan naskah secara permanen dengan status `REJECTED`.


* **Pembatalan oleh Pengirim:** Pembuat konsep dapat membatalkan draf surat yang berstatus `IN_REVIEW` selama peninjau tingkat pertama belum mengambil tindakan.

### Modul 4: Distribusi Dokumen dan Pohon Disposisi

* **Distribusi Otomatis Naskah Terbit:** Tepat saat penandatangan akhir menyetujui naskah, sistem secara otomatis menerbitkan nomor surat, menyalin dokumen ke kotak masuk seluruh jabatan yang tercantum di kolom penerima utama dan tembusan, serta membunyikan notifikasi waktu nyata.
* **Mekanisme Pelimpahan Disposisi:** Penerima naskah dinas dapat melimpahkan mandat tugas kepada satu atau beberapa pejabat bawahan langsung secara paralel.
* **Parameter Disposisi:** Setiap instruksi disposisi wajib memuat:
* **Tipe Disposisi:** Terbuka (dapat dilihat oleh seluruh rantai disposisi di unit kerja) atau Tertutup (hanya dapat dibaca oleh target bawahan yang dipilih).
* **Daftar Checklist Tindakan:** Pilihan minimal mencakup 12 instruksi standar (antara lain: Untuk Diketahui, Untuk Diperhatikan, Untuk Dipelajari, Disiapkan Jawaban, Jawab Langsung, Setuju Untuk Ditindaklanjuti, Ambil Langkah Seperlunya, Dibicarakan, Dilaporkan, Segera Diselesaikan, Salinan Untuk, Lainnya).
* **Catatan Arahan:** Instruksi tekstual spesifik dari atasan.
* **Batas Waktu Penyelesaian:** Tanggal dan jam target penyelesaian instruksi.


* **Pelacakan Pohon Silsilah:** Sistem wajib menyajikan visualisasi rantai instruksi dari pimpinan tertinggi hingga staf pelaksana terbawah dalam satu antarmuka hierarki terpadu.

### Modul 5: Tanda Tangan Elektronik dan Integritas Berkas

* **Kompilasi Berkas Akhir:** Sistem menghasilkan dokumen PDF final yang menyatukan naskah dinas, nomor surat definitif, daftar riwayat paraf, dan lampiran.
* **Penyematan Kode QR Dinamis:** Dokumen resmi disematkan kode QR di pojok kanan bawah yang mengarah ke tautan verifikasi integritas publik.
* **Halaman Validasi Publik:** Saat kode QR dipindai pihak eksternal, sistem menampilkan halaman verifikasi naskah yang membuktikan keaslian dokumen tanpa menampilkan data rahasia korporat.
* **Enkripsi Integritas:** Berkas PDF ditandatangani secara kriptografis menggunakan sertifikat digital korporat dengan algoritma pencacah SHA-256 untuk mendeteksi perubahan ilegal pada berkas setelah diterbitkan.

### Modul 6: Tata Kelola Arsip dan Retensi Dokumen

* **Jadwal Retensi Otomatis:** Setiap naskah yang diterbitkan langsung dikalkulasi masa simpan arsipnya berdasarkan kode klasifikasi naskah:
* Masa Aktif: Naskah tetap tampil di kotak masuk operasional harian.
* Masa Inaktif: Naskah otomatis dipindahkan ke modul arsip statis dan hanya dapat diakses melalui pencarian buku agenda arsip.


* **Pencarian Cepat:** Mesin pencarian dokumen mendukung pemfilteran multi-parameter: rentang tanggal naskah, nomor agenda, perihal, unit penerbit, dan pencarian teks lengkap pada badan surat.

---

## Rancangan Skema Basis Data

```
+------------------+       +-------------------+       +-----------------------+
|  org_positions   |       |       users       |       |  position_delegations |
+------------------+       +-------------------+       +-----------------------+
| id (PK)          |<------| id (PK)           |       | id (PK)               |
| title            |       | position_id (FK)  |       | delegator_pos_id (FK) |
| parent_id (FK)   |       | name              |       | delegatee_user_id(FK) |
| unit_code        |       | email             |       | start_date / end_date |
+--------+---------+       +-------------------+       +-----------------------+
         |
         |
         +-----------------------------+
         |                             |
         v                             v
+------------------+       +-----------------------+
|    documents     |       |   document_approvals  |
+------------------+       +-----------------------+
| id (PK)          |<------| id (PK)               |
| doc_number       |       | document_id (FK)      |
| status           |       | reviewer_pos_id (FK)  |
| classification   |       | step_order            |
| sender_pos_id(FK)|       | status (WAIT/ACC/REV) |
+--------+---------+       +-----------------------+
         |
         v
+------------------+
|   dispositions   |
+------------------+
| id (PK)          |
| document_id (FK) |
| parent_id (FK)   |
| from_pos_id (FK) |
| to_pos_id (FK)   |
| action_checklist |
+------------------+

```

### 1. `org_positions`

Menyimpan struktur hierarki organisasi.

* `id` (UUID, Primary Key)
* `code` (VARCHAR, Unique): Kode jabatan resmi, misal: `SM KEU`, `GM UID S2JB`.
* `title` (VARCHAR): Nama lengkap jabatan.
* `parent_id` (UUID, Nullable, Foreign Key ke `org_positions.id`): Jabatan atasan langsung.
* `unit_id` (UUID): Relasi ke tabel unit kerja.
* `is_signer` (BOOLEAN): Status apakah posisi ini berwenang menandatangani naskah keluar.

### 2. `users`

Identitas pegawai yang mengoperasikan akun.

* `id` (UUID, Primary Key)
* `nip` (VARCHAR, Unique): Nomor Induk Pegawai.
* `name` (VARCHAR): Nama lengkap beserta gelar.
* `email` (VARCHAR, Unique): Alamat surel perusahaan.
* `position_id` (UUID, Foreign Key ke `org_positions.id`): Jabatan aktif saat ini.
* `signature_passphrase_hash` (VARCHAR): Kunci pengaman otorisasi tanda tangan dokumen.

### 3. `position_delegations`

Pencatatan pelimpahan wewenang pejabat sementara.

* `id` (UUID, Primary Key)
* `delegator_position_id` (UUID, Foreign Key ke `org_positions.id`): Posisi pejabat definitif.
* `delegatee_user_id` (UUID, Foreign Key ke `users.id`): Pegawai yang ditunjuk sebagai Pelaksana Harian.
* `delegation_type` (ENUM: `PLH`, `PLT`): Tipe penunjukan.
* `assignment_letter_ref` (VARCHAR): Nomor surat tugas dasar penunjukan.
* `valid_from` (TIMESTAMPTZ): Waktu mulai aktif wewenang.
* `valid_until` (TIMESTAMPTZ): Waktu kedaluwarsa wewenang.

### 4. `documents`

Entitas pusat naskah dinas.

* `id` (UUID, Primary Key)
* `document_type` (ENUM: `NOTA_DINAS`, `SURAT_KELUAR`, `SURAT_TUGAS`, `SURAT_EDARAN`)
* `document_number` (VARCHAR, Nullable, Indexed): Terisi otomatis pasca-persetujuan akhir.
* `agenda_number` (VARCHAR): Nomor registrasi buku agenda masuk/keluar.
* `classification_code` (VARCHAR): Kode klasifikasi kearsipan naskah dinas.
* `subject` (TEXT): Hal / ringkasan perihal naskah.
* `body_html` (TEXT): Isi naskah dalam format tata letak web.
* `security_level` (ENUM: `BIASA`, `TERBATAS`, `RAHASIA`, `SANGAT_RAHASIA`)
* `urgency_level` (ENUM: `BIASA`, `SEGERA`, `KILAT`)
* `creator_user_id` (UUID, Foreign Key ke `users.id`)
* `sender_position_id` (UUID, Foreign Key ke `org_positions.id`)
* `current_status` (ENUM: `DRAFT`, `IN_REVIEW`, `NEEDS_REVISION`, `APPROVED`, `SIGNED_AND_PUBLISHED`, `REJECTED`, `CANCELLED`)
* `retention_active_date` (DATE): Batas akhir periode berkas aktif.
* `retention_inactive_date` (DATE): Batas akhir periode berkas inaktif sebelum eliminasi.
* `final_pdf_path` (VARCHAR, Nullable): Lokasi penyimpanan berkas PDF tersumpah.

### 5. `document_approvals`

Log jalur verifikasi dan persetujuan naskah dinas.

* `id` (UUID, Primary Key)
* `document_id` (UUID, Foreign Key ke `documents.id`, On Delete Cascade)
* `reviewer_position_id` (UUID, Foreign Key ke `org_positions.id`): Jabatan pemeriksa.
* `actual_reviewer_user_id` (UUID, Nullable, Foreign Key ke `users.id`): Pengguna riil yang mengeksekusi aksi.
* `step_order` (INTEGER): Urutan hierarki peninjauan (1, 2, 3, dst).
* `approval_role` (ENUM: `INITIAL_DRAFTER`, `VERIFIER_PARAF`, `FINAL_SIGNER`)
* `action_status` (ENUM: `PENDING`, `APPROVED`, `REVISED`, `REJECTED`)
* `notes` (TEXT, Nullable): Catatan pengembalian revisi atau disposisi arahan.
* `acted_at` (TIMESTAMPTZ, Nullable): Stempel waktu pelaksanaan tinjauan.

### 6. `dispositions`

Pohon penugasan tindak lanjut surat masuk dan nota dinas terbit.

* `id` (UUID, Primary Key)
* `document_id` (UUID, Foreign Key ke `documents.id`)
* `parent_disposition_id` (UUID, Nullable, Foreign Key ke `dispositions.id`): Induk rantai disposisi.
* `from_position_id` (UUID, Foreign Key ke `org_positions.id`): Pejabat pemberi instruksi.
* `to_position_id` (UUID, Foreign Key ke `org_positions.id`): Pejabat target pelaksana.
* `disposition_type` (ENUM: `OPEN`, `CLOSED`): Sifat keterbukaan disposisi.
* `action_checklist` (JSONB): *Array* daftar tindakan yang wajib dipenuhi.
* `instruction_notes` (TEXT): Catatan penugasan dari atasan.
* `deadline` (TIMESTAMPTZ): Batas waktu pengerjaan instruksi.
* `execution_status` (ENUM: `WAITING`, `IN_PROGRESS`, `COMPLETED`)
* `completed_at` (TIMESTAMPTZ, Nullable)
* `completion_report` (TEXT, Nullable): Ringkasan hasil kerja bawahan.

### 7. `document_audit_trails`

Pencatatan riwayat forensik seluruh operasi sistem.

* `id` (BIGSERIAL, Primary Key)
* `document_id` (UUID, Foreign Key ke `documents.id`)
* `actor_user_id` (UUID, Foreign Key ke `users.id`)
* `event_type` (VARCHAR): Jenis kejadian (contoh: `DRAFT_CREATED`, `PARAF_ADDED`, `DOC_REVISED`, `DISPOSITION_CREATED`, `DOC_DOWNLOADED`).
* `ip_address` (INET): Alamat jaringan pengguna.
* `user_agent` (TEXT): Informasi peramban atau perangkat klien.
* `state_payload` (JSONB): Rekaman status data sebelum dan sesudah perubahan dieksekusi.
* `created_at` (TIMESTAMPTZ): Stempel waktu pencatatan.

---

## Kebutuhan Non-Fungsional

### 1. Keamanan Data dan Integritas

* **Hak Baca Naskah Tertutup:** Dokumen dengan tingkat kerahasiaan `RAHASIA` dan `SANGAT_RAHASIA` hanya dapat diakses melalui verifikasi kredensial ganda oleh pejabat yang bersangkutan dan tidak dapat didelegasikan ke asisten non-struktural.
* **Audit Trail Tak Terubah:** Tabel riwayat forensik `document_audit_trails` berstatus *append-only*; basis data dilarang memiliki fungsi pembaruan ataupun penghapusan data pada tabel ini.
* **Enkripsi Data Diam:** Seluruh berkas PDF naskah dinas dan lampiran dienkripsi pada tingkat penyimpanan berkas menggunakan standar enkripsi AES-256.

### 2. Kinerja dan Ketersediaan Sistem

* **Pencegahan Kunci Konkurensi:** Pembangkitan nomor dokumen naskah dinas tidak boleh memblokir kueri baca sistem; transaksi penguncian baris penghitung nomor dibatasi durasi penyelesaiannya maksimal 500 milidetik.
* **Beban Render Dokumen:** Pembangkitan berkas PDF naskah dinas dan penyematan kode QR wajib didelegasikan ke antrean proses latar belakang tanpa memblokir benang utama peramban pengguna.
* **Waktu Muat Antarmuka:** Tampilan kotak masuk utama naskah dinas wajib memuat 50 baris data pertama dalam waktu kurang dari 1,5 detik pada koneksi jaringan standar korporat.

### 3. Kepatuhan Kearsipan

* **Retensi Dokumen Otomatis:** Sistem wajib menjalankan proses terjadwal setiap tengah malam untuk memvalidasi tanggal aktif naskah dinas dan mengubah status dokumen yang melewati batas retensi aktif menjadi arsip inaktif.
* **Penyimpanan Permanen:** Naskah dinas yang berstatus diterbitkan tidak boleh dihapus secara fisik dari basis data demi memenuhi standar audit kearsipan korporat. Penghapusan hanya diperbolehkan secara logika dengan tanda pembatalan resmi.