PRD — MyAds Revenue Tracker
1. Overview
Nama Produk: MyAds Revenue Tracker
Platform: Web App (Fullstack JavaScript)
Tujuan: Dashboard pribadi untuk melacak pendapatan iklan dari multiple ad network, dikurangi biaya operasional, sehingga bisa melihat net profit bulanan secara real-time.

2. Target User
Single user (owner) — kamu sendiri. Tidak ada multi-tenant, tidak ada sistem registrasi publik.

3. Ad Networks yang Didukung
Network	Mekanisme Input
Clickadilla	Manual input / CSV import
Clickadu	Manual input / CSV import
Adsterra	Manual input / CSV import
API otomatis jika tersedia di tier berikutnya.

4. Fitur Utama
4.1 Dashboard Utama
Revenue Summary Card per bulan: total gross revenue dari semua network
Net Profit Card: gross revenue dikurangi semua pengeluaran
Breakdown per Ad Network: bar/line chart revenue masing-masing network
Trend Chart: grafik pendapatan 6–12 bulan terakhir
Profit Margin %: indikator sehat atau tidak
4.2 Input Revenue
Form tambah revenue per network, per bulan
Field: tanggal, network (dropdown), amount (USD/IDR), notes
Import CSV untuk bulk input
Edit & hapus entri
4.3 Manajemen Pengeluaran
Dua kategori pengeluaran:

Biaya Operasional Website (recurring):

Hosting
Domain
API Translate
Layanan SaaS lain
Pengeluaran Lain-lain (non-recurring):

Bebas diisi manual per entri
Field: tanggal, kategori, deskripsi, nominal
4.4 Laporan Bulanan
Tabel ringkasan: Revenue, Total Biaya, Net Profit per bulan
Filter by month/year/network
Export ke CSV / PDF
4.5 Pengaturan
Manajemen recurring expenses (tambah, edit, hapus)
Pilihan mata uang default (USD / IDR)
Kurs konversi USD → IDR (input manual atau auto via API)
5. Tech Stack
Layer	Teknologi
Frontend	Next.js 14 (App Router) + TypeScript
Styling	Tailwind CSS + shadcn/ui
Charts	Recharts
Backend	Next.js API Routes / Route Handlers
Database	PostgreSQL via Prisma ORM
Auth	NextAuth.js (credentials, single user)
Runtime	Node.js 20
6. Desain & UI
Tema: Dark modern — background #0a0a0a / #111827, accent warna hijau neon atau biru elektrik
Font: Inter atau Geist
Layout: Sidebar navigasi kiri + main content area
Cards: Glass morphism subtle, border transparan tipis
Charts: Dark-themed, warna accent per network
Halaman / Routes

/                → Dashboard (overview bulan ini)
/revenue         → List & input semua revenue entry
/expenses        → List & input semua pengeluaran
/reports         → Laporan bulanan, filter, export
/settings        → Recurring expenses, currency, kurs
/login           → Auth page
7. Data Model (High Level)

User
  - id, email, passwordHash

RevenueEntry
  - id, userId, network (CLICKADILLA|CLICKADU|ADSTERRA)
  - amount, currency, month, year, notes, createdAt

Expense
  - id, userId, type (OPERATIONAL|OTHER)
  - category, description, amount, currency, date, isRecurring

ExchangeRate
  - id, fromCurrency, toCurrency, rate, effectiveDate
8. Non-Functional Requirements
Load dashboard < 2 detik
Responsive (desktop-first, tablet-friendly)
Data persisten di PostgreSQL lokal (Laragon) untuk dev
Auth wajib untuk semua route (redirect ke /login jika belum login)
9. Out of Scope (v1)
API otomatis fetch dari ad network
Mobile app
Multi-user / team
Notifikasi / alert otomatis
Integrasi payment gateway
10. Milestone
Fase	Scope	Estimasi
M1	Auth + layout + dashboard skeleton	1–2 hari
M2	Revenue input + CRUD	1 hari
M3	Expense management	1 hari
M4	Charts + laporan bulanan	1–2 hari
M5	Export CSV/PDF + currency	1 hari
PRD selesai. Mau langsung mulai build dari M1 (setup project, auth, layout)? Atau ada yang mau diubah dulu di PRD-nya?

