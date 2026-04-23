# NIS Maktab CRM Tizimi — Texnik Topshiriq (TZ)

**Loyiha nomi:** NIS School CRM (Nordic International School, Toshkent)
**Versiya:** 1.0 — MVP
**Texnologiya stacki:** Node.js, NestJS, PostgreSQL, Redis, RabbitMQ, Telegraf, Docker, Nginx/Caddy
**Sana:** 2026
**Status:** Ishlab chiqishga tayyor

---

## 1. LOYIHA HAQIDA UMUMIY MA'LUMOT

### 1.1 Maqsad
NIS maktabining kundalik boshqaruvini avtomatlashtirish — o'quvchilar, sinflar, o'qituvchilarni yagona platformada boshqarish. Admin va Managerlarga to'liq nazorat, o'qituvchilarga o'z akkauntlari orqali ishlash imkoniyatini berish.

### 1.2 MVP maqsadi
Eng kichik ishlaydigan versiya (**MVP**) ni 4-6 hafta ichida ishga tushirish. MVP keyin bosqichma-bosqich kengaytiriladi.

### 1.3 Masshtab
- O'quvchilar soni: ~500
- Sinflar: 1-11 (har sinfda 2-3 parallel)
- O'qituvchilar: ~50
- Bir vaqtda aktiv foydalanuvchilar: ~80-100
- Ma'lumotlar hajmi (1 yilda): ~5-10 GB

---

## 2. MVP KO'LAMI (SCOPE)

### 2.1 MVP ichiga kiradi (IN SCOPE) ✅

