# NIS Maktab CRM Tizimi — Texnik Topshiriq (TZ)

**Loyiha nomi:** NIS School CRM (Nordic International School, Toshkent)
**Versiya:** 2.0 — O'quv jarayoni avtomatlashtirish
**Oldingi versiya:** 1.0 (Core MVP — production)
**Texnologiya stacki:** Node.js, NestJS, PostgreSQL, Redis, RabbitMQ, Docker, Caddy
**Telegram:** Telegraf + nestjs-telegraf + **Telegram Login Widget**
**Qo'shiladigan:** Socket.io (real-time), PDF generator (pdfmake/puppeteer)
**Sana:** 2026

---

## 1. LOYIHA HAQIDA

### 1.1 v2.0 maqsadi

v1.0 muvaffaqiyatli ishlaydi (o'quvchilar, sinflar, foydalanuvchilar). v2.0 maktabning kundalik **o'quv jarayonini** avtomatlashtiradi (davomat, baho, jadval) va **ota-onalar bilan aloqani** Telegram orqali to'liq tashkil etadi.

### 1.2 Asosiy g'oya: "Telegram-first"

NIS maktabi Toshkentda joylashgan va deyarli barcha ota-onalar Telegram'dan foydalanadi. Shuning uchun v2.0 da Telegram — **birlamchi aloqa kanali**:

- **Auth:** Telegram Login Widget (parol kerak emas, bir marta bosish)
- **Notify:** Faqat Telegram bot orqali (SMS yo'q)
- **Xabar almashish:** Bot inline keyboard orqali interactive
- **Hujjat yuborish:** PDF, hisobot — hammasi botdan fayl ko'rinishida

Bu yondashuv:
- Xarajatlarni keskin kamaytiradi (SMS gateway kerak emas)
- Foydalanuvchi tajribasini soddaroq qiladi (parolsiz kirish)
- Uzbekistan konteksti uchun optimal (Telegram keng tarqalgan)

### 1.3 Biznes muammolari

1. O'qituvchilar davomatni qog'oz jurnalga yozadi, keyin Excelga ko'chiradi (haftada 5 soat)
2. Ota-onalar bolasining bahosi va davomatini bir-ikki hafta kechikib biladi
3. Jadval o'zgarsa (o'qituvchi kasal) — xaos: telefon qo'ng'iroqlar, xato
4. Ota-onalarning maktab bilan aloqasi kuchsiz

### 1.4 Kutilayotgan natijalar

- Davomat qo'yish vaqti **5 soat → 30 daqiqa**
- Ota-onalar **real-time** xabardor (Telegram ping darhol)
- Jadval o'zgarishi 5 daqiqada barcha manfaatdorlarga yetadi
- Parolni unutish muammolari **yo'qoladi** (Telegram Login)

---

## 2. v2.0 KO'LAMI

### 2.1 IN SCOPE ✅

| # | Modul | Qisqa tavsif |
|---|-------|--------------|
| 1 | **Telegram Login Widget** | Parolsiz auth (Parent va Teacher uchun) |
| 2 | **Subjects** | Fanlar katalogi (Grades uchun asos) |
| 3 | **Attendance** | Real-time davomat, avto Telegram notify |
| 4 | **Grades** | Ball/GPA, past natijada ogohlantirish |
| 5 | **Schedule** | Haftalik jadval, substitution, xona band |
| 6 | **Parent Portal** | Ota-ona kabineti (Telegram Login bilan) |
| 7 | **Enhanced Bot** | Inline keyboard, fayl yuborish, interaktiv |
| 8 | **WebSocket** | Real-time dashboard va notify |
| 9 | **PDF hisobotlar** | Oylik, chorak, davomat jurnal |
| 10 | **Multi-language** | UZ, RU, EN (bot + portal) |

### 2.2 OUT OF SCOPE ❌

- ❌ **To'lovlar** (UzCard, Humo, Payme, Click) — alohida proyekt
- ❌ **SMS gateway** (Eskiz.uz, Playmobile) — Telegram kifoya
- ❌ Mobil native app (Phase 3)
- ❌ AI prognoz
- ❌ Kutubxona, oshxona, LMS
- ❌ Test/Exam qurish

---

## 3. ROLLAR

### 3.1 Ierarxiya

```
SUPER_ADMIN > ADMIN > MANAGER > TEACHER
                                PARENT  (alohida, cheklangan)
```

### 3.2 Yangilangan huquqlar matritsasi

| Amal | ADMIN | MANAGER | TEACHER | PARENT |
|------|:-----:|:-------:|:-------:|:------:|
| O'quvchi qo'shish/tahrirlash | ✅ | ✅ | ❌ | ❌ |
| Sinfga biriktirish | ✅ | ✅ | ❌ | ❌ |
| Davomat qo'yish | ✅ | ✅ | ✅ (o'z sinfi) | ❌ |
| Davomatni ko'rish | ✅ | ✅ | ✅ (o'z sinfi) | ✅ (farzandi) |
| Baho qo'yish | ✅ | ❌ | ✅ (o'z fani) | ❌ |
| Bahoni ko'rish | ✅ | ✅ | ✅ (o'z fani) | ✅ (farzandi) |
| Jadval tahrir | ✅ | ✅ | ❌ | ❌ |
| Jadvalni ko'rish | ✅ | ✅ | ✅ (o'zi) | ✅ (farzandi) |
| Substitution yaratish | ✅ | ✅ | ❌ | ❌ |
| Ota-onaga xabar (bot) | ✅ | ✅ | ✅ (o'z sinfi) | ❌ |

---

## 4. TELEGRAM LOGIN WIDGET — AUTH MODULI

### 4.1 Nima bu?

Telegram Login Widget — Telegram'ning rasmiy auth mexanizmi. Foydalanuvchi tugmani bosadi → Telegram oldindan kirgan akkauntidan ruxsat beradi → tizimga qaytadi.

**Afzalliklari:**
- Parol yo'q (eslab qolish / unutish muammosi yo'q)
- 2FA avtomatik (Telegram'ning o'zida bor)
- Bir klik (bosing → kirdi)
- Spam/bot himoyasi (Telegram akkaunt zarur)

