# SNP Manpower backend

Standalone NestJS + Prisma backend using the modular structure of the reference backend. It provides API modules for authentication, user management, branch master, and registration applications. The registration API validates the named frontend form fields described in `src/registrations/registration-details.dto.ts` and stores the complete submitted form in the `Registration.details` JSON column; common search, status, fee, document, branch, and ownership fields are normalized.

## Setup

1. Install Node.js 20 or newer and PostgreSQL.
2. Create an ignored `.env` file; configure a PostgreSQL `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Configure the WhatsApp variables if OTP delivery is needed.
3. Install and initialize:

   ```powershell
   npm install
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```

4. To seed the administrator, run `npm run prisma:seed`. In non-production mode, the default test login is mobile `9876543210` with password `1234`; set `ADMIN_PASSWORD` in `.env` to override it. The test password is disabled in production, where `ADMIN_PASSWORD` must be at least 12 characters. Optionally override the mobile with `ADMIN_MOBILE`. Seeding creates or updates that account as an active administrator and resets its password.
5. Start with `npm run start:dev`. The API listens on port 3001 by default, with routes directly under `/` (for example, `/auth/login`). Set the frontend's ignored `.env` file to `VITE_API_URL=http://localhost:3001`. Legacy requests prefixed with `/api` are also accepted.

## API

- `POST /auth/login`, `POST /auth/login/otp`, `POST /auth/logout`, `GET /auth/me`
- `POST /whatsapp/otp/request` with `{ "mobile": "9817508855", "purpose": "CANDIDATE" | "EMPLOYEE" | "LOGIN" }`
- `POST /whatsapp/otp/verify` with `{ "mobile": "9817508855", "purpose": "CANDIDATE" | "EMPLOYEE" | "LOGIN", "code": "123456" }`
- `GET /branches` (active branches), administrator-only `GET /branches/all`, `POST /branches`, `PATCH /branches/:id`
- Administrator-only `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/active`, `DELETE /users/:id`
- Authenticated `GET /employees/:mobile` to look up an active employee and assigned branch
- Authenticated `POST /uploads/photo`, `/uploads/address-proof`, and `/uploads/bank-proof` with multipart field `file`
- Authenticated `GET /uploads/registration/:filename` to retrieve a saved registration document (previous `/api/uploads/registration/:filename` links remain supported)
- Authenticated `POST /registrations`, `GET /registrations/my-submissions`, `GET /registrations/:ref`
- Public `POST /registrations/track` requires both `ref` and candidate `mobile`; it returns only application and payment status.
- Administrator-only `GET /registrations`, `PATCH /registrations/:ref/review`, `DELETE /registrations/:ref`

Authentication uses an HTTP-only session cookie, with session records persisted in the PostgreSQL `user_sessions` table so a browser refresh or backend restart does not discard a valid login. The table is created automatically at startup. For browser requests, send credentials and configure `FRONTEND_URL`. `Registration.details` retains the complete form payload, including applicant identity, personal details, work/license history, vehicle records, addresses, proofs, employee verification, banking/UPI, family contacts, previous-customer details, and declaration. The contract lists every frontend field by name.

Registration references are assigned by the backend in `SNP-YYYYMMDD-NNNN` format. The daily serial starts at `0001` and increments atomically for each new application.

## WhatsApp templates

Set the WhatsApp Cloud API credentials and the exact approved template names in `.env`. Registration confirmation uses `WHATSAPP_REGISTRATION_TEMPLATE_LANGUAGE` when set, otherwise it uses `WHATSAPP_TEMPLATE_LANGUAGE`; the selected language must match a translation enabled for that exact template in Meta. The OTP template body must have one parameter (`{{1}}`, the six-digit OTP). Authentication templates with a URL/copy-code button also receive the OTP as button parameter 0 by default. Set `WHATSAPP_OTP_BUTTON_INDEX` to another button index if the approved template uses a different one, or set it to an empty value for a body-only template. The registration confirmation template must have three body parameters in this exact order:

1. Candidate name
2. Registration reference
3. Designation

Use the approved template text:

> *SNPNBC CONSULTANT & MANPOWER SERVICES*
>
> Hello {{1}}, your application #{{2}} for the position of {{3}} has been successfully confirmed. Thank you for registering with us!

The registration endpoint only accepts OTP challenges that were requested and verified through these backend endpoints, and consumes both candidate and employee verifications when saving. The registration confirmation template is sent to the candidate only after an administrator approves the application; the review API returns `confirmationStatus` (`SENT` or `FAILED`). The OTP lasts five minutes, allows five attempts, and has a 60-second per-number resend cooldown. The server does not expose OTPs in API responses.

Candidate photos and address/bank proof files are uploaded to the backend's ignored `uploads/registration` directory (or `UPLOADS_DIR/registration` when configured). Set `UPLOADS_PUBLIC_URL` in the backend `.env` to the externally reachable backend origin (for example, `http://localhost:3001`) to return absolute file links; when unset, upload responses contain relative URLs. The API accepts JPG/PNG and PDF proofs up to 2 MB, checks their file signatures, and serves files through authenticated `/uploads/registration/:filename` routes. Registration rows store the returned file URL and original filename rather than embedding binary data in PostgreSQL JSON. Requests using the old `/api` prefix are rewritten for compatibility.
