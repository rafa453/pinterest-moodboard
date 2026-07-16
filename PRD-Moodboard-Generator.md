# PRD: Mood Board Generator

**Versi:** 0.3 (semua open questions terjawab, siap implementasi)
**Status:** Proyek personal — semua keputusan desain sudah final

---

## 1. Ringkasan

Web app untuk membuat mood board bergaya Pinterest: user upload gambar sendiri, gambar tersusun dalam grid masonry, board bisa disimpan dan dibagikan lewat link unik. Tanpa sistem scraping atau fetch dari API gambar eksternal.

---

## 2. Konteks

Proyek personal (bukan produk untuk pasar/tim). Ini menentukan banyak keputusan desain di dokumen ini — scope sengaja dibuat kecil dan ringan, bukan dioptimalkan untuk skala atau multi-tenant.

---

## 3. Goals (v1)

- User bisa membuat board baru tanpa perlu bikin akun
- User bisa upload hingga **10 gambar per board** (format: JPEG, PNG, WebP; max **5MB per file**)
- Gambar tersusun otomatis dalam grid masonry (tanpa reposisi manual)
- Board bisa diakses siapa pun yang punya link (slug unik)
- Pemilik board (identifikasi lewat edit token) bisa:
  - Menghapus gambar dari board
  - Mengedit judul board
- Board yang tidak diakses selama **90 hari** dihapus otomatis via cron harian

---

## 4. Non-Goals (secara eksplisit di luar scope v1)

- **Autentikasi/akun user (OAuth/Google login)** — tidak ada sistem login. Kepemilikan board ditangani lewat edit token sederhana, bukan akun pengguna. Tidak ada fitur "daftar semua board saya".
- **Drag-and-drop / reposisi bebas** — layout murni masonry otomatis.
- **Fetch gambar dari API eksternal (Unsplash/Pexels)** — hanya upload manual.
- **Tag, kategori, atau search** — tidak ada fitur organisasi board lintas-board.
- **Kolaborasi real-time** — tidak ada multi-user editing bersamaan.
- **Format HEIC/GIF/AVIF** — hanya JPEG, PNG, WebP yang diterima.
- **Landing page / gallery publik** — homepage langsung menampilkan form create board.

---

## 5. User Stories

| # | Sebagai... | Saya ingin... | Supaya... |
|---|---|---|---|
| 1 | Pengunjung | membuat board baru tanpa daftar akun | bisa langsung mulai tanpa friksi |
| 2 | Pemilik board | upload beberapa gambar sekaligus (multi-select) | mengisi board dengan cepat |
| 3 | Pemilik board | mendapat link unik setelah board dibuat | bisa membagikannya ke orang lain |
| 4 | Siapa pun dengan link | melihat board dalam grid masonry rapi | pengalaman visual mirip Pinterest |
| 5 | Pemilik board | menghapus gambar yang salah upload | menjaga board tetap rapi |
| 6 | Pemilik board | mengedit judul board | memberi nama yang lebih deskriptif |
| 7 | Pemilik board yang lupa token | minta token dikirim ulang ke email | mendapatkan kembali akses edit |

---

## 6. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | Fullstack dalam satu repo |
| ORM | Prisma | Standar de-facto untuk Next.js + MySQL |
| Database | MySQL | Familiar dari proyek sebelumnya (ComSTraC) |
| File storage | Vercel Blob | Wajib karena target deploy Vercel (filesystem read-only di runtime) |
| Image metadata | `sharp` atau `image-size` | Ambil width/height sebelum simpan, untuk cegah layout shift di masonry |
| Slug generator | `nanoid` | Slug unik pendek untuk share link |
| Email service | **Resend** | Free tier 100 email/hari cukup untuk proyek personal, integrasi Next.js mudah |

---

## 7. Data Model (Prisma)

```prisma
model Board {
  id             Int      @id @default(autoincrement())
  slug           String   @unique @db.VarChar(12)
  title          String   @default("Untitled Board") @db.VarChar(100)
  editToken      String   @db.VarChar(36)        // UUID, dikirim ke client SEKALI saat create, disimpan di localStorage
  email          String?  @db.VarChar(255)        // Opsional — untuk recovery token. NULL kalau user skip.
  createdAt      DateTime @default(now())
  lastAccessedAt DateTime @default(now())         // Update tiap kali GET board, dipakai untuk cleanup job
  images         Image[]
}

model Image {
  id         Int      @id @default(autoincrement())
  boardId    Int
  board      Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  filePath   String   @db.VarChar(255)            // URL dari Vercel Blob
  width      Int
  height     Int
  position   Int                                   // Urutan upload, tidak di-reorder saat delete
  uploadedAt DateTime @default(now())
}
```

**Catatan implementasi edit token:**
- Endpoint `POST/DELETE/PATCH` yang membutuhkan kepemilikan wajib menerima `editToken` via header `x-edit-token` dan validasi terhadap `Board.editToken` sebelum eksekusi.
- `GET` board **tidak perlu** editToken (board publik untuk siapa pun yang punya link).

**Catatan field email:**
- Disimpan di server, **tidak pernah dikirim ke client** dalam response GET/POST biasa.
- Hanya dipakai oleh endpoint recovery untuk mengirim email via Resend.