**Rasmiy hujjat:** https://core.telegram.org/widgets/login

### 4.2 Ishlash jarayoni

```
┌─────────┐                ┌─────────────┐             ┌──────────┐
│  User   │                │  Portal     │             │ Telegram │
│ Browser │                │ (frontend)  │             │  Cloud   │
└────┬────┘                └──────┬──────┘             └────┬─────┘
     │                            │                         │
     │ 1. portal.nis.uz ga kiradi │                         │
     │───────────────────────────>│                         │
     │                            │                         │
     │ 2. "Login with Telegram"   │                         │
     │    tugmasi ko'rsatiladi    │                         │
     │<───────────────────────────│                         │
     │                            │                         │
     │ 3. Tugmani bosadi          │                         │
     │───────────────────────────>│                         │
     │                            │ 4. Telegram OAuth       │
     │                            │────────────────────────>│
     │                            │                         │
     │                            │    5. User ruxsat       │
     │                            │       beradi            │
     │                            │                         │
     │ 6. Redirect qilingan:                                 │
     │    id, first_name, last_name,                         │
     │    username, photo_url,                               │
     │    auth_date, hash                                    │
     │<─────────────────────────────────────────────────────│
     │                            │                         │
     │ 7. Backend'ga yuboradi     │                         │
     │    POST /auth/telegram     │                         │
     │───────────────────────────>│                         │
     │                            │                         │
     │                            │ 8. Hash verification    │
     │                            │    (bot_token bilan)    │
     │                            │                         │
     │                            │ 9. User topiladi/       │
     │                            │    yaratiladi           │
     │                            │                         │
     │ 10. JWT access + refresh   │                         │
     │<───────────────────────────│                         │
     │                            │                         │
     │ 11. Dashboard'ga o'tadi    │                         │
     │───────────────────────────>│                         │
```

### 4.3 Hash verification (backend)

Telegram qaytargan `hash` ni server tomonida tekshirish **majburiy** — aks holda har kim soxta ma'lumot yuborishi mumkin.

**Algoritm (rasmiy hujjatdan):**

```typescript
// src/modules/auth/services/telegram-auth.service.ts
import { createHmac, createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramAuthDto {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class TelegramAuthService {
  constructor(private config: ConfigService) {}

  verifyTelegramData(data: TelegramAuthDto): boolean {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    
    // 1. Hash ni ajratib olish
    const { hash, ...fields } = data;
    
    // 2. Data check string yaratish (alfabit tartibda, null qiymatlarsiz)
    const dataCheckString = Object.keys(fields)
      .filter(key => fields[key] !== undefined && fields[key] !== null)
      .sort()
      .map(key => `${key}=${fields[key]}`)
      .join('\n');
    
    // 3. Secret key = SHA256(bot_token)
    const secretKey = createHash('sha256')
      .update(botToken)
      .digest();
    
    // 4. Expected hash = HMAC-SHA256(dataCheckString, secretKey)
    const expectedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // 5. Constant-time comparison (timing attack himoyasi)
    return this.timingSafeEqual(expectedHash, hash);
  }

  async validateAuthData(data: TelegramAuthDto): Promise<TelegramAuthDto> {
    if (!this.verifyTelegramData(data)) {
      throw new UnauthorizedException('Invalid Telegram hash');
    }
    
    // auth_date 24 soatdan eski emasligini tekshirish (replay attack himoyasi)
    const authAge = Math.floor(Date.now() / 1000) - data.auth_date;
    if (authAge > 86400) {
      throw new UnauthorizedException('Telegram auth data expired');
    }
    
    return data;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}
```

### 4.4 Foydalanuvchini topish yoki bog'lash