bre ada tambahan gua mau datanya bisa di pisah perdomain untuk penghasilannya, dan ada penghasilan globalnya juga bre dari seluruh domain. script harus aman dari bug dan anti injeksi sql dll ya bre jangan sampe mudah di retas soalnya ini data penting buat gua. 

bikinin ulang prdnya dong bre
PRD — MyAds Revenue Tracker v2
1. Overview
Nama Produk: MyAds Revenue Tracker
Platform: Web App (Fullstack JavaScript)
Tujuan: Dashboard pribadi untuk melacak pendapatan iklan dari multiple ad network per domain website, dengan view global lintas semua domain, dikurangi biaya operasional, sehingga bisa melihat net profit bulanan secara akurat dan aman.

2. Target User
Single user (owner). Tidak ada registrasi publik, tidak ada multi-tenant.

3. Ad Networks yang Didukung
Network	Mekanisme Input
Clickadilla	Manual input / CSV import
Clickadu	Manual input / CSV import
Adsterra	Manual input / CSV import
4. Konsep Domain
Setiap entri revenue diikat ke domain (website milik kamu). Contoh: example.com, news-site.net, dll.

Bisa tambah domain baru kapan saja via Settings
Setiap domain punya dashboard sendiri
Ada view Global yang aggregasi semua domain
Pengeluaran (hosting, domain fee) bisa diikat ke domain spesifik atau ditandai sebagai pengeluaran global
5. Fitur Utama
5.1 Dashboard Global
Total gross revenue semua domain + semua network bulan ini
Net profit global (gross - semua pengeluaran)
Revenue breakdown per domain (bar chart perbandingan antar domain)
Revenue breakdown per ad network (pie/bar chart)
Trend chart 6–12 bulan (bisa filter per domain atau global)
Profit margin % global
5.2 Dashboard Per Domain
Gross revenue domain tersebut bulan ini
Net profit domain (gross - pengeluaran yang diikat ke domain ini)
Breakdown per network untuk domain ini
Trend chart domain
5.3 Manajemen Domain
CRUD domain: tambah, edit (nama/URL), arsipkan
Setiap domain punya slug/ID unik
Domain yang diarsipkan masih muncul di histori tapi tidak di dropdown aktif
5.4 Input Revenue
Form tambah revenue: pilih domain → pilih network → isi amount → bulan/tahun → notes
Import CSV (kolom: domain, network, amount, currency, month, year)
Edit & hapus entri
Validasi ketat di frontend dan backend
5.5 Manajemen Pengeluaran
Biaya Operasional (recurring, per domain atau global):

Hosting → ikat ke domain tertentu
Domain fee → ikat ke domain tertentu
API Translate, SaaS → bisa global atau per domain
Pengeluaran Lain-lain (non-recurring):

Field: tanggal, kategori, deskripsi, nominal, scope (domain tertentu / global)
5.6 Laporan Bulanan
View: Global | Per Domain
Tabel: Revenue, Total Biaya, Net Profit per bulan
Filter: bulan, tahun, network, domain
Export CSV dan PDF
5.7 Pengaturan
Manajemen domain
Manajemen recurring expenses
Mata uang default (USD / IDR)
Kurs USD → IDR (manual atau via open API)
6. Tech Stack
Layer	Teknologi
Frontend	Next.js 14 (App Router) + TypeScript
Styling	Tailwind CSS + shadcn/ui
Charts	Recharts
Backend	Next.js API Route Handlers
Database	PostgreSQL via Prisma ORM (parameterized queries, zero raw SQL)
Auth	NextAuth.js — credentials, session JWT httpOnly cookie
Runtime	Node.js 20
Validation	Zod — semua input divalidasi server-side sebelum menyentuh DB
7. Desain & UI
Tema: Dark modern — #0a0a0a base, accent hijau neon atau biru elektrik
Font: Inter / Geist
Layout: Sidebar kiri + topbar domain switcher + main content
Cards: Glass morphism, border transparan tipis
Charts: Dark-themed, warna unik per domain & per network
Halaman / Routes