| # | Modul | Tavsif |
|---|-------|--------|
| 1 | **Autentifikatsiya** | JWT + Refresh token, 3 rol (Admin, Manager, Teacher) |
| 2 | **Foydalanuvchi boshqaruvi** | Admin va Manager foydalanuvchilarni yarata oladi |
| 3 | **O'quvchilar CRUD** | Qo'shish, tahrirlash, o'chirish, ro'yxat |
| 4 | **Sinflar CRUD** | Sinflar yaratish, o'quvchilarni biriktirish |
| 5 | **O'qituvchilar boshqaruvi** | Profil, sinfga biriktirish |
| 6 | **Telegram bot** | Notifikatsiya (parolni qayta tiklash, ogohlantirish) |
| 7 | **Audit log** | Kim nima qilgan (Admin ko'radi) |
| 8 | **Dashboard** | Asosiy statistika (o'quvchilar soni, faol sinflar) |

### 2.2 MVP'dan tashqari (PHASE 2+) ❌

- ❌ Davomat tizimi (attendance)
- ❌ Baholash (grades/GPA)
- ❌ To'lovlar (UzCard/Humo)
- ❌ Dars jadvali
- ❌ Ota-ona mobil app
- ❌ "Kedi" moduli (terapiya hayvonlari)
- ❌ AI tahlil, hisobotlar

> **Eslatma:** MVP muvaffaqiyatli ishga tushgandan keyin Phase 2 da davomat → baho → to'lov tartibida qo'shiladi.

---

## 3. FOYDALANUVCHI ROLLARI

### 3.1 Rollar iyerarxiyasi

```
SUPER_ADMIN (1 ta, IT admin)
    └── ADMIN (2-3 ta, maktab direksiyasi)
          └── MANAGER (3-5 ta, o'quv ishlari bo'yicha)
                └── TEACHER (~50 ta, o'qituvchilar)
```

### 3.2 Rollar va huquqlar matritsasi

| Amal | SUPER_ADMIN | ADMIN | MANAGER | TEACHER |
|------|:-----------:|:-----:|:-------:|:-------:|
| Tizim sozlamalari | ✅ | ❌ | ❌ | ❌ |
| Adminlarni yaratish | ✅ | ❌ | ❌ | ❌ |
| Managerlarni yaratish | ✅ | ✅ | ❌ | ❌ |
| O'qituvchilarni yaratish | ✅ | ✅ | ✅ | ❌ |
| O'quvchilarni qo'shish/o'chirish | ✅ | ✅ | ✅ | ❌ |
| Sinflarni yaratish | ✅ | ✅ | ✅ | ❌ |
| O'quvchilarni sinfga biriktirish | ✅ | ✅ | ✅ | ❌ |
| O'z profilini ko'rish | ✅ | ✅ | ✅ | ✅ |
| Sinfidagi o'quvchilarni ko'rish | ✅ | ✅ | ✅ | ✅ (faqat o'ziniki) |
| Audit logni ko'rish | ✅ | ✅ | ❌ | ❌ |
| Dashboardni ko'rish | ✅ | ✅ | ✅ | ✅ (cheklangan) |

---

## 4. FUNKSIONAL TALABLAR

### 4.1 Autentifikatsiya moduli

#### 4.1.1 Kirish (Login)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ email, password }`
- **Output:** `{ accessToken, refreshToken, user }`
- **Logika:**
  - Email + parol tekshirilsin (bcrypt)
  - 5 marta noto'g'ri urinishdan keyin 15 daqiqa bloklash (Redis)
  - Access token: 15 daqiqa, Refresh token: 7 kun
  - Login muvaffaqiyatli bo'lsa — audit logga yozish

#### 4.1.2 Refresh token
- **Endpoint:** `POST /auth/refresh`
- **Input:** `{ refreshToken }`
- **Output:** `{ accessToken, refreshToken }` (yangi juftlik)
- Eski refresh token bazadan o'chiriladi (token rotation)

#### 4.1.3 Chiqish (Logout)
- **Endpoint:** `POST /auth/logout`
- Refresh tokenni bazadan o'chirish
- Access tokenni Redis blacklist'ga qo'shish (TTL = token muddati)

#### 4.1.4 Parolni tiklash
- **Endpoint:** `POST /auth/forgot-password`
- Foydalanuvchi telegram orqali bog'langan bo'lsa — Telegram botdan tiklash kodi
- Bog'lanmagan bo'lsa — Admin'ga so'rov yuboradi

---

### 4.2 Foydalanuvchi boshqaruvi

#### 4.2.1 Foydalanuvchi yaratish
**Use Case:** Admin yangi Manager qo'shadi
- **Endpoint:** `POST /users` (faqat ADMIN va SUPER_ADMIN)
- **Input:**
  ```json
  {
    "email": "manager@nis.uz",
    "fullName": "Ali Valiyev",
    "phone": "+998901234567",
    "role": "MANAGER",
    "telegramUsername": "@alivaliyev"
  }
  ```
- **Logika:**
  - Random parol generatsiya (12 belgi)
  - Email/Telegram orqali parol yuborish
  - Birinchi kirishda parolni majburiy o'zgartirish

#### 4.2.2 Foydalanuvchilar ro'yxati
- **Endpoint:** `GET /users?role=TEACHER&page=1&limit=20&search=...`
- Filterlar: rol, status (active/inactive), qidiruv (ism/email)
- Pagination: 20 tadan

#### 4.2.3 Foydalanuvchini tahrirlash/o'chirish
- `PATCH /users/:id` — tahrirlash
- `DELETE /users/:id` — soft delete (deleted_at qo'yiladi)

---

### 4.3 O'quvchilar moduli

#### 4.3.1 O'quvchi qo'shish
**Use Case:** Manager yangi o'quvchi ro'yxatga oladi
- **Endpoint:** `POST /students`
- **Input:**
  ```json
  {
    "firstName": "Shaxzod",
    "lastName": "Karimov",
    "middleName": "Olimovich",
    "birthDate": "2015-03-15",
    "gender": "MALE",
    "gradeLevel": 4,
    "classId": null,
    "parentFullName": "Karimov Olim",
    "parentPhone": "+998901111111",
    "parentTelegram": "@karimov_olim",
    "address": "Toshkent sh., Chilonzor",
    "bloodGroup": "O+",
    "medicalNotes": "Sariq dalchin allergiyasi"
  }
  ```
- **Logika:**
  - Avtomatik `studentCode` generatsiya: `NIS-2026-00123`
  - Status: `ACTIVE`
  - Telegram orqali ota-onaga xabar yuborish (bog'lanmasa — shu yetarli)

#### 4.3.2 O'quvchini sinfga biriktirish
- **Endpoint:** `PATCH /students/:id/assign-class`
- **Input:** `{ classId: 15 }`
- **Logika:**
  - Sinf `gradeLevel` va o'quvchi `gradeLevel` mos kelishi shart
  - Sinfda joy bormi tekshirish (maksimum 30 o'quvchi)
  - Eski sinfdan avtomatik chiqarish
  - `student_class_history` jadvaliga yozish

#### 4.3.3 O'quvchini chiqarish
- **Endpoint:** `DELETE /students/:id`
- **Input:** `{ reason: "Oiladan ketdi", note: "..." }`
- Soft delete — status `INACTIVE`, `leftAt` qo'yiladi
- Audit logga majburiy yozish

#### 4.3.4 O'quvchilar ro'yxati va qidirish
- `GET /students?classId=15&status=ACTIVE&gradeLevel=4&search=Shaxzod`
- Export: CSV/Excel (faqat Admin uchun)

---

### 4.4 Sinflar moduli

#### 4.4.1 Sinf yaratish
- **Endpoint:** `POST /classes`
- **Input:**
  ```json
  {
    "name": "4-A",
    "gradeLevel": 4,
    "academicYear": "2025-2026",
    "classTeacherId": 12,
    "maxStudents": 30,
    "roomNumber": "201"
  }
  ```

#### 4.4.2 Sinf ma'lumotlari
- `GET /classes/:id` — sinf to'liq ma'lumot + o'quvchilar ro'yxati + class teacher

#### 4.4.3 O'qituvchini sinfga biriktirish
- **Endpoint:** `PATCH /classes/:id/assign-teacher`
- Bitta o'qituvchi faqat 1 ta sinfning "class teacher"i bo'la oladi (MVP)
- Boshqa fanlarda dars berishi mumkin (kelajakda)

---

### 4.5 O'qituvchilar moduli

#### 4.5.1 O'qituvchi yaratish
- Bu aslida foydalanuvchi yaratish (role=TEACHER) + qo'shimcha profil ma'lumot
- **Endpoint:** `POST /teachers`
- **Input:**
  ```json
  {
    "email": "teacher@nis.uz",
    "fullName": "Dilnoza Ahmedova",
    "phone": "+998901234567",
    "subject": "Matematika",
    "experienceYears": 5,
    "education": "TDPU",
    "telegramUsername": "@dilnoza_teach"
  }
  ```

#### 4.5.2 O'qituvchi paneli (teacher dashboard)
Teacher o'z akkauntiga kirganda ko'radi:
- O'zining sinfi (agar class teacher bo'lsa)
- Sinfidagi o'quvchilar ro'yxati (faqat ko'rish)
- O'z profili (tahrirlash — cheklangan maydonlar)

---

### 4.6 Telegram bot

#### 4.6.1 Asosiy funksiyalar (MVP)
- `/start` — botni ishga tushirish, tizim bilan bog'lash kodi olish
- `/link CODE` — Telegram akkauntni tizimga bog'lash
- `/me` — o'z ma'lumotlarini ko'rish
- `/help` — yordam

#### 4.6.2 Notifikatsiyalar (outbound)
Bot quyidagi xabarlarni yuboradi:
- Yangi foydalanuvchiga parol yuborish
- Yangi o'quvchi qo'shilganda ota-onaga (ixtiyoriy, keyinroq)
- Tizimda muhim hodisalar (failed login attempts — Admin'ga)
- Kunlik stats (Admin va Managerlarga ertalab 08:00 da)

#### 4.6.3 Arxitektura
- RabbitMQ queue: `notifications.telegram`
- Ishlab chiqaruvchi (producer): har qanday servis
- Iste'molchi (consumer): `TelegramNotificationConsumer`
- Retry: 3 marta, exponential backoff
- Dead letter queue: muvaffaqiyatsiz xabarlar

---

### 4.7 Audit log

Tizimdagi har bir muhim harakat yozib boriladi:
- Kim (userId, role)
- Nima qildi (action: CREATE/UPDATE/DELETE)
- Qaysi resursga (entity: STUDENT/CLASS/USER)
- Qachon (timestamp)
- IP manzil
- Eski va yangi qiymat (for UPDATE)

**Endpoint:** `GET /audit-logs?userId=...&action=DELETE&from=...&to=...`
**Foydalanuvchilar:** Faqat ADMIN va SUPER_ADMIN

---

### 4.8 Dashboard

Role'ga qarab turli xil statistika:

**ADMIN/MANAGER dashboardi:**
- O'quvchilar umumiy soni (jami, aktiv, sinfga biriktirilmaganlar)
- Sinflar soni va to'ldirilganligi
- O'qituvchilar soni
- So'nggi 10 ta audit log
- Oxirgi 7 kun ichida qo'shilgan o'quvchilar grafigi

**TEACHER dashboardi:**
- O'z sinfidagi o'quvchilar soni
- O'z profili ma'lumotlari

---

## 5. TEXNIK ARXITEKTURA

### 5.1 Umumiy sxema

```
                    ┌───────────────────────┐
                    │   Foydalanuvchilar     │
                    │  (Web/Mobile/Telegram) │
                    └───────────┬───────────┘
                                │ HTTPS
                    ┌───────────▼───────────┐
                    │   Caddy / Nginx        │
                    │   (Reverse Proxy,      │
                    │    SSL, Rate Limit)    │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼───────┐ ┌───────▼──────┐ ┌───────▼────────┐
    │  NestJS API     │ │  Telegraf    │ │   Worker       │
    │  (REST)         │ │  Bot         │ │   (RabbitMQ    │
    │  (3001)         │ │  (3002)      │ │   consumers)   │
    └─────────┬───────┘ └───────┬──────┘ └───────┬────────┘
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼────┐            ┌─────▼─────┐           ┌────▼─────┐
   │ PostgreSQL │         │   Redis   │           │ RabbitMQ │
   │  (main DB) │         │  (cache,  │           │ (queue)  │
   │            │         │  session) │           │          │
   └────────────┘         └───────────┘           └──────────┘
```

### 5.2 Servislar

| Servis | Port | Mas'uliyat |
|--------|------|------------|
| `nis-api` | 3001 | Asosiy REST API (NestJS) |
| `nis-bot` | 3002 | Telegraf bot (notifications) |
| `nis-worker` | — | RabbitMQ consumer'lar |
| `postgres` | 5432 | Asosiy ma'lumotlar bazasi |
| `redis` | 6379 | Cache, rate limiting, sessions |
| `rabbitmq` | 5672, 15672 | Message queue |
| `caddy` | 80, 443 | Reverse proxy + SSL |

### 5.3 NestJS modullar tarkibi

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── guards/           # JwtAuthGuard, RolesGuard
│   ├── decorators/       # @Roles(), @CurrentUser()
│   ├── interceptors/     # LoggingInterceptor, AuditInterceptor
│   ├── filters/          # HttpExceptionFilter
│   ├── pipes/            # ValidationPipe
│   └── dto/              # Pagination, BaseDto
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── rabbitmq.config.ts
│   └── telegram.config.ts
├── modules/
│   ├── auth/             # Login, Logout, Refresh
│   ├── users/            # User CRUD, roles
│   ├── students/         # Student CRUD, class assignment
│   ├── classes/          # Class management
│   ├── teachers/         # Teacher profile
│   ├── telegram/         # Bot + notification service
│   ├── audit/            # Audit logging
│   └── dashboard/        # Statistics
├── database/
│   ├── migrations/       # TypeORM migrations
│   └── seeds/            # Initial data (super admin, roles)
└── workers/
    └── notification.worker.ts
```

### 5.4 Loyihada ishlatiladigan asosiy paketlar

```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/common": "^10.x",
  "@nestjs/typeorm": "^10.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "@nestjs/config": "^3.x",
  "@nestjs/schedule": "^4.x",
  "@nestjs/microservices": "^10.x",
  "@nestjs/throttler": "^5.x",
  "@nestjs/swagger": "^7.x",
  "typeorm": "^0.3.x",
  "pg": "^8.x",
  "redis": "^4.x",
  "ioredis": "^5.x",
  "amqplib": "^0.10.x",
  "telegraf": "^4.x",
  "nestjs-telegraf": "^2.x",
  "bcrypt": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "passport-jwt": "^4.x",
  "helmet": "^7.x"
}
```

---

## 6. MA'LUMOTLAR BAZASI SXEMASI

### 6.1 Asosiy jadvallar

```sql
-- Foydalanuvchilar (Admin, Manager, Teacher)
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','MANAGER','TEACHER')),
    telegram_chat_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);

-- O'qituvchi profili (qo'shimcha ma'lumot)
CREATE TABLE teacher_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    subject         VARCHAR(100),
    experience_years INT DEFAULT 0,
    education       VARCHAR(500),
    bio             TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Sinflar
CREATE TABLE classes (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(20) NOT NULL, -- "4-A", "11-B"
    grade_level     INT NOT NULL CHECK (grade_level BETWEEN 1 AND 11),
    academic_year   VARCHAR(10) NOT NULL, -- "2025-2026"
    class_teacher_id BIGINT REFERENCES users(id),
    max_students    INT DEFAULT 30,
    room_number     VARCHAR(20),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, academic_year)
);

CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_teacher ON classes(class_teacher_id);

-- O'quvchilar
CREATE TABLE students (
    id              BIGSERIAL PRIMARY KEY,
    student_code    VARCHAR(20) UNIQUE NOT NULL, -- NIS-2026-00001
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100),
    birth_date      DATE NOT NULL,
    gender          VARCHAR(10) CHECK (gender IN ('MALE','FEMALE')),
    grade_level     INT NOT NULL CHECK (grade_level BETWEEN 1 AND 11),
    class_id        BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','GRADUATED')),
    
    -- Ota-ona ma'lumotlari
    parent_full_name VARCHAR(200),
    parent_phone    VARCHAR(20),
    parent_telegram VARCHAR(100),
    
    -- Qo'shimcha
    address         TEXT,
    blood_group     VARCHAR(5),
    medical_notes   TEXT,
    
    enrolled_at     TIMESTAMP DEFAULT NOW(),
    left_at         TIMESTAMP,
    left_reason     VARCHAR(500),
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_students_class ON students(class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_grade ON students(grade_level);
CREATE INDEX idx_students_code ON students(student_code);

-- O'quvchi sinf tarixi (qaysi sinfda o'qigan)
CREATE TABLE student_class_history (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT REFERENCES students(id) ON DELETE CASCADE,
    class_id        BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP DEFAULT NOW(),
    removed_at      TIMESTAMP,
    assigned_by     BIGINT REFERENCES users(id),
    reason          VARCHAR(255)
);

CREATE INDEX idx_sch_student ON student_class_history(student_id);

-- Refresh tokenlar
CREATE TABLE refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN DEFAULT false,
    user_agent      VARCHAR(500),
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token_hash);

-- Audit log
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    action          VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN
    entity_type     VARCHAR(50), -- STUDENT, CLASS, USER
    entity_id       BIGINT,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### 6.2 Munosabatlar (Relationships)

- `users` 1 ↔ 1 `teacher_profiles` (agar role=TEACHER)
- `users` 1 ↔ N `classes` (class_teacher_id)
- `classes` 1 ↔ N `students`
- `students` 1 ↔ N `student_class_history`
- `users` 1 ↔ N `refresh_tokens`
- `users` 1 ↔ N `audit_logs`

---

## 7. API ENDPOINTLAR (asosiy)

### 7.1 Auth
```
POST   /auth/login                  { email, password }
POST   /auth/refresh                { refreshToken }
POST   /auth/logout                 (authenticated)
POST   /auth/forgot-password        { email }
POST   /auth/change-password        { oldPassword, newPassword }
GET    /auth/me                     (authenticated)
```

### 7.2 Users (Admin, Manager)
```
GET    /users                       ?role=&search=&page=&limit=
POST   /users                       { email, fullName, role, phone }
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
POST   /users/:id/reset-password
```

### 7.3 Students
```
GET    /students                    ?classId=&status=&gradeLevel=&search=
POST   /students                    (Admin, Manager)
GET    /students/:id
PATCH  /students/:id                (Admin, Manager)
DELETE /students/:id                { reason } (Admin, Manager)
PATCH  /students/:id/assign-class   { classId }
GET    /students/:id/class-history
GET    /students/export             (Admin only, CSV/Excel)
```

### 7.4 Classes
```
GET    /classes                     ?academicYear=&gradeLevel=
POST   /classes                     (Admin, Manager)
GET    /classes/:id                 (includes students list)
PATCH  /classes/:id
DELETE /classes/:id
PATCH  /classes/:id/assign-teacher  { teacherId }
GET    /classes/:id/students
```

### 7.5 Teachers
```
GET    /teachers                    ?subject=&search=
POST   /teachers                    (Admin, Manager)
GET    /teachers/:id
PATCH  /teachers/:id
GET    /teachers/me/class           (Teacher own class)
GET    /teachers/me/students        (Teacher own students)
```

### 7.6 Dashboard
```
GET    /dashboard/stats             (role-based data)
GET    /dashboard/recent-activity   (Admin, Manager)
```

### 7.7 Audit
```
GET    /audit-logs                  ?userId=&action=&from=&to=
```

### 7.8 Swagger dokumentatsiya
- `/api/docs` — Swagger UI (faqat development va staging)

---

## 8. USE CASE'LAR (batafsil)

### UC-01: Manager yangi o'quvchi qo'shadi va sinfga biriktiradi

**Aktor:** Manager
**Oldindan shart:** Manager tizimga kirgan, sinf mavjud

**Oqim:**
1. Manager "O'quvchilar" bo'limiga kiradi
2. "Yangi o'quvchi" tugmasini bosadi
3. Formani to'ldiradi (F.I.O, DT, gradeLevel=4, ota-ona ma'lumotlari)
4. "Saqlash" bosadi
5. Tizim `student_code` generatsiya qiladi (NIS-2026-00124)
6. O'quvchi bazaga qo'shiladi (status=ACTIVE, classId=null)
7. Manager "Sinfga biriktirish" tugmasini bosadi
8. "4-A" sinfini tanlaydi
9. Tizim tekshiradi: sinf gradeLevel=4 mos, 28/30 joy bor
10. O'quvchi sinfga biriktiriladi, `student_class_history` ga yozuv qo'shiladi
11. Audit logga yoziladi
12. Agar ota-ona telegram bog'langan bo'lsa — xabar yuboriladi

**Alternativ oqim:**
- 9a. Sinfda joy yo'q → xatolik "Sinf to'la (30/30)"
- 9b. gradeLevel mos kelmadi → "O'quvchi 4-sinf, tanlangan sinf 5-sinf"

---

### UC-02: Admin yangi Manager yaratadi

**Aktor:** Admin
**Oldindan shart:** Admin tizimga kirgan

**Oqim:**
1. Admin "Foydalanuvchilar" bo'limiga kiradi
2. "Yangi foydalanuvchi" tugmasini bosadi
3. Forma: email, F.I.O, telefon, role=MANAGER, telegram username
4. "Saqlash" bosadi
5. Tizim random 12 belgili parol generatsiya qiladi
6. `users` jadvaliga yoziladi (must_change_password=true)
7. RabbitMQ orqali `notifications.telegram` ga xabar yuboriladi
8. Telegram bot Manager'ga parolni yuboradi (agar telegram bog'langan bo'lsa)
9. Agar telegram yo'q — email/SMS orqali parol yuboriladi
10. Manager birinchi marta kirganda parolni o'zgartirishi shart

---

### UC-03: O'qituvchi o'z sinfini ko'radi

**Aktor:** Teacher
**Oldindan shart:** Teacher tizimga kirgan, class teacher sifatida biriktirilgan

**Oqim:**
1. Teacher login qiladi
2. Dashboardda o'z sinfini ko'radi ("4-A, 28 o'quvchi")
3. Sinf nomini bosadi
4. O'quvchilar ro'yxatini ko'radi (faqat ko'rish, tahrirlay olmaydi)
5. O'quvchi ustiga bosib, asosiy ma'lumotlarini ko'radi (medical notes, parent contact)

**Cheklovlar:**
- Teacher boshqa sinfga kira olmaydi
- O'quvchini o'chira olmaydi, tahrirlay olmaydi
- Faqat `GET /teachers/me/students` endpoint'idan foydalanadi

---

### UC-04: O'quvchini sinfdan chiqarish va arxivlash

**Aktor:** Manager/Admin
**Sabab:** O'quvchi boshqa maktabga o'tdi

**Oqim:**
1. Manager o'quvchi profiliga kiradi
2. "O'quvchini chiqarish" tugmasini bosadi
3. Sabab va izohni kiritadi
4. Tasdiqlaydi
5. Tizim:
   - `students.status = 'INACTIVE'`
   - `students.left_at = NOW()`
   - `students.left_reason = 'Boshqa maktabga o'tdi'`
   - `students.class_id = NULL`
   - `student_class_history` ga `removed_at` qo'yiladi
6. Audit logga yoziladi
7. Sinfda 1 ta joy ochiladi

**Muhim:** O'quvchi ma'lumotlari o'chirilmaydi, faqat arxivlanadi (soft delete).

---

### UC-05: Parolni unutgan foydalanuvchi

**Aktor:** Teacher/Manager
**Oldindan shart:** Telegram bog'langan

**Oqim:**
1. Foydalanuvchi "Parolni unutdim" tugmasini bosadi
2. Email kiritadi
3. Tizim user'ni topadi va telegram_chat_id borligini tekshiradi
4. Telegram botga 6 xonali kod yuboriladi (Redis'da 10 daqiqa saqlanadi)
5. Foydalanuvchi kodni kiritadi
6. Yangi parol belgilaydi
7. Barcha refresh tokenlari bekor qilinadi (xavfsizlik)
8. Audit logga yoziladi

---

## 9. ISHLAB CHIQISH BOSQICHLARI (6 HAFTA MVP)

### Hafta 1: Infrastructure va Setup
- [x] Docker compose yozish (postgres, redis, rabbitmq)
- [x] NestJS loyiha strukturasini yaratish
- [x] Database connection, TypeORM sozlash
- [x] Redis, RabbitMQ klientlari
- [x] Caddy/Nginx konfiguratsiyasi (local)
- [x] Swagger, ValidationPipe, Exception filters
- [x] CI/CD (GitLab/GitHub Actions) asosiy setup

### Hafta 2: Auth + Users
- [x] User entity va migration
- [x] JWT strategy, refresh token logic
- [x] Login, logout, refresh endpointlar
- [x] Role-based guards (@Roles decorator)
- [x] User CRUD (Admin tomonidan)
- [x] Password change, reset flow
- [x] Seed: super admin yaratish
- [x] Unit testlar (auth service)

### Hafta 3: Students + Classes
- [x] Student entity, migration
- [x] Class entity, migration
- [x] Student CRUD
- [x] Class CRUD
- [x] Student → Class assignment
- [x] Student class history
- [x] Validation (gradeLevel mos kelishi, joy mavjudligi)
- [x] Pagination, filter, search
- [x] Testlar

### Hafta 4: Teachers + Dashboard + Audit
- [x] Teacher profile entity
- [x] Teacher own class/students endpointlar
- [x] Dashboard stats (role-based)
- [x] Audit log interceptor
- [x] Audit log view (Admin uchun)
- [x] Soft delete implementation
- [x] Export (CSV)

### Hafta 5: Telegram Bot + Notifications
- [x] Telegraf bot setup
- [x] /start, /link, /me komandalari
- [x] Telegram chat_id ni userga bog'lash
- [x] RabbitMQ producer (notification service)
- [x] RabbitMQ consumer (bot)
- [x] Dead letter queue, retry logic
- [x] Scheduled notifications (daily stats)

### Hafta 6: Testing + Deploy + Documentation
- [x] E2E testlar (Jest + Supertest)
- [x] Load test (Artillery)
- [x] Production docker-compose
- [x] Caddy production config (SSL)
- [x] Environment variables, secrets management
- [x] Monitoring (Pino logs, healthcheck endpoint)
- [x] Backup strategiyasi (pg_dump cron)
- [x] User manualni yozish (Admin uchun)
- [x] Deployment va smoke testing
- [x] Foydalanuvchilarni o'qitish

---

## 10. DEPLOYMENT VA DEVOPS

### 10.1 Docker Compose (production)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: nis-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: nis_crm
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - nis-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: nis-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - nis-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: nis-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - nis-network

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nis-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/nis_crm
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_started
    networks:
      - nis-network

  bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    container_name: nis-bot
    restart: unless-stopped
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - rabbitmq
      - redis
    networks:
      - nis-network

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: nis-worker
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/nis_crm
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - rabbitmq
    networks:
      - nis-network

  caddy:
    image: caddy:2-alpine
    container_name: nis-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api
    networks:
      - nis-network

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  caddy_data:
  caddy_config:

networks:
  nis-network:
    driver: bridge
```

### 10.2 Caddyfile (SSL + Reverse Proxy)

```
crm.nis.uz {
    encode gzip
    
    # Rate limiting
    @api path /api/*
    rate_limit @api 100r/m
    
    # Main API
    reverse_proxy /api/* api:3001
    
    # Telegram webhook
    reverse_proxy /telegram/webhook bot:3002
    
    # Static files (React frontend — kelajakda)
    root * /srv/frontend
    try_files {path} /index.html
    file_server
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

### 10.3 Environment Variables

```bash
# .env.example
NODE_ENV=production
PORT=3001

# Database
DB_USER=nis_admin
DB_PASSWORD=<strong_password>
DATABASE_URL=postgres://nis_admin:***@postgres:5432/nis_crm

# Redis
REDIS_PASSWORD=<strong_password>
REDIS_URL=redis://:***@redis:6379

# RabbitMQ
RABBITMQ_USER=nis_mq
RABBITMQ_PASSWORD=<strong_password>
RABBITMQ_URL=amqp://nis_mq:***@rabbitmq:5672

# JWT
JWT_SECRET=<random_64_chars>
JWT_REFRESH_SECRET=<random_64_chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Telegram
TELEGRAM_BOT_TOKEN=<from_botfather>
TELEGRAM_WEBHOOK_URL=https://crm.nis.uz/telegram/webhook

# App
APP_URL=https://crm.nis.uz
FRONTEND_URL=https://crm.nis.uz
```

### 10.4 Backup strategiyasi

**Kunlik backup (har kuni soat 02:00):**
```bash
# backup.sh (cron orqali)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nis-postgres pg_dump -U nis_admin nis_crm | gzip > /backups/nis_crm_$DATE.sql.gz

# 30 kundan eski backuplarni o'chirish
find /backups -name "*.sql.gz" -mtime +30 -delete

# S3'ga yuklash (ixtiyoriy)
aws s3 cp /backups/nis_crm_$DATE.sql.gz s3://nis-backups/
```

---

## 11. XAVFSIZLIK

### 11.1 Asosiy chora-tadbirlar

| Soha | Yechim |
|------|--------|
| Parol saqlash | bcrypt (cost=12) |
| API autentifikatsiya | JWT (RS256 prod, HS256 dev) |
| Rate limiting | @nestjs/throttler + Caddy rate_limit |
| SQL injection | TypeORM parameterized queries |
| XSS | helmet, input validation (class-validator) |
| CORS | Cheklangan origin (faqat frontend URL) |
| HTTPS | Caddy avtomatik Let's Encrypt |
| Secrets | .env fayl, docker secrets (prod) |
| Brute force | Redis'da login attempts count |

### 11.2 Role-based access control (RBAC)

```typescript
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Foydalanish
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateStudentDto) { ... }
}
```

### 11.3 Sensitive ma'lumotlar

- `users.password_hash` — hech qachon API'da qaytarilmaydi (`@Exclude()`)
- `refresh_tokens.token_hash` — faqat hash, raw token emas
- Logs'da shaxsiy ma'lumotlar emas (faqat userId)

---

## 12. MONITORING VA LOGGING

### 12.1 Logging
- **Library:** `nestjs-pino` (JSON logs, tez)
- **Level:** `info` (prod), `debug` (dev)
- **Context:** request-id, user-id, ip

### 12.2 Health check
```
GET /health
  → { status: 'ok', db: 'ok', redis: 'ok', rabbitmq: 'ok' }
```

### 12.3 Metrics (Phase 2)
- Prometheus + Grafana
- API response time
- DB query time
- RabbitMQ queue size

---

## 13. QABUL QILISH MEZONLARI (Acceptance Criteria)

MVP tayyor deyiladi, agar:

- [ ] Barcha 3 rol (Admin, Manager, Teacher) to'g'ri ishlaydi
- [ ] Admin boshqa Manager va Teacher yarata oladi
- [ ] Manager o'quvchi qo'sha oladi, sinfga biriktira oladi
- [ ] Teacher o'z sinfini ko'ra oladi (boshqasini ko'ra olmaydi)
- [ ] Telegram bot parol yuborish va asosiy komandalar ishlaydi
- [ ] 500 o'quvchi, 50 sinf bilan sistem sekinlashmasdan ishlaydi
- [ ] Barcha endpoint'larda validation bor
- [ ] Audit log har bir muhim harakatni yozadi
- [ ] Deploy `docker-compose up` bilan ishlaydi
- [ ] SSL sertifikat avtomatik olinadi (Caddy)
- [ ] Kunlik backup ishlaydi
- [ ] Unit test coverage ≥ 60%, asosiy use case'lar E2E bilan qoplangan
- [ ] Swagger dokumentatsiya to'liq

---

## 14. KELAJAKDAGI KENGAYTIRISHLAR (Phase 2+)

Prioritet bo'yicha:

1. **Davomat moduli** — QR kod, real-time, WebSocket
2. **Baho moduli** — GPA, prognoz
3. **Ota-ona portali** — alohida rol, mobil app
4. **To'lovlar** — UzCard/Humo integratsiya
5. **Dars jadvali** — avtomatik jadval yaratish
6. **Hisobotlar** — PDF/Excel export, AI tahlil
7. **Mobile app** — Teachers va Parents uchun (React Native)
8. **"Kedi" moduli** — agar maktab buni talab qilsa

---

## 15. JAMOA VA RESURSLAR

### 15.1 Jamoa (tavsiya)
- **1 Backend developer** (NestJS) — to'liq stavka
- **1 Frontend developer** (React/Next.js) — Phase 1 yarmidan
- **1 DevOps** (yarim stavka) — deploy va monitoring
- **1 QA** — oxirgi 2 haftada

### 15.2 Taxminiy vaqt
- **MVP (Backend only):** 6 hafta
- **MVP + Frontend:** 10 hafta
- **Production ready:** 12 hafta

### 15.3 Server talablari (production)
- CPU: 4 vCPU
- RAM: 8 GB
- SSD: 100 GB
- OS: Ubuntu 22.04 LTS
- Traffic: ~10 GB/oy

---

## 16. HUJJATLAR VA TESTLAR

### 16.1 Topshirilishi shart
- [x] Texnik TZ (ushbu hujjat)
- [x] API dokumentatsiya (Swagger)
- [x] Database ER diagram
- [x] Admin uchun foydalanuvchi qo'llanmasi (PDF)
- [x] Deployment instruktsiyasi (README.md)
- [x] .env.example fayl

### 16.2 Testlar
- Unit testlar: `npm run test`
- E2E testlar: `npm run test:e2e`
- Coverage: `npm run test:cov`

---

## XULOSA

Ushbu TZ **MVP**ga fokuslangan va **6 haftada** ishga tushirilishi mumkin. Arxitektura Node.js/NestJS ekosistemiga to'liq mos keladi. Ma'lumotlar bazasi va API endpointlari qayta ishlab chiqishga (refactoring) kerak bo'lmasdan Phase 2 ga o'tish uchun tayyor.

**Muhim tamoyillar:**
1. **Kam, lekin sifatli:** MVP'da faqat zarur narsa
2. **Kengaytiriladigan:** Har bir modul alohida, microservice'ga o'tkazish oson
3. **Xavfsizlik birinchi:** JWT, RBAC, audit log — boshidanoq
4. **DevOps-friendly:** Docker Compose, Caddy — bir qadamda deploy

---

**Tuzuvchi:** _________________
**Sana:** 2026
**Versiya:** 1.0 (MVP)