**Catatan field position:**
- Nilai `position` adalah urutan upload. Saat gambar dihapus, posisi **tidak di-reorder** — masonry layout tetap konsisten karena `ORDER BY position ASC`.

**Catatan limit 10 gambar:**
- Validasi di endpoint upload — cek `COUNT(images WHERE boardId = ...)` sebelum insert, tolak dengan error jelas kalau sudah 10.

---

## 8. API Endpoints (v1)

| Method | Route | Fungsi | Auth |
|---|---|---|---|
| POST | `/api/boards` | Buat board baru, body: `{ title?, email? }`, return `{ slug, editToken }` — editToken hanya dikirim sekali di sini | — |
| GET | `/api/boards/[slug]` | Ambil board + semua gambar (urut by `position`), update `lastAccessedAt` | — |
| PATCH | `/api/boards/[slug]` | Edit title board, body: `{ title, editToken }` | editToken |
| POST | `/api/boards/[slug]/images` | Upload **satu file** per request via `multipart/formData`. Frontend loop untuk multi-select. Validasi: editToken, format (JPEG/PNG/WebP), ukuran max 5MB, limit 10/board | editToken |
| DELETE | `/api/boards/[slug]/images/[id]` | Validasi editToken → hapus dari Vercel Blob → hapus dari DB | editToken |
| POST | `/api/boards/[slug]/recover` | Kirim editToken ke email terdaftar via Resend. Rate-limited (max 3x/jam per slug). Response selalu generik (anti-enumeration). | — |
| GET | `/api/cron/cleanup` | Dipanggil Vercel Cron (1x/hari) — hapus board + gambar terkait dengan `lastAccessedAt` > **90 hari**. Validasi via `CRON_SECRET` header (Vercel auto-inject). | CRON_SECRET |

---

## 9. UX Flow

### 9.1 Create Board (Homepage)
1. User buka homepage → form minimalis: input `title` (opsional, placeholder "Untitled Board") + input `email` (opsional, label "Untuk recovery token jika hilang")
2. Jika user **skip email** → tampil warning inline: *"Tanpa email, token yang hilang tidak bisa dipulihkan. Simpan link edit kamu dengan aman."*
3. Klik "Buat Board" → `POST /api/boards` → redirect ke `/{slug}?token={editToken}` (token di URL hanya saat pertama, langsung disimpan ke localStorage lalu URL parameter dibersihkan)

### 9.2 Upload Gambar
1. User klik area upload / drop zone → file picker multi-select (JPEG, PNG, WebP)
2. Frontend memfilter file yang tidak sesuai format atau melebihi 5MB sebelum upload, tampilkan error per file
3. Frontend loop — kirim tiap file satu per satu ke `POST /api/boards/[slug]/images`
4. Progress ditampilkan per gambar (misal: "3 dari 5 gambar berhasil diupload")
5. Masonry grid di-refresh inkremental setiap gambar berhasil masuk

### 9.3 Token Recovery
1. User buka board tanpa token di localStorage → mode view-only (tidak ada tombol hapus/edit)
2. Tampil link kecil: *"Kamu pemilik board ini? Pulihkan akses edit"*
3. Klik → modal: input email → `POST /api/boards/[slug]/recover`
4. Response selalu: *"Kalau email ini terdaftar, token sudah dikirim."* (anti-enumeration)

---

## 10. Risiko & Trade-off yang Perlu Disadari

1. **Edit token bukan security sungguhan, cuma friksi.** Token bisa dilihat lewat localStorage/devtools. Untuk proyek personal ini diterima sebagai trade-off sadar.
2. **Slug 12 karakter bisa ditebak lewat brute-force** kalau board bersifat sensitif — untuk mood board kasual risiko ini rendah, dicatat sebagai batasan desain.
3. **Cron cleanup di Vercel Hobby dibatasi 1x/hari** dan tidak presisi (bisa meleset ~1 jam). Threshold 90 hari sudah cukup longgar sehingga ketidakpresisian jadwal tidak menjadi masalah.
4. **Vercel Blob tier Hobby ~1GB/bulan**. Max 5MB × 10 gambar = 50MB/board → ~20 board sebelum quota penuh. Cukup untuk proyek personal.
5. **Recovery endpoint rawan abuse** — dimitigasi dengan rate limiting 3x/jam per slug dan response anti-enumeration.
6. **Route handler upload di App Router** perlu penanganan `formData()` native yang benar — titik yang paling sering salah kalau digenerate otomatis tanpa review.

---

## 11. Semua Keputusan Final (v0.3)

| Topik | Keputusan |
|-------|-----------|
| Target | Proyek personal |
| Auth | Tanpa OAuth, edit token per board |
| Limit gambar | 10 gambar per board |
| Ukuran file | Max 5MB per gambar |
| Format gambar | JPEG, PNG, WebP saja |
| Retensi | Board tidak aktif 90 hari dihapus via cron harian |
| Title | Opsional (default `"Untitled Board"`), bisa diedit setelah create |
| Email recovery | Opsional saat create, token dikirim via Resend |
| Homepage | Form create board langsung (tanpa landing page) |
| Multi-upload | Multi-select file picker, frontend kirim sequential satu per satu |
| Email service | Resend |
