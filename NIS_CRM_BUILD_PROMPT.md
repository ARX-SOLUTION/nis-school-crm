# NIS CRM — MVP Build Master Prompt

> **Maqsad:** Bitta prompt bilan Claude Code butun MVP loyihani boshidan oxirigacha quradi.
> Claude Code sizning `CLAUDE.md` va `.claude/agents/` larda yaratilgan subagentlardan foydalanadi.

---

## 📖 Ishlatish bo'yicha qo'llanma

### Oldindan shart

- [x] Bo'sh loyiha papkasi mavjud (yoki `git init` qilingan)
- [x] `CLAUDE.md` fayli ildizida
- [x] `.claude/agents/` papkasida 10 ta agent fayli
- [x] Docker Desktop ishga tushirilgan (yoki Linux'da docker engine)
- [x] Node.js 20 LTS o'rnatilgan
- [x] Claude Code'da `Auto-accept edits` yoqilgan (tavsiya etiladi)

### Promptni ishga tushirish

```bash
cd ~/projects/nis-crm
claude
# Keyin pastdagi BUILD PROMPT'ni to'liqligicha yopishtiring
```

---

## 🚀 BUILD PROMPT (shu joydan pastga nusxalang)

```
Salom. Men NIS School CRM loyihasining MVP'ini qurmoqchiman.

Avval `CLAUDE.md` faylini o'qi va barcha subagentlarni `/agents list` orqali
tekshir. Agar biror narsa yo'q bo'lsa, menga xabar ber va to'xta.

## Vazifa

MVP'ni 10 ta bosqichda qur. Har bir bosqich oxirida:
1. Qisqa hisobot ber (nima qilinganini 3-5 qator bilan)
2. Menga "davom etayinmi?" deb so'rama — avtomatik davom et
3. Faqat kritik qaror kerak bo'lsa to'xta va meni so'roqla
4. Har bir bosqichdan keyin git commit qil (Conventional Commits)

## Tamoyillar

- Har bir bosqichda kerakli subagentni aniq chaqir (@agent-name)
- Kod yozilgandan so'ng @code-reviewer avtomatik chaqirilsin
- Test yozilmagan business logic qabul qilmayman
- Har bir bosqich oxirida `npm run build` ishlashi shart (kompilatsiya xatosiz)
- Har bir bosqich oxirida `npm run test` ishlashi shart (hech qanday test fail bo'lmasin)
- Barcha fayl va kod CLAUDE.md dagi standartlarga rioya qilsin

---

## 📦 BOSQICH 0: Bootstrap (infrastruktura)

**Maqsad:** NestJS loyihasini yaratish, Docker infrastrukturani sozlash.

**Kim:** @nestjs-architect + @devops-specialist

**Bajariladigan ishlar:**
1. `nest new . --package-manager npm --strict` orqali NestJS loyihani boshla
2. Asosiy paketlarni o'rnat:
   - `@nestjs/typeorm typeorm pg`
   - `@nestjs/config`
   - `@nestjs/jwt @nestjs/passport passport passport-jwt`
   - `@nestjs/microservices amqplib amqp-connection-manager`
   - `@nestjs/schedule`
   - `@nestjs/throttler`
   - `@nestjs/swagger`
   - `nestjs-pino pino-http pino-pretty`
   - `nestjs-telegraf telegraf`
   - `ioredis`
   - `bcrypt class-validator class-transformer`
   - `helmet`
   - Dev: `@types/bcrypt @types/passport-jwt`
3. Papka strukturasini yarat:
   ```
   src/
     common/{guards,decorators,interceptors,filters,pipes,dto,utils}/
     config/
     modules/{auth,users,students,classes,teachers,telegram,audit,dashboard}/
     database/{migrations,seeds}/
     workers/
   ```
4. `.env.example` yarat (CLAUDE.md va TZ'dagi barcha o'zgaruvchilar bilan)
5. `docker-compose.dev.yml` yarat (postgres, redis, rabbitmq — faqat dev uchun)
6. `Dockerfile` yarat (multi-stage: builder + runtime, non-root user)
7. `.gitignore`, `.dockerignore`, `.editorconfig`, `.prettierrc`, `eslint.config.mjs`
8. `.husky/` + `lint-staged` konfiguratsiyasi (pre-commit hook)
9. `tsconfig.json` — strict mode, paths aliaslar (`@common/*`, `@modules/*`)
10. `package.json` script'lari:
    - `dev`, `build`, `start:prod`
    - `test`, `test:watch`, `test:cov`, `test:e2e`
    - `migration:generate`, `migration:run`, `migration:revert`
    - `db:seed`
    - `lint`, `format`

**Acceptance:**
- `docker compose -f docker-compose.dev.yml up -d` ishladi
- `npm run build` xatosiz
- Git commit: `chore: bootstrap nestjs project with docker infrastructure`

---

## 🗄️ BOSQICH 1: Database foundation

**Maqsad:** TypeORM sozlash, baza ulash, base entity, config module.

**Kim:** @database-engineer + @nestjs-architect

**Bajariladigan ishlar:**
1. `ConfigModule` global — env validation (Joi yoki zod bilan)
2. `TypeOrmModule.forRootAsync` — ConfigService orqali, `synchronize: false`
3. `DatabaseModule` yarat — global
4. `BaseEntity` abstract klass (`id`, `createdAt`, `updatedAt`, `deletedAt`)
5. `RedisModule` — ioredis, global provider
6. `PinoLoggerModule` — JSON logs (prod), pretty (dev), request-id
7. Health check endpoint: `GET /health` (db, redis, rabbitmq status)
8. Global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
9. Global `HttpExceptionFilter` (standardized error response)
10. Global `LoggingInterceptor` (request/response time, no sensitive data)

**Acceptance:**
- `npm run start:dev` ishladi
- `GET /health` → `{ status: 'ok', db: 'ok', redis: 'ok' }`
- Git commit: `feat(core): add database, redis, logging infrastructure`

---

## 🔐 BOSQICH 2: Auth moduli

**Maqsad:** Login, refresh, logout, RBAC, foydalanuvchilar bazasi.

**Kim:** @auth-security-expert + @database-engineer + @api-developer

**Bajariladigan ishlar:**
1. `User` entity (TZ'dagi sxema bo'yicha) + migration
2. `RefreshToken` entity + migration (token rotation uchun)
3. `Role` enum: `SUPER_ADMIN | ADMIN | MANAGER | TEACHER`
4. `UsersModule` — CRUD service (repository pattern)
5. `AuthModule`:
   - `AuthService` — login, refresh, logout, validatePassword
   - `JwtStrategy` — access token validate
   - `JwtAuthGuard` (global default)
   - `RolesGuard` + `@Roles()` decorator
   - `@Public()` decorator (login endpoint uchun)
   - `@CurrentUser()` decorator
6. Endpointlar:
   - `POST /auth/login` → `{ accessToken, refreshToken, user }`
   - `POST /auth/refresh` → yangi token juftlik
   - `POST /auth/logout` → token bekor qilish
   - `POST /auth/change-password`
   - `GET /auth/me`
7. bcrypt password hashing (cost=12)
8. Rate limiting: `/auth/login` — 5 urinish/15 daqiqa (Redis-based)
9. Brute force: 5 muvaffaqiyatsiz urinishdan keyin 15 daqiqa bloklash
10. Seed: `SUPER_ADMIN` yaratish (email: `admin@nis.uz`, parol .env dan)
11. Swagger tag: `Auth`
12. Testlar: unit (AuthService), e2e (login flow, rate limit, invalid token)

**Acceptance:**
- `npm run db:seed` super admin yaratdi
- `POST /auth/login` to'g'ri javob beradi
- `GET /auth/me` access token bilan ishlaydi
- Test coverage ≥ 80% auth moduli uchun
- Git commit: `feat(auth): add jwt authentication with rbac`

---

## 👥 BOSQICH 3: Users moduli (Admin/Manager/Teacher yaratish)

**Maqsad:** Foydalanuvchilarni boshqarish, rol ierarxiyasi.

**Kim:** @api-developer + @auth-security-expert + @queue-event-engineer

**Bajariladigan ishlar:**
1. `UsersController` — to'liq CRUD
   - `POST /users` (ADMIN+ only) — yangi user yaratish
   - `GET /users` — pagination, filter (role, search, status)
   - `GET /users/:id`
   - `PATCH /users/:id`
   - `DELETE /users/:id` (soft delete)
   - `POST /users/:id/reset-password`
2. DTO'lar:
   - `CreateUserDto` (email, fullName, role, phone, telegramUsername)
   - `UpdateUserDto`
   - `UserResponseDto` (password hash YO'Q)
   - `UsersQueryDto` (pagination, filters)
3. Biznes qoidalari:
   - ADMIN faqat MANAGER va TEACHER yarata oladi
   - MANAGER faqat TEACHER yarata oladi
   - SUPER_ADMIN'ni hech kim yarata olmaydi (faqat seed)
   - Foydalanuvchi o'zini o'chira olmaydi
4. Yangi foydalanuvchi yaratilganda:
   - Random parol generatsiya (12 ta belgi)
   - `mustChangePassword = true`
   - RabbitMQ event emit: `user.created` (keyin Telegram bot iste'mol qiladi)
5. `TeacherProfile` entity (User bilan 1:1) + migration
6. `POST /teachers` — teacher yaratish (User + TeacherProfile bir tranzaksiyada)
7. Swagger dokumentatsiya
8. Testlar: unit + e2e (role hierarchy, validation)

**Acceptance:**
- Admin Manager yarata oladi, Manager Admin yarata olmaydi (403)
- Teacher yaratish Users + TeacherProfile ni bir transaction'da yaratadi
- `user.created` event RabbitMQ'ga yuboriladi (loglar orqali ko'rinadi)
- Git commit: `feat(users): add user management with role hierarchy`

---

## 🏫 BOSQICH 4: Classes va Students

**Maqsad:** O'quvchilar va sinflarni boshqarish, bir-biriga biriktirish.

**Kim:** @database-engineer + @api-developer

**Bajariladigan ishlar:**
1. `Class` entity + migration:
   - name, gradeLevel (1-11), academicYear, classTeacherId, maxStudents (default 30), roomNumber, isActive
2. `Student` entity + migration (TZ sxemasi bo'yicha)
3. `StudentClassHistory` entity + migration (o'quvchi qaysi sinfda o'qigan)
4. `ClassesModule`:
   - CRUD + `PATCH /classes/:id/assign-teacher`
   - `GET /classes/:id/students`
5. `StudentsModule`:
   - CRUD + `PATCH /students/:id/assign-class`
   - Student code avtomatik generatsiya: `NIS-YYYY-XXXXX` (incremental, sequence ishlatib)
   - Soft delete: `DELETE /students/:id` → `status=INACTIVE`, `leftAt`, `leftReason`
   - Export: `GET /students/export?format=csv` (faqat ADMIN)
6. Biznes qoidalari:
   - Sinfga biriktirganda:
     - O'quvchi `gradeLevel` va sinf `gradeLevel` mos bo'lishi shart
     - Sinf to'lmagan bo'lishi shart (`maxStudents` tekshirish)
     - Eski sinfdan avtomatik chiqarish
     - `StudentClassHistory` ga yozuv qo'shish
     - Hammasi bir transaction'da
   - TEACHER faqat `GET /teachers/me/students` dan foydalana oladi — o'z sinfidagi o'quvchilarni ko'radi
   - TEACHER boshqa endpointlarga kira olmaydi
7. DTO'lar va Swagger
8. Testlar:
   - Sinfga biriktirish edge case'lari (gradeLevel mismatch, sinf to'la, band o'quvchi)
   - TEACHER'ning cheklovi (403 test)
   - History yozuvi

**Acceptance:**
- Manager o'quvchi qo'shib, sinfga biriktira oladi
- `NIS-2026-00001` kabi kod avtomatik generatsiya
- Teacher `/teachers/me/students` ga kira oladi, `/students` ga kira olmaydi
- Git commit: `feat(core): add students and classes management`

---

## 🐇 BOSQICH 5: RabbitMQ + Audit log

**Maqsad:** Event-driven arxitektura, audit logging.

**Kim:** @queue-event-engineer + @auth-security-expert

**Bajariladigan ishlar:**
1. `RabbitMQModule` — config, connection manager, auto-reconnect
2. Exchange va queue topologiyasi:
   - Exchange: `nis.events` (topic)
   - Queues:
     - `notifications.telegram` (routing: `notification.telegram.*`)
     - `audit.log` (routing: `audit.*`)
     - Dead letter: `nis.dlx` + `nis.dlq`
3. `EventBusService` — wrapper (emit, consume)
4. `AuditLog` entity + migration
5. `AuditModule`:
   - `AuditInterceptor` — har bir mutating request (POST, PATCH, DELETE) ni `audit.log` ga emit qiladi
   - `AuditConsumer` — queue'dan o'qib bazaga yozadi
   - `GET /audit-logs` (ADMIN+ only) — pagination, filter (userId, action, entityType, dateRange)
6. Barcha mutating controllerlarga `AuditInterceptor` qo'llash
7. Sensitive ma'lumotlar audit'ga yozilmasin (passwords, tokens)
8. Retry policy: 3 marta exponential backoff (1s, 5s, 25s)
9. Testlar: event emission, consumer, interceptor

**Acceptance:**
- O'quvchi yaratganda → audit log yozuvi paydo bo'ladi
- `GET /audit-logs` ishlaydi, ADMIN+ cheklovi bor
- Queue'dan xabar muvaffaqiyatsiz iste'mol bo'lsa DLQ'ga tushadi
- Git commit: `feat(audit): add event-driven audit logging with rabbitmq`

---

## 🤖 BOSQICH 6: Telegram bot

**Maqsad:** Bot setup, foydalanuvchi bog'lash, parol yuborish.

**Kim:** @telegram-bot-specialist + @queue-event-engineer

**Bajariladigan ishlar:**
1. `TelegramModule` — nestjs-telegraf sozlash
2. Bot komandalari:
   - `/start` — tarbiyasiz xush kelib salom + link kodi ko'rsatish yo'riqnomasi
   - `/link CODE` — Telegram chat_id ni user bilan bog'lash
   - `/me` — foydalanuvchi ma'lumotlari (rol, email, sinf — teacher bo'lsa)
   - `/help` — yordam
3. Link kodi mantiqi:
   - User profile'da "Generate link code" → 6 xonali kod → Redis'da 10 min saqlash
   - User kodni bot'ga yuboradi → chat_id ni users.telegram_chat_id ga yozish
4. `TelegramNotificationConsumer` — `notifications.telegram` queue'ni o'qib xabar yuboradi
5. Notification templatelar (i18n: uz/ru/en):
   - `USER_CREATED` — parol yuborish
   - `PASSWORD_RESET` — tiklash kodi
   - `ADMIN_ALERT` — xavfsizlik hodisasi
6. `user.created` event listener:
   - Telegram bog'langan bo'lsa → bot orqali parol yuborish
   - Bog'lanmagan bo'lsa → audit log + admin'ga alert
7. Rate limiting: bitta chat_id ga 1 soatda max 20 xabar
8. Scheduled job: kunlik stats → ADMIN va MANAGER'larga ertalab 08:00 (Cron)
9. Testlar: unit (template rendering, link code generation), e2e (mock bot)

**Acceptance:**
- `/start` bot ishlaydi
- `/link CODE` user'ni muvaffaqiyatli bog'laydi
- Yangi teacher yaratilganda parol Telegram orqali keladi
- Git commit: `feat(telegram): add bot integration with notifications`

---

## 📊 BOSQICH 7: Dashboard

**Maqsad:** Rolga qarab statistika endpoint'lari.

**Kim:** @api-developer + @database-engineer

**Bajariladigan ishlar:**
1. `DashboardModule`:
   - `GET /dashboard/stats` — role-based
   - `GET /dashboard/recent-activity` (ADMIN+ only)
2. Statistika mazmuni:
   - **ADMIN/MANAGER:**
     - Jami o'quvchilar (aktiv, arxivlangan, sinfga biriktirilmaganlar)
     - Sinflar soni va o'rtacha to'ldirish foizi
     - O'qituvchilar soni
     - So'nggi 7 kun qo'shilgan o'quvchilar (grafik uchun kunlik)
     - Oxirgi 10 audit log
   - **TEACHER:**
     - O'z sinfi (agar class teacher bo'lsa)
     - Sinfdagi o'quvchilar soni
3. Redis cache (TTL 60 soniya, role+userId kalit)
4. Query optimization: `@database-engineer` bilan index tekshirish
5. Testlar: role-based access, cache invalidation

**Acceptance:**
- Admin to'liq statistikani ko'radi
- Teacher faqat o'z sinfi haqida ma'lumot oladi
- 2-chi so'rov Redis cache'dan keladi (logda ko'rinadi)
- Git commit: `feat(dashboard): add role-based dashboard stats`

---

## 🧪 BOSQICH 8: Testlar va sifat

**Maqsad:** To'liq test coverage, integratsion testlar.

**Kim:** @test-engineer + @code-reviewer

**Bajariladigan ishlar:**
1. Test database setup (alohida postgres container, `test-db`)
2. E2E test infrastructure:
   - `jest-e2e.json` konfiguratsiyasi
   - Global setup/teardown (migrate, seed, truncate)
   - Auth helper (admin/manager/teacher token yaratish)
3. E2E scenario'lar:
   - Full user journey: Admin login → create Manager → Manager creates Teacher → Teacher creates student → assign to class
   - Permission tests: har bir endpoint uchun 403 scenarios
   - Rate limiting tests
   - Event-driven: create user → check audit log → check telegram queue
4. Unit test coverage:
   - Services ≥ 80%
   - Guards ≥ 90%
   - Critical utils 100%
5. Code coverage report (HTML + terminal)
6. GitHub Actions workflow:
   - Install, lint, build, test (unit + e2e), coverage upload
7. @code-reviewer to'liq review:
   - N+1 query'lar
   - Transaction'lar noto'g'ri ishlatish
   - Sensitive data exposure
   - Error handling

**Acceptance:**
- `npm run test` — 0 failure
- `npm run test:e2e` — 0 failure
- Coverage ≥ 70% jami, critical path 90%+
- CI yashil
- Git commit: `test: add comprehensive test suite with ci pipeline`

---

## 🚢 BOSQICH 9: Production deployment

**Maqsad:** Production-ready Docker, Caddy, backup.

**Kim:** @devops-specialist + @auth-security-expert

**Bajariladigan ishlar:**
1. `docker-compose.prod.yml`:
   - Multi-service: api, bot, worker, postgres, redis, rabbitmq, caddy
   - Resource limits (memory, cpu)
   - Restart policies
   - Healthchecks har bir servis uchun
   - Volumes (persistent data)
2. `Dockerfile` optimizatsiya:
   - Multi-stage (dependencies → build → runtime)
   - Non-root user
   - Cache layer optimization
3. Alohida `Dockerfile.bot` va `Dockerfile.worker` (asosiydan kichikroq)
4. `Caddyfile`:
   - Auto SSL (Let's Encrypt)
   - Reverse proxy `/api/*` → api servis
   - Rate limiting
   - Security headers (HSTS, X-Frame-Options, CSP)
   - Access log (JSON)
5. Environment:
   - `.env.prod.example` (aniq nusxa .env.example'dan, qiymatlarsiz)
   - README'da secrets management bo'yicha maslahat
6. Backup strategiyasi:
   - `scripts/backup.sh` — kunlik pg_dump + gzip + rotate (30 kun)
   - Cron misoli
7. Monitoring:
   - Structured logs (JSON, pino)
   - `/health` endpoint
   - `/metrics` endpoint (Prometheus format — Phase 2'ga asos)
8. Deployment qo'llanma (DEPLOYMENT.md):
   - Prerequisites
   - First-time deploy
   - Update workflow
   - Rollback procedure
   - Troubleshooting

**Acceptance:**
- `docker compose -f docker-compose.prod.yml up -d` ishlaydi
- HTTPS avtomatik ishlaydi (lokal test qilib bo'lmaydi, lekin konfig to'g'ri)
- Backup skript ishlab baza nusxasini yaratdi
- Git commit: `chore(devops): add production-ready docker and caddy setup`

---

## 📚 BOSQICH 10: Dokumentatsiya

**Maqsad:** README, Swagger, ADR, CHANGELOG.

**Kim:** @docs-writer

**Bajariladigan ishlar:**
1. `README.md`:
   - Loyiha tavsifi (3-4 qator)
   - Stack badgelar
   - Quick start (local dev)
   - Arxitektura diagrammasi (ASCII yoki mermaid)
   - Barcha npm scriptlar tushuntirilgan
   - Environment variables jadvali
   - Tests, Linting
   - Deployment havolasi
2. `DEPLOYMENT.md` (BOSQICH 9 da yaratilgan, kengaytirish)
3. `docs/adr/` — Architecture Decision Records:
   - `001-why-nestjs.md`
   - `002-why-rabbitmq-over-bull.md`
   - `003-why-caddy-over-nginx.md`
   - `004-refresh-token-rotation.md`
   - `005-soft-delete-strategy.md`
4. `CHANGELOG.md` — `0.1.0 — MVP Initial Release` bilan boshla
5. `CONTRIBUTING.md` — agar jamoa bilan ishlansa
6. Swagger to'liq:
   - Title, description, version
   - All endpoints dokumentlangan (summary, description, examples)
   - Auth schema (Bearer)
   - API accessible at `/api/docs` (faqat dev/staging)
7. Har bir muhim funksiya ustida JSDoc comment

**Acceptance:**
- Yangi developer README'ni o'qib 30 daqiqada loyihani ishga tushira oladi
- `/api/docs` hammasi yozilgan
- Git commit: `docs: add comprehensive documentation and adrs`

---

## 🎯 YAKUNIY ACCEPTANCE CRITERIA

Barcha bosqichlar tugagandan keyin tekshir:

- [ ] `git log --oneline` — 11 ta clean commit (Conventional Commits)
- [ ] `npm run build` — xatosiz
- [ ] `npm run test` — barcha testlar yashil
- [ ] `npm run test:e2e` — barcha e2e testlar yashil
- [ ] `npm run lint` — xatosiz
- [ ] Coverage ≥ 70%
- [ ] `docker compose -f docker-compose.dev.yml up -d && npm run start:dev` — ishladi
- [ ] `GET /health` — `{ status: 'ok' }`
- [ ] `POST /auth/login` admin bilan — access + refresh token qaytardi
- [ ] Full user journey (admin → manager → teacher → student → class) ishladi
- [ ] Telegram bot `/start` javob beradi (bot token bo'lsa)
- [ ] `GET /api/docs` — Swagger to'liq
- [ ] README, CHANGELOG, ADR'lar mavjud
- [ ] `.env.example` va `.env.prod.example` to'liq
- [ ] `.gitignore` `.env*` ni bloklaydi (faqat `.env.example` emas)

---

## 📞 Menga qachon murojaat qilish kerak

Claude, quyidagi holatlarda menga TO'XTAB so'ra:
1. Paket o'rnatishda xatolik (versiya konflikti)
2. Muhim arxitektura qarori (TZ'da aniqlik yo'q)
3. Test muntazam ishlamasa (flaky test)
4. Biror agent noto'g'ri ishlab, to'g'rilash kerak bo'lsa
5. Bosqich 6 oldidan — Telegram bot token menda bor, kiritish uchun

QUYIDAGI holatlarda TO'XTAMA:
- Kichik kod stili qarorlari
- Naming variants
- Qaysi test library ishlatish
- Comment yozish / yozmaslik
- Inline vs separate file

## Hisobot formati

Har bir bosqich tugaganda quyidagicha yoz:

```
✅ BOSQICH N: [Nom] — TUGALLANDI

• Ishlatilgan agentlar: @xxx, @yyy
• Yangi fayllar: N
• O'zgargan fayllar: M
• Test coverage: X%
• Commit: abc1234 — "feat(xxx): ..."

Keyingi: BOSQICH N+1
```

---

BOSHLA. CLAUDE.md'ni o'qib, `/agents list` bilan agentlarni tekshirgandan
keyin BOSQICH 0 dan boshla.
```

---

## 💡 Qo'shimcha maslahatlar

### Promptni ishga tushirgandan keyin

**Kutiladigan vaqt:** 2-6 soat (Claude Code tezligiga bog'liq)

**Kuzatish:** Ekrandan ko'z uzmang. Auto-accept yoqilgan bo'lsa ham:
- Kritik qaror kerak bo'lsa Claude to'xtaydi
- Paket o'rnatishda xatolik bo'lishi mumkin
- Xotira yetarli bo'lmasa test muntazam ishlamasligi mumkin

### Agar biror bosqich bajarilmasa

```bash
# O'sha bosqichdan davom ettirish uchun
claude
> BOSQICH 5 dan davom et. Avvalgi bosqichlar (0-4) tugallangan va commit qilingan.
> CLAUDE.md va tugallangan qismlarni tekshirib ko'r, so'ng davom et.
```

### Agar jarayon to'xtasa (chiqib ketilsa)

Claude Code har bir bosqichdan keyin commit qiladi. Shuning uchun:

```bash
# Joriy holatni tekshir
git log --oneline

# Yangi session'da davom ettir
claude
> Joriy git holatimni ko'r. Qaysi bosqichlar tugallangan? Keyingisidan davom et.
```

### Test qilmasdan ishonmang

Har bir bosqich tugagandan keyin **majburiy ravishda** quyidagilarni tekshiring:

```bash
# 1. Build
npm run build

# 2. Testlar
npm run test

# 3. Local ishga tushirish
docker compose -f docker-compose.dev.yml up -d
npm run start:dev

# 4. Health check
curl http://localhost:3000/health

# 5. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nis.uz","password":"SizningParolingiz"}'
```

### Xavfsizlik: menga ma'lum ma'lumotlarni qo'yma

Promptni ishlatishdan **oldin**:
- `.env` faylda real parollarni qo'yma, `.env.example` da bo'sh joy bo'lsin
- Telegram bot tokenni Claude Code'ga **to'g'ridan-to'g'ri** bering (terminal orqali), kodda qattiq yozmasin
- Jenkin, SSH, database kredentsialni hech qachon kodda qoldirmasin

### Muhim ogohlantirish

Agar Claude Code biror bosqichda siz xohlamagan narsani qilib qo'ysa:

```
> Men BOSQICH 5 da qilingan ishdan mamnun emasman. [Tushuntirib bering nima
> yomon]. Keyingi amallarni bekor qil va qaytadan qil.
```

Git tarixidan orqaga qaytish (agar kerak bo'lsa):

```bash
git log --oneline         # Commit hash topib oling
git reset --hard HEAD~1   # Oxirgi commit'ni bekor qilish
```

---

## 🎓 Nima uchun bu yondashuv ishlaydi

1. **Aniq bosqichlar** — Claude Code haddan ziyod katta tasksiz ishlaydi
2. **Agent orkestratsiyasi** — har bir bosqichda eng mos ekspert ishlaydi
3. **Acceptance criteria** — hech qanday bosqich to'liq bajarilmasdan keyingisiga o'tmaydi
4. **Commit per stage** — muammo bo'lsa orqaga qaytish oson
5. **Self-verification** — har bosqich oxirida build + test tekshiriladi
6. **User checkpoint** — faqat muhim qarorlarda to'xtaydi

---

**Eslatma:** Bu promptni o'zingizga moslash mumkin. Masalan, agar biror bosqichni oldin ishlagan bo'lsangiz, uni olib tashlang. Agar qo'shimcha funksiya kerak bo'lsa (masalan, e-mail module), o'zingiz qo'shing.