/                    → Dashboard Global
/domain/[slug]       → Dashboard per Domain
/revenue             → List semua revenue (filterable)
/revenue/new         → Form tambah revenue
/expenses            → List semua pengeluaran
/expenses/new        → Form tambah pengeluaran
/reports             → Laporan bulanan (global + per domain)
/settings/domains    → CRUD domain
/settings/expenses   → Recurring expenses
/settings/general    → Currency, kurs
/login               → Auth
8. Data Model

User
  - id, email, passwordHash (bcrypt), createdAt

Domain
  - id, userId, name, url (slug), isArchived, createdAt

RevenueEntry
  - id, userId, domainId (FK → Domain)
  - network  : enum(CLICKADILLA, CLICKADU, ADSTERRA)
  - amount   : Decimal
  - currency : enum(USD, IDR)
  - month    : Int (1–12)
  - year     : Int
  - notes    : String?
  - createdAt, updatedAt

Expense
  - id, userId
  - domainId  : Int? (null = global)
  - type      : enum(OPERATIONAL, OTHER)
  - category  : String
  - description : String
  - amount    : Decimal
  - currency  : enum(USD, IDR)
  - date      : Date
  - isRecurring : Boolean
  - createdAt, updatedAt

ExchangeRate
  - id, fromCurrency, toCurrency, rate, effectiveDate
9. Keamanan (Security Requirements)
9.1 Injection Prevention
Zero raw SQL — semua query via Prisma ORM (parameterized by default)
Semua input divalidasi dengan Zod schema di layer API sebelum masuk ke Prisma
Whitelist enum untuk field network, currency, type — tidak bisa diisi sembarangan
9.2 Authentication & Authorization
Password di-hash dengan bcrypt (cost factor ≥ 12)
Session menggunakan JWT httpOnly cookie — tidak accessible via JavaScript
Setiap API route wajib verifikasi session sebelum eksekusi
Rate limiting di endpoint /login — max 5 attempt / 15 menit (via upstash/ratelimit atau middleware manual)
CSRF protection aktif (NextAuth sudah include by default)
9.3 Authorization Check
Setiap query ke DB selalu include WHERE userId = session.userId — user hanya bisa akses data miliknya sendiri
Domain ownership diverifikasi sebelum setiap operasi revenue/expense
9.4 Input Sanitization
Semua string field di-trim dan dibatasi panjangnya di schema Zod
Amount hanya menerima angka positif, bukan ekspresi atau string
File CSV import: validasi tiap baris sebelum insert, tolak seluruh batch jika ada baris invalid
9.5 HTTP Security Headers
Content-Security-Policy — blokir inline script luar
X-Frame-Options: DENY — cegah clickjacking
X-Content-Type-Options: nosniff
Strict-Transport-Security (HSTS) saat deploy ke HTTPS
9.6 Environment & Secrets
Semua secrets di .env — tidak boleh ada hardcoded credential
.env masuk .gitignore
Database tidak exposed ke public — hanya diakses via server-side Prisma
9.7 Dependency Security
Gunakan npm audit sebelum setiap deploy
Tidak ada package deprecated atau unmaintained sebagai dependency kritis
10. Non-Functional Requirements
Dashboard load < 2 detik (data ter-cache per request)
Responsive: desktop-first, tablet-friendly
Semua API return error message generic ke client (tidak expose stack trace atau query detail)
Logging error server-side only
11. Out of Scope (v1)
Auto-fetch API dari ad network
Mobile app native
Multi-user / team
Notifikasi / email alert
Integrasi payment / withdrawal tracking
12. Milestone
Fase	Scope
M1	Setup project, DB schema, Auth (login + session + rate limit)
M2	CRUD Domain + layout sidebar + domain switcher
M3	Revenue input + CRUD + CSV import
M4	Expense management (per domain + global)
M5	Dashboard Global + Dashboard per Domain + Charts
M6	Laporan bulanan + Export CSV/PDF
M7	Security hardening (headers, audit, review) + Settings