**Scenariy 1: Mavjud user (Telegram avval bog'langan)**
- `users.telegram_chat_id = data.id` bo'yicha topadi
- JWT chiqaradi → dashboardga

**Scenariy 2: Yangi PARENT (invite orqali)**
- MANAGER oldindan invite yaratgan va URL'ni ota-onaga yuborgan
- URL: `portal.nis.uz/invite/TOKEN_ABC`
- Parent URL'ga kiradi → Telegram Login qiladi
- Backend: invite token + Telegram auth birlashadi → yangi user + `parent_students`

**Scenariy 3: Taniqsiz Telegram user**
- Hech qanday invite yo'q, bog'lanmagan
- Xato: "Hisobingiz topilmadi. Maktab administratori bilan bog'laning."

**Scenariy 4: ADMIN/MANAGER/TEACHER Telegram'ni bog'laydi**
- Oldin email+parol bilan tizimga kirgan
- "Sozlamalar" → "Telegram bog'lash" tugmasi
- Telegram Login Widget ko'rsatiladi
- Backend: `users.telegram_chat_id` yangilanadi
- Keyingi safar Telegram orqali ham kira oladi (parolsiz)

### 4.5 Endpoint'lar

```
POST /auth/telegram
  Body: { id, first_name, last_name, username, photo_url, auth_date, hash }
  → 200 { accessToken, refreshToken, user }
  → 401 Invalid hash / Expired auth
  → 404 User not found (no invite, not linked)

POST /auth/telegram/link
  (Authenticated user — email+password bilan kirgan)
  Body: { id, first_name, ..., hash }
  → 200 { linked: true, telegramId }
  → 409 This Telegram account is already linked to another user

POST /auth/parent/invite
  (ADMIN, MANAGER)
  Body: { studentId, parentName, relationship }
  → 201 { inviteToken, inviteUrl, expiresAt }

POST /auth/parent/accept-invite
  (public)
  Body: { inviteToken, telegramAuthData: { id, ..., hash } }
  → 200 { accessToken, refreshToken, user }
  → 400 Invite expired / already used
  → 401 Invalid Telegram hash
```

### 4.6 Invite link mexanizmi

Invite tokenlar `parent_invites` jadvalida saqlanadi:
- 7 kun amal qiladi
- Bir marta ishlatiladi (used_at to'ldiriladi)
- 32 belgili random string (crypto.randomBytes)

```sql
CREATE TABLE parent_invites (
    id              BIGSERIAL PRIMARY KEY,
    token           VARCHAR(64) UNIQUE NOT NULL,
    student_id      BIGINT REFERENCES students(id),
    parent_name     VARCHAR(200),
    relationship    VARCHAR(30), -- FATHER, MOTHER, GUARDIAN
    created_by      BIGINT REFERENCES users(id),
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP,
    used_by_user_id BIGINT REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invites_token ON parent_invites(token) WHERE used_at IS NULL;
```

### 4.7 Frontend integratsiya (Parent portal)

Invite sahifasi yoki oddiy login sahifasi:

```html
<!-- Telegram Login Widget — rasmiy script -->
<script async
  src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="nis_school_bot"
  data-size="large"
  data-radius="8"
  data-userpic="true"
  data-onauth="onTelegramAuth(user)"
  data-request-access="write">
</script>

<script>
  async function onTelegramAuth(user) {
    // URL'dan invite token'ni olish (agar bor bo'lsa)
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    
    const endpoint = inviteToken
      ? '/api/auth/parent/accept-invite'
      : '/api/auth/telegram';
    
    const body = inviteToken
      ? { inviteToken, telegramAuthData: user }
      : user;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const { accessToken, refreshToken } = await response.json();
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      showError(error.message);
    }
  }
</script>
```

### 4.8 Bot domain ro'yxatdan o'tkazish

Telegram Login Widget ishlashi uchun @BotFather'da bir martalik sozlash:

```
1. @BotFather ga yozing: /setdomain
2. Botni tanlang (masalan @nis_school_bot)
3. Domain yuboring: portal.nis.uz
4. Tasdiqlaydi
```

Endi faqat shu domendan kelgan auth so'rovlari qabul qilinadi.

### 4.9 Xavfsizlik eslatmalari

1. **`bot_token`** faqat serverda. Hech qachon frontend'ga chiqarilmaydi.
2. **HTTPS majburiy** — Telegram Login Widget HTTP'da ishlamaydi.
3. **Auth age** har doim tekshiriladi (24 soatdan eski bo'lsa rad etiladi).
4. **Hash timing-safe** taqqoslash (timing attack himoyasi).
5. **CSRF** — Telegram Login `SameSite=Lax` cookie bilan qo'lda ishlash kerak bo'lsa. JWT ishlatilgani uchun asosiy.
6. **Rate limit** `/auth/telegram` ga — daqiqada 10 urinish bitta IP'dan.

---

## 5. SUBJECTS MODULI

### 5.1 Maqsad

Grades va Schedule uchun asos bo'lgan fan katalogi.

### 5.2 Endpoint'lar

```
POST   /subjects                        (ADMIN, MANAGER)
GET    /subjects
GET    /subjects/:id
PATCH  /subjects/:id
DELETE /subjects/:id

POST   /classes/:id/subjects            Sinfga fan + o'qituvchi biriktirish
GET    /classes/:id/subjects            Sinfning fanlari
```

### 5.3 Biznes qoidalari

- Bitta fan bir nechta sinf darajasida bo'lishi mumkin (`grade_levels` array)
- Bitta o'qituvchi bir nechta fan olib borishi mumkin
- Bitta sinfda bitta fan bo'yicha faqat bitta o'qituvchi
- Fan o'chirilmaydi (soft delete) — grades tarixi saqlanadi

### 5.4 Database

```sql
CREATE TABLE subjects (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    grade_levels    INT[] NOT NULL, -- [1,2,3,...,11]
    default_hours_per_week INT DEFAULT 2,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE class_subjects (
    id              BIGSERIAL PRIMARY KEY,
    class_id        BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id      BIGINT REFERENCES subjects(id),
    teacher_id      BIGINT REFERENCES users(id),
    hours_per_week  INT DEFAULT 2,
    academic_year   VARCHAR(10) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, subject_id, academic_year)
);
```

---

## 6. ATTENDANCE MODULI

### 6.1 Davomat statuslari

| Status | Tavsif |
|--------|--------|
| `PRESENT` | Darsga keldi |
| `ABSENT` | Kelmadi (sababsiz) |
| `LATE` | Kechikdi (15 daqiqadan ortiq) |
| `EXCUSED` | Uzrli (hujjat bilan) |
| `SICK` | Kasallik sababli |

### 6.2 Foydalanuvchi oqimi (Teacher)

1. Teacher "Darslarim" bo'limida bugungi jadval
2. Hozirgi dars yonida "Davomat qo'yish" tugmasi
3. Bosadi → o'quvchilar ro'yxati (hammasi PRESENT'dan boshlaydi)
4. Yo'q o'quvchilarni belgilaydi
5. "Saqlash" → tranzaksiyada barcha yozuvlar kiradi
6. WebSocket event yuboriladi (dashboard)
7. 10 daqiqa delay bilan: ABSENT bo'lganlar ota-onasiga Telegram push

### 6.3 Endpoint'lar

```
POST   /attendance                      Bir darsning davomati
  Body: {
    classId, subjectId, scheduleEntryId,
    date, lessonNumber,
    records: [{ studentId, status, remarks? }]
  }
  
GET    /attendance                      ?classId=&studentId=&from=&to=
GET    /attendance/class/:classId/today
GET    /attendance/summary/:studentId   ?month=&year=
PATCH  /attendance/:id                  Status o'zgartirish
GET    /attendance/export               ?classId=&month=&format=pdf
```

### 6.4 Avtomatik Telegram notify

**Darhol (10 daqiqa delay — teacher xatolik qilsa tuzatishi uchun):**
> ⚠️ *Shaxzod* bugun *4-A* da *Matematika* darsiga kelmadi.
> Sana: 23.04.2026, Dars: 2 (09:00-09:45)
>
> [💬 Sababni tushuntirish]

**Ketma-ket 3 kun ABSENT:**
> 🚨 *Ogohlantirish:* Shaxzod 3 kun ketma-ket darsga kelmadi. Iltimos, sinf rahbari bilan bog'laning.

**Kunlik jadval (ertalab 08:30, ixtiyoriy):**
> 📚 *Shaxzod* bugun 6 ta darsi bor.
> Jadval: Matematika, Ona tili, Rasm, Jismoniy tarbiya, Ingliz tili, Matematika

### 6.5 Database

```sql
CREATE TABLE attendance (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT REFERENCES students(id),
    class_id        BIGINT REFERENCES classes(id),
    subject_id      BIGINT REFERENCES subjects(id),
    schedule_entry_id BIGINT REFERENCES schedule_entries(id),
    date            DATE NOT NULL,
    lesson_number   INT NOT NULL,
    status          VARCHAR(20) NOT NULL
                    CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED','SICK')),
    remarks         VARCHAR(500),
    marked_by       BIGINT REFERENCES users(id),
    marked_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, date, lesson_number, subject_id)
);

CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);

CREATE TABLE attendance_monthly_summary (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT REFERENCES students(id),
    month           INT CHECK (month BETWEEN 1 AND 12),
    year            INT,
    total_lessons   INT DEFAULT 0,
    present_count   INT DEFAULT 0,
    absent_count    INT DEFAULT 0,
    late_count      INT DEFAULT 0,
    excused_count   INT DEFAULT 0,
    percentage      DECIMAL(5,2),
    calculated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, month, year)
);
```

---

## 7. GRADES MODULI

### 7.1 Baholash tizimi

**Raqamli (0-100) + Harf (NIS fin modeli):**

| Ball | Harf | GPA 4.0 |
|------|:----:|:-------:|
| 90-100 | A | 4.0 |
| 80-89 | B | 3.0 |
| 70-79 | C | 2.0 |
| 60-69 | D | 1.0 |
| 0-59 | F | 0.0 |

### 7.2 Baholash turlari

| Tur | Og'irlik |
|-----|:--------:|
| TEST (joriy) | 0.20 |
| ASSIGNMENT (uy vazifasi) | 0.15 |
| PROJECT | 0.15 |
| MIDTERM | 0.20 |
| FINAL | 0.30 |

### 7.3 Endpoint'lar

```
POST   /grades                          (TEACHER o'z fani uchun)
GET    /grades                          ?studentId=&subjectId=&term=
PATCH  /grades/:id                      24 soat ichida faqat, so'ng MANAGER
DELETE /grades/:id                      Sabab majburiy
GET    /grades/gpa/:studentId           ?term=&year=
GET    /grades/report/:studentId        ?format=pdf
GET    /grades/class/:classId/stats     Sinfning umumiy vaziyati
```

### 7.4 Avtomatik Telegram notify'lar

**Baho < 60 (F):**
> 📝 *Shaxzod* *Matematikadan* *58 (F)* baho oldi.
> O'qituvchi izohi: "Kelasi dars qoshimcha mashg'ulotga kelishi kerak"
>
> [📊 Batafsil] [💬 O'qituvchi bilan bog'lanish]

**Haftalik xulosa (Juma 16:00):**
> 📊 *Shaxzod — haftalik hisobot*
>
> Matematika: 87 (B) 📈
> Ona tili: 92 (A) 📈
> Ingliz tili: 78 (C) 📉
>
> O'rta ball: 85.6
> [📄 PDF yuklash]

**GPA < 2.0 (chorak):** MANAGER dashboard'ga "at-risk students" ro'yxati.

### 7.5 Database

```sql
CREATE TABLE grades (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT REFERENCES students(id),
    subject_id      BIGINT REFERENCES subjects(id),
    teacher_id      BIGINT REFERENCES users(id),
    assessment_type VARCHAR(20)
                    CHECK (assessment_type IN ('TEST','ASSIGNMENT','PROJECT','MIDTERM','FINAL')),
    score           DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
    letter_grade    VARCHAR(2),
    academic_term   INT CHECK (academic_term BETWEEN 1 AND 4),
    academic_year   VARCHAR(10),
    comments        TEXT,
    graded_at       TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_grades_student ON grades(student_id, academic_year, academic_term);
CREATE INDEX idx_grades_subject ON grades(subject_id);
```

---

## 8. SCHEDULE MODULI

### 8.1 Jadval tuzilmasi

- 5 ish kuni (Du-Ju)
- Kuniga max 7 dars
- Dars: 45 daqiqa + 10 daqiqa tanaffus
- Boshlanish: 08:00

### 8.2 Konflikt tekshirish

Har `POST /schedule/entries` va `PATCH` da avtomatik tekshiriladi:

- **TEACHER_CONFLICT** — O'qituvchi bir vaqtda ikki joyda bo'la olmaydi
- **ROOM_CONFLICT** — Xonada bir vaqtda ikki dars bo'la olmaydi
- **CLASS_CONFLICT** — Sinfda bir vaqtda bir dars
- **TEACHER_OVERLOAD** — Haftalik yuk chegarasidan oshmaydi (default 20)

Konflikt bo'lsa `409 Conflict` + aniq sabab.

### 8.3 Substitution (almashtirish)

**Oqim:**
1. MANAGER: "Aliyev A. bugun kela olmaydi"
2. "Substitution" bo'limida:
   - Sana: bugungi
   - O'qituvchi: Aliyev A.
   - Sistema avtomatik topadi: Aliyev'ning bugungi 3 ta darsi
   - Har dars uchun o'rinbosar tanlash (dropdown — faqat bo'sh o'qituvchilar)
3. Tasdiqlanadi → Telegram notify:
   - Aliyev'ga: "Bugungi darslaringiz boshqalarga topshirildi"
   - Har o'rinbosarga: "Bugun [vaqt] da [sinf] [fan] ni olib borasiz"
   - Sinf ota-onalariga: "Bugungi [fan] darsini [F.I.O] olib boradi"

### 8.4 Endpoint'lar

```
POST   /schedule/entries                (ADMIN, MANAGER)
GET    /schedule/entries
GET    /schedule/class/:classId
GET    /schedule/teacher/:teacherId
GET    /schedule/room/:roomId
GET    /schedule/me                     O'zimning jadvali
PATCH  /schedule/entries/:id
DELETE /schedule/entries/:id
POST   /schedule/substitutions
GET    /schedule/substitutions          ?date=&teacherId=
DELETE /schedule/substitutions/:id

POST   /rooms                           (ADMIN)
GET    /rooms
GET    /rooms/:id/availability          ?date=
```

### 8.5 Database

```sql
CREATE TABLE rooms (
    id              BIGSERIAL PRIMARY KEY,
    room_number     VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(100),
    capacity        INT DEFAULT 30,
    type            VARCHAR(30), -- CLASSROOM, LAB, SPORTS
    floor           INT,
    is_active       BOOLEAN DEFAULT true
);

CREATE TABLE schedule_entries (
    id              BIGSERIAL PRIMARY KEY,
    class_id        BIGINT REFERENCES classes(id),
    subject_id      BIGINT REFERENCES subjects(id),
    teacher_id      BIGINT REFERENCES users(id),
    room_id         BIGINT REFERENCES rooms(id),
    day_of_week     VARCHAR(10)
                    CHECK (day_of_week IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY')),
    lesson_number   INT CHECK (lesson_number BETWEEN 1 AND 10),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedule_class ON schedule_entries(class_id);
CREATE INDEX idx_schedule_teacher_day ON schedule_entries(teacher_id, day_of_week);
CREATE INDEX idx_schedule_room_day ON schedule_entries(room_id, day_of_week);

CREATE TABLE schedule_substitutions (
    id              BIGSERIAL PRIMARY KEY,
    original_entry_id BIGINT REFERENCES schedule_entries(id),
    substitute_teacher_id BIGINT REFERENCES users(id),
    date            DATE NOT NULL,
    reason          VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'CONFIRMED',
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(original_entry_id, date)
);
```

---

## 9. PARENT PORTAL

### 9.1 Parent akkaunti yaratish (invite-based)

**Oqim:**

1. MANAGER o'quvchi ma'lumotlarini yaratadi (ota-ona Telegram username ixtiyoriy)
2. MANAGER "Parent invite yaratish" tugmasini bosadi
3. Sistema invite yaratadi:
   - 32 belgili random token
   - URL: `https://portal.nis.uz/invite/abc123xyz...`
   - Muddat: 7 kun
4. MANAGER URL'ni ota-onaga yuboradi:
   - Bot orqali (agar Telegram username bor bo'lsa — avtomatik)
   - Yoki qo'lda (WhatsApp, SMS, og'zaki — tizimdan tashqari)
5. Parent URL'ga kiradi → Telegram Login Widget ko'rinadi
6. "Login with Telegram" bosadi → ruxsat beradi
7. Backend:
   - Telegram hash verifikatsiya
   - Invite token tekshirish (mavjudligi, muddati, ishlatilmaganligi)
   - User yaratadi (role=PARENT, email=null yoki avtomatik `tg_{id}@nis.parent`)
   - `parent_students` ga bog'lanish yozuvi
   - `parent_invites.used_at = NOW()`
   - JWT qaytaradi
8. Parent darhol dashboard'da

### 9.2 Bir ota-ona — bir nechta farzand

Agar ota-onaning ikkinchi farzandi ham maktabda o'qisa:

1. MANAGER ikkinchi invite yaratadi (o'sha ota-ona uchun)
2. Ota-ona URL'ga kiradi, lekin Telegram orqali allaqachon tanilgan
3. Sistema:
   - Mavjud user topadi (telegram_id bo'yicha)
   - Yangi user yaratmaydi
   - `parent_students` ga **yangi** bog'lanish qo'shadi
4. Portal'da "Farzandlar" dropdown'ida ikkalasi:
   ```
   [Shaxzod ▾]  [Dilnoza]
   ```

### 9.3 Dashboard mazmuni

**Asosiy bo'limlar:**

1. **Bugun:** Bugungi jadval, davomat, bahoar
2. **Haftalik ko'rinish:** Jadval grid (Du-Ju)
3. **Bahoar:** Fanlar bo'yicha, GPA, grafik
4. **Davomat:** Oylik foiz, kalendar
5. **Xabarlar:** O'qituvchi va maktabdan kelgan xabarlar

### 9.4 Endpoint'lar

```
POST   /parents/invite                  (ADMIN, MANAGER)
  Body: { studentId, parentName, relationship }
  → { inviteUrl, expiresAt }

GET    /parents/me/children
GET    /parents/me/dashboard?studentId=
GET    /parents/me/children/:id/grades
GET    /parents/me/children/:id/attendance
GET    /parents/me/children/:id/schedule
GET    /parents/me/notifications
PATCH  /parents/me/notifications/:id/read
PATCH  /parents/me/preferences          Notification sozlamalari
```

### 9.5 Database

```sql
CREATE TABLE parent_students (
    id              BIGSERIAL PRIMARY KEY,
    parent_user_id  BIGINT REFERENCES users(id),
    student_id      BIGINT REFERENCES students(id),
    relationship    VARCHAR(30), -- FATHER, MOTHER, GUARDIAN
    is_primary      BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(parent_user_id, student_id)
);

CREATE INDEX idx_parent_students_parent ON parent_students(parent_user_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);
```

---

## 10. TELEGRAM BOT KENGAYTIRISH

### 10.1 v1.0 dan farqli

v1.0'da bot asosan notify yuborish uchun. v2.0'da bot — **to'liq interaktiv**.

### 10.2 Yangi komandalar

**Parent uchun:**

- `/start` — salom + "Portal'ga kirish" tugmasi (deep link)
- `/today` — bugungi jadval va davomat
- `/grades` — so'nggi bahoar (inline keyboard: fan tanlash)
- `/report` — oylik PDF hisobotni olish
- `/children` — farzand tanlash (agar bir nechta)

**Teacher uchun:**

- `/myclasses` — bugungi darslar
- `/students CLASS_ID` — sinf ro'yxati

**Umumiy:**

- `/help`
- `/settings` — til (UZ/RU/EN), notify sozlamalari, sokin soatlar
- `/unlink` — Telegram akkauntni ajratish (xavfsizlik)

### 10.3 Inline keyboard misollari

**Baho xabari:**
```
📝 Shaxzodning Matematikadan yangi bahosi
Ball: 87 (B)
O'qituvchi: Aliyev A.

[📊 Batafsil] [📚 Barcha baholar]
```

**Davomat xabari:**
```
⚠️ Dilnoza bugun darsga kelmadi
Sana: 23.04.2026
Dars: 2 (Ingliz tili, 08:55-09:40)

[✅ Sabab yuborish] [💬 O'qituvchi bilan bog'lanish]
```

Callback handler (nestjs-telegraf):

```typescript
@Action(/^attendance:excuse:(\d+)$/)
async onExcuseAttendance(@Ctx() ctx: Context) {
  const attendanceId = ctx.match[1];
  await ctx.scene.enter('excuseAttendanceScene', { attendanceId });
}
```

### 10.4 Fayl yuborish (PDF hisobot)

```typescript
async sendMonthlyReport(chatId: number, pdfBuffer: Buffer, studentName: string) {
  await this.bot.telegram.sendDocument(
    chatId,
    { source: pdfBuffer, filename: `${studentName}_report.pdf` },
    { caption: `📊 ${studentName} — oylik hisobot` }
  );
}
```

### 10.5 Teacher → Parent xabarlashuv

**Oqim:**

1. Teacher portalida "O'quvchilar" bo'limida o'quvchi ustiga bosadi
2. "Ota-onaga xabar" tugmasi → modal
3. Xabar yozadi: "Shaxzod bugun darsni yaxshi o'zlashtirdi..."
4. Yuboradi → RabbitMQ queue
5. Bot parent'ga xabar yuboradi:

```
💬 O'qituvchidan xabar (Aliyev A., Matematika)
Shaxzod haqida:

Assalomu alaykum, Shaxzod bugun darsni yaxshi o'zlashtirdi...

[✍️ Javob berish]
```

6. Parent "Javob berish" bosadi → bot scene boshlaydi → javob yozadi
7. Javob Teacher portaliga keladi

### 10.6 Scenes (multi-step)

`nestjs-telegraf` scenes:

- `replyToTeacherScene` — parent teacher'ga javob
- `excuseAttendanceScene` — ABSENT uchun sabab yuborish
- `linkAccountScene` — Admin/Manager Telegram'ni bog'lash
- `feedbackScene` — xatolik haqida xabar

---

## 11. WEBSOCKET (REAL-TIME)

### 11.1 Arxitektura

- `@nestjs/websockets` + Socket.io
- Redis adapter (multi-instance uchun)
- JWT handshake paytida validate

### 11.2 Room'lar

```typescript
// Har ulanishda user shu room'larga qo'shiladi:
- user:{userId}            — shaxsiy notify
- class:{classId}          — sinf a'zolari (teacher, admin)
- parent:{parentId}        — ota-ona va farzandlari
- role:ADMIN               — barcha adminlar
```

### 11.3 Event'lar

| Event | Kim oladi | Qachon |
|-------|-----------|:------:|
| `attendance.marked` | class + parent | Teacher saqlagan zahoti |
| `grade.added` | student parent + admins | Baho qo'shilganda |
| `schedule.changed` | affected users | Jadval o'zgarganda |
| `substitution.created` | affected users | Almashtirish |
| `notification.new` | specific user | Har qanday notify |
| `dashboard.stats` | admins | Har 30 soniya |

### 11.4 Frontend

```typescript
const socket = io('wss://portal.nis.uz', {
  auth: { token: localStorage.getItem('access_token') }
});

socket.on('grade.added', (data) => {
  showToast(`Yangi baho: ${data.subject} - ${data.score}`);
  refreshGrades();
});

socket.on('attendance.marked', (data) => {
  if (data.status === 'ABSENT') {
    showAlert('Farzandingiz darsga kelmadi');
  }
});
```

---

## 12. PDF HISOBOTLAR

### 12.1 Library tanlovi

**Tavsiya:** `pdfmake` (JSON-ga asoslangan, yengil, tez)

Agar chiroyliroq kerak bo'lsa: `puppeteer` (HTML→PDF, lekin og'ir — Chromium container).

### 12.2 Generatsiya qilinadigan hujjatlar

1. **Oylik hisobot (parent uchun)** — davomat, bahoar, GPA, o'qituvchi izohi
2. **Sinf davomat jurnali (oylik)** — matritsa: o'quvchi × sana
3. **Chorak hisobot (o'quvchi)** — 3 oylik bahoar va GPA

### 12.3 Async generatsiya

```typescript
// Kattaroq hisobotlar PDF worker'ga yuboriladi
await this.eventBus.emit('report.generate', {
  type: 'MONTHLY_PARENT_REPORT',
  studentId: 101,
  month: 4,
  year: 2026,
  deliverVia: 'TELEGRAM',
  parentUserId: 55
});
```

Worker:
1. Queue'dan task oladi
2. Ma'lumot yig'adi (DB query)
3. PDF generatsiya
4. `/pdf-storage/` ga saqlaydi
5. Telegram bot'ga signal → parent'ga fayl

---

## 13. NOTIFICATIONS TIZIMI (TELEGRAM-ONLY)

### 13.1 Kanal

v2.0'da **faqat Telegram + in-app**. SMS yo'q.

### 13.2 Yuborish logikasi

```typescript
async notify(userId: number, notification: Notification) {
  // 1. Har doim in-app saqlash
  await this.notificationsRepo.save({ userId, ...notification });
  
  // 2. Real-time (agar portal ochiq bo'lsa)
  this.websocketGateway.toUser(userId).emit('notification.new', notification);
  
  // 3. Telegram (agar bog'langan va sozlamalarda yoqilgan bo'lsa)
  const user = await this.usersRepo.findOne({ 
    where: { id: userId },
    relations: ['notificationPreferences']
  });
  
  if (user.telegramChatId && this.shouldSendTelegram(user, notification)) {
    await this.eventBus.emit('notification.telegram', {
      chatId: user.telegramChatId,
      message: this.renderTemplate(notification, user.language),
      buttons: notification.buttons
    });
  }
}
```

### 13.3 Severity darajalari

| Severity | Tavsif | Telegram |
|----------|--------|:--------:|
| `CRITICAL` | Kasallik, xavfsizlik | ✅ |
| `HIGH` | Davomat alert, past baho | ✅ |
| `NORMAL` | Oddiy baho, jadval | ✅ |
| `LOW` | Umumiy xabar, broadcast | sozlamaga qarab |

### 13.4 Template engine

Handlebars + i18n:

```hbs
{{!-- templates/notifications/grade-added.uz.hbs --}}
📝 *{{studentName}}* — yangi baho!

*Fan:* {{subjectName}}
*Ball:* {{score}} ({{letterGrade}})
*Turi:* {{assessmentType}}
*O'qituvchi:* {{teacherName}}

{{#if comments}}
💬 {{comments}}
{{/if}}
```

### 13.5 Parent o'z sozlamalari

Parent portalida "Sozlamalar" → "Bildirishnomalar":

```
☑ Bahoar
☑ Davomat
☑ Jadval o'zgarishi
☐ Broadcast xabarlar
☑ Haftalik xulosa
☐ Kunlik jadval (ertalab)

Sokin soatlar:
  Boshlanish: 22:00
  Tugash:     07:00
```

Database:

```sql
CREATE TABLE notification_preferences (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id),
    grades          BOOLEAN DEFAULT true,
    attendance      BOOLEAN DEFAULT true,
    schedule        BOOLEAN DEFAULT true,
    broadcast       BOOLEAN DEFAULT false,
    weekly_summary  BOOLEAN DEFAULT true,
    daily_schedule  BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end   TIME,
    language        VARCHAR(5) DEFAULT 'uz',
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    type            VARCHAR(50),
    severity        VARCHAR(20) DEFAULT 'NORMAL',
    title           VARCHAR(200),
    body            TEXT,
    data            JSONB,
    is_read         BOOLEAN DEFAULT false,
    channels_sent   VARCHAR(50)[], -- ['TELEGRAM', 'IN_APP']
    created_at      TIMESTAMP DEFAULT NOW(),
    read_at         TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread 
    ON notifications(user_id, is_read, created_at DESC);
```

---

## 14. ISHLAB CHIQISH BOSQICHLARI (6 HAFTA)

### Hafta 1: Telegram Login + Foundation
- Telegram hash verification service
- `/auth/telegram` endpoint
- `parent_invites` jadval
- `/auth/parent/invite` va `/auth/parent/accept-invite`
- Frontend minimal page (test uchun)
- E2E test: to'liq login oqimi

### Hafta 2: Subjects + Rooms
- Subjects CRUD
- `class_subjects` bog'lanish
- Rooms CRUD
- Testlar

### Hafta 3: Attendance
- Attendance entity va service
- Manual davomat (Teacher flow)
- WebSocket real-time event
- Telegram notify (10 daqiqa delay)
- Oylik xulosa jadvali (scheduled)
- Testlar

### Hafta 4: Grades + Schedule
- Grades moduli (CRUD, GPA)
- Past baho notify
- Schedule entries + konflikt detection
- Substitution moduli
- Edge-case testlar

### Hafta 5: Parent Portal + Enhanced Bot
- `parent_students` jadval, relations
- Parent dashboard endpoints
- Bot yangi komandalar (/today, /grades, /report)
- Inline keyboards
- Bot scenes (reply to teacher, excuse attendance)
- Multi-language templates

### Hafta 6: PDF, WebSocket, Deploy
- PDF worker (pdfmake)
- Oylik hisobot PDF
- Socket.io gateway + Redis adapter
- Notification preferences
- E2E testlar
- Production deploy
- Load testing

---

## 15. MIGRATSIYA v1.0 dan

### 15.1 Zero-downtime

- Feature flag har modul uchun (`FEATURE_ATTENDANCE_ENABLED` kabi)
- Backward-compatible migrations
- Rollback tayyor (eski image + DB revert)

### 15.2 v1.0 ota-onalarni ko'chirish

v1.0'da ota-ona info `students` jadvalida. v2.0'da alohida user kerak.

**Yondashuv:** Avtomatik emas — invite orqali.

1. MANAGER har student uchun parent invite yaratadi (bulk action)
2. Bot avtomatik URL'larni ota-onalarga yuboradi (parentTelegram mavjud bo'lsa)
3. Ota-onalar Telegram Login bilan kiradilar
4. `users` + `parent_students` avtomatik paydo bo'ladi

Bu yaxshi, chunki:
- Ota-onalar o'zi ro'yxatdan o'tadi (ruxsat berish)
- Email yo'q yasama akkaunt yaratilmaydi
- Tartibli, ixtiyoriy

---

## 16. ARXITEKTURA

### 16.1 Yangi servislar

```
nis-api                  (REST — kengaytirilgan)
nis-bot                  (Telegraf — juda kengaytirilgan)
nis-worker               (RabbitMQ consumer)
nis-websocket   [YANGI]  (Socket.io)
nis-pdf-worker  [YANGI]  (PDF generatsiya)
```

### 16.2 Caddyfile

```
portal.nis.uz {
    encode gzip
    
    # API
    reverse_proxy /api/* api:3001
    
    # WebSocket
    @websocket {
        header Connection *Upgrade*
        header Upgrade    websocket
    }
    reverse_proxy @websocket websocket:3003
    
    # Static frontend (Parent portal)
    root * /srv/parent-portal
    try_files {path} /index.html
    file_server
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        # Telegram widget uchun Content-Security-Policy
        Content-Security-Policy "
            default-src 'self';
            script-src 'self' https://telegram.org;
            frame-src https://oauth.telegram.org;
            img-src 'self' https://t.me data:;
            connect-src 'self' wss://portal.nis.uz;
        "
    }
}
```

**Muhim:** CSP'da `script-src` va `frame-src` Telegram'ga ruxsat berilishi shart — aks holda widget ishlamaydi.

### 16.3 Env o'zgaruvchilar (yangi)

```bash
# Telegram
TELEGRAM_BOT_TOKEN=1234:xxx
TELEGRAM_BOT_USERNAME=nis_school_bot
TELEGRAM_LOGIN_DOMAIN=portal.nis.uz    # @BotFather'da /setdomain

# WebSocket
WEBSOCKET_PORT=3003
WEBSOCKET_REDIS_ADAPTER=true

# PDF
PDF_STORAGE_PATH=/pdf-storage
PDF_WORKER_CONCURRENCY=3

# Frontend
FRONTEND_URL=https://portal.nis.uz
```

---

## 17. QABUL QILISH MEZONLARI

v2.0 tayyor deyiladi, agar:

- [ ] Parent Telegram Login orqali parolsiz kira oladi
- [ ] Hash verification ishlaydi (invalid hash → 401)
- [ ] Invite token 7 kun amal qiladi, bir marta ishlatiladi
- [ ] Teacher davomat qo'ya oladi, 10 daqiqadan keyin ota-onalarga telegram ketadi
- [ ] Grades GPA to'g'ri hisoblaydi, past baho uchun avto notify
- [ ] Schedule konflikt tekshirish barcha edge case'larda ishlaydi
- [ ] Substitution yaratilganda 3 guruh (asosiy o'qituvchi, o'rinbosar, parent) notify oladi
- [ ] Parent portal dashboard to'liq ishlaydi (2 farzandli ota-ona uchun switcher)
- [ ] Bot enhanced komandalar va inline keyboard'lari ishlaydi
- [ ] PDF oylik hisobot Telegram'ga fayl sifatida yetib boradi
- [ ] WebSocket real-time event'lar ishlaydi
- [ ] Notification preferences — parent o'z sozlamalarini boshqaradi
- [ ] Multi-language (UZ/RU/EN) bot xabarlarida ishlaydi
- [ ] v1.0 regression yo'q
- [ ] Coverage ≥ 70%

---

## 18. XAVFLAR

| Xavf | Ta'siri | Chora |
|------|:-------:|-------|
| Telegram bot blocklanishi (yoki API limit) | Yuqori | Rate limit, fallback web portal |
| Telegram Login hash verify fail | O'rta | Logging, retry, fallback password auth (ADMIN/MANAGER uchun) |
| Parent Telegram akkaunti yo'q | O'rta | Email+password alternative (Phase 2.1 ixtiyoriy) |
| Real-time load o'sishi | O'rta | Horizontal scaling, Redis adapter |
| PDF generatsiyasi sekinlashuvi | Past | Async queue, worker scaling |
| Ota-onalar yangi tizimni o'zlashtira olmasligi | Yuqori | Video qo'llanma, maktab yig'ilishida ko'rsatish, sodda UX |
| Bot token leak | Kritik | Vault (docker secrets), rotate mumkinligi |

---

## 19. BUDJET

### 19.1 Development

- 2 Backend + 1 Frontend + 1 QA × 6 hafta
- Taxminan: **$10,000-15,000**

### 19.2 Ishlab turishda (oylik)

- Server (4 CPU, 8 GB): **$40-60**
- Domain + SSL (Caddy): **$2/oy** (domain yillik bo'lib chiqqanda)
- Telegram Bot API: **$0** (bepul)
- Backup storage: **$5-10**
- Monitoring (Sentry free tier): **$0**

**Jami oylik:** ~$50-80

SMS olib tashlanganligi uchun xarajat emas, aksincha **tejaldi**.

---

## 20. XULOSA

v2.0 NIS maktabi uchun **Telegram-first, parolsiz** tizim. Ota-onalar bir marta tugma bosish bilan kirib, farzandining butun ma'lumotini real-time ko'radi. O'qituvchilar davomat va baholarni tezroq qo'yadi. Jadval o'zgarishi darhol hammaga yetib boradi.

**Asosiy yangiliklar:**

1. **Telegram Login Widget** — parolsiz, bir marta bosish
2. **Attendance + Grades + Schedule** — to'liq o'quv jarayonini avtomatlashtirish
3. **Parent Portal** — ota-onalar uchun alohida kabinet
4. **Enhanced Bot** — interaktiv, fayl yuborish, xabarlashuv
5. **Telegram-only notify** — SMS yo'q, xarajat yo'q, oddiy UX

**Muhim tamoyillar:**
- Zero-downtime migration v1.0 dan
- Feature flag har modul uchun
- Backward compatibility
- Gradual rollout (1 sinf → butun maktab)
- Telegram bot token xavfsizligi (secrets, no logs, rotate)

---

**Tuzuvchi:** _________________
**Sana:** 2026
**Versiya:** 2.0 (Telegram-first, parolsiz, to'lovsiz)
**Oldingi:** 1.0 (Core MVP, production)