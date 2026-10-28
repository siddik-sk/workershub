# WorkConnect

WorkConnect is a full-stack local services booking platform. Customers discover verified professionals, request bookings, track the job lifecycle and leave reviews. Workers manage their public profile, availability and incoming jobs. Administrators approve workers, manage users, categories and bookings, and monitor platform activity from real database-backed analytics.

The application is not a static demo: accounts, sessions, bookings, notifications, reviews and analytics are persisted in MongoDB and all role permissions are enforced by the API.

## Features

### Customers
- Search approved professionals with filters for trade, city, locality, experience, price, rating and availability.
- View public worker profiles, services, service areas, reviews and starting charges.
- Create booking requests with date, time, address, contact details and notes.
- Track live status history (`Pending → Accepted → In Progress → Completed`).
- Cancel eligible bookings with a reason.
- Review completed jobs once; worker ratings and completed job counts update automatically.
- Persistent notifications with unread badges, mark-one-read and mark-all-read.
- Update contact details and change password.

### Workers
- Apply with a professional profile; new profiles require administrator approval before appearing publicly.
- Dashboard with real request, active job, completed job, review and estimated-earnings figures.
- Accept, decline, start, complete and (when permitted) cancel bookings.
- Edit profile, services, service areas, charge, bio and profile photo.
- Configure weekly availability, working hours and booking acceptance.
- Receive real-time booking notifications while online and persistent notifications while offline.

### Administrators
- Sign in through the standard `/login` page; there is no separate administrator login form.
- Dashboard analytics for 7, 30 and 90-day ranges using aggregated MongoDB data.
- Approve, reject or suspend workers, with reasons recorded in the audit log.
- Suspend, reactivate and inspect customer, worker and admin accounts.
- Create, update, activate and deactivate service categories.
- Inspect every booking, its timeline and participants; cancel bookings when necessary.
- Review immutable administrator audit entries and platform notifications.
- No public administrator registration exists. Admin accounts are created only from the server CLI.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, React Router 6, Tailwind CSS 3.4, Axios, Socket.IO client, Recharts, date-fns, lucide-react |
| Backend | Node.js, Express 4, MongoDB, Mongoose 8, Socket.IO, JWT (HTTP-only cookie), bcryptjs |
| Security | Helmet, CORS allowlist, express-rate-limit, express-validator, request sanitisation, Multer upload validation |
| Tooling | npm workspaces by folder, nodemon, concurrently |

## Project structure

```text
workershub/
├── client/                     React single-page application
│   ├── src/
│   │   ├── components/         Reusable UI, layout, booking and worker components
│   │   ├── context/            Auth, notifications, toast and Socket.IO providers
│   │   ├── hooks/              Document title and shared hooks
│   │   ├── pages/              Public, auth, customer, worker, admin, shared pages
│   │   ├── services/           Axios API client
│   │   └── utils/              Formatting, validation and icon helpers
│   ├── .env.example
│   └── vite.config.js          Dev proxy for /api, /uploads and /socket.io
├── server/                     Express API and Socket.IO server
│   ├── config/                 Environment and database setup
│   ├── controllers/            HTTP request handlers
│   ├── middleware/             Auth, RBAC, validation, uploads, errors, rate limits
│   ├── models/                 Mongoose schemas and indexes
│   ├── routes/                 API route definitions
│   ├── scripts/                Seed and administrator creation scripts
│   ├── services/               Business logic and serializers
│   ├── sockets/                Authenticated real-time notification namespace
│   ├── validators/             express-validator rule sets
│   ├── .env.example
│   └── app.js                  Express application
├── package.json                Root development scripts
└── README.md
```

## Requirements

- Node.js 20 or newer (Node 18 works, but 20+ is recommended)
- npm 9 or newer
- MongoDB 6 or newer, running locally or available as a MongoDB Atlas connection string

## Local setup

1. **Install dependencies**

   ```bash
   npm run install:all
   ```

2. **Create environment files**

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   Copy-Item client/.env.example client/.env
   ```

3. **Configure `server/.env`**

   At minimum set `MONGODB_URI`, a strong `JWT_SECRET` (32+ characters), `CLIENT_URL`, and the initial administrator credentials. Generate a secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Never commit `.env`; it is already ignored by Git.

4. **Seed the database**

   ```bash
   npm run seed
   ```

   This creates the ten default service categories, all database indexes, and the initial administrator defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD`. If `ADMIN_PASSWORD` is missing or weak, the script prints a generated temporary password once.

5. **Create or reset an administrator (optional)**

   ```bash
   npm run create-admin
   ```

   The script prompts for the password without echoing it. To update an existing administrator:

   ```bash
   npm --prefix server run create-admin -- --email admin@example.com --name "Platform Administrator" --update
   ```

   There is deliberately no public admin sign-up route.

6. **Start development**

   ```bash
   npm run dev
   ```

   | Service | URL |
   | --- | --- |
   | React app | http://localhost:5173 |
   | API | http://localhost:5000/api |
   | Health check | http://localhost:5000/api/health |
   | Socket.IO | http://localhost:5000/socket.io |

   Vite proxies `/api`, `/uploads` and `/socket.io` to the API server, so the browser uses a single origin in development.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port. Defaults to `5000`. |
| `NODE_ENV` | No | `development` or `production`. Production enables secure cookies and strict env checks. |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Signing secret, minimum 32 characters. |
| `JWT_EXPIRES_IN` | No | Customer/worker session lifetime. Defaults to `7d`. |
| `ADMIN_JWT_EXPIRES_IN` | No | Administrator session lifetime. Defaults to `12h`. |
| `CLIENT_URL` | Yes | Allowed frontend origin(s). Comma-separate multiple origins. |
| `ADMIN_NAME` | No | Initial administrator display name. |
| `ADMIN_EMAIL` | No | Initial administrator email used by `npm run seed`. |
| `ADMIN_PASSWORD` | No | Initial administrator password used by `npm run seed`. |
| `UPLOAD_MAX_BYTES` | No | Maximum profile-image size. Defaults to 2 MB. |

### Client (`client/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | API base path. Defaults to `/api`. Set an absolute API URL only when frontend and API are hosted on different origins. |
| `VITE_CURRENCY` | No | Currency symbol shown in prices. Defaults to `$`. |

## Booking lifecycle

```text
PENDING ──► ACCEPTED ──► IN_PROGRESS ──► COMPLETED
   │            │
   ├──► REJECTED└──► CANCELLED (before work starts)
   └──► CANCELLED
```

Rules enforced by the API and database:

- Only the assigned worker can accept, reject, start or complete a booking.
- Only the owning customer can cancel a pending request.
- Accepted bookings can be cancelled by the customer or worker only at least two hours before the appointment.
- In-progress and completed bookings cannot be cancelled.
- A completed booking can be reviewed once by its customer.
- Invalid transitions return `409 Conflict`.
- A partial unique index prevents the same worker from having two active bookings at the same date and time.

Every transition is appended to the booking's status history with the actor, note and timestamp. Notifications are written to MongoDB and pushed over an authenticated Socket.IO connection.

## API overview

All responses use `{ success, message?, data? }`; errors use `{ success: false, error: { code, message, details? } }`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Service and database health |
| `POST` | `/api/auth/register` | Public | Customer registration |
| `POST` | `/api/auth/register/worker` | Public | Worker application |
| `POST` | `/api/auth/login` | Public | Customer and administrator login |
| `POST` | `/api/auth/login/worker` | Public | Worker login |
| `GET` | `/api/auth/me` | Authenticated | Current session |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset |
| `POST` | `/api/auth/reset-password` | Public | Consume reset token |
| `PATCH` | `/api/auth/password` | Authenticated | Change password |
| `GET` | `/api/categories` | Public | Active service categories |
| `GET` | `/api/workers` | Public | Search approved, active workers |
| `GET` | `/api/workers/featured` | Public | Featured workers |
| `GET` | `/api/workers/:id` | Public | Worker public profile |
| `GET` | `/api/public/stats` | Public | Landing-page platform counts |
| `GET` | `/api/user/dashboard` | Customer | Customer dashboard |
| `PATCH` | `/api/user/profile` | Customer | Update customer profile |
| `POST` | `/api/bookings` | Customer | Create booking |
| `GET` | `/api/bookings/my` | Customer | List own bookings |
| `GET` | `/api/bookings/:id` | Participant/admin | Booking detail |
| `PATCH` | `/api/bookings/:id/cancel` | Customer | Cancel pending booking |
| `POST` | `/api/bookings/:id/review` | Customer | Review completed booking |
| `GET` | `/api/worker/dashboard` | Worker | Worker dashboard |
| `GET/PATCH` | `/api/worker/profile` | Worker | Read/update professional profile |
| `PATCH` | `/api/worker/availability` | Worker | Update availability |
| `GET` | `/api/worker/bookings` | Worker | Assigned bookings |
| `PATCH` | `/api/worker/bookings/:id/accept` | Worker | Accept request |
| `PATCH` | `/api/worker/bookings/:id/reject` | Worker | Decline request |
| `PATCH` | `/api/worker/bookings/:id/start` | Worker | Start accepted job |
| `PATCH` | `/api/worker/bookings/:id/complete` | Worker | Complete job |
| `PATCH` | `/api/worker/bookings/:id/cancel` | Worker | Cancel eligible job |
| `GET` | `/api/notifications` | Authenticated | Paginated notifications |
| `GET` | `/api/notifications/unread-count` | Authenticated | Unread badge count |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark one read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all read |
| `GET` | `/api/admin/dashboard` | Admin | Aggregated analytics |
| `GET` | `/api/admin/users` | Admin | Customer accounts |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Suspend/reactivate customer |
| `GET` | `/api/admin/workers` | Admin | Worker applications and profiles |
| `PATCH` | `/api/admin/workers/:id/approval` | Admin | Approve or reject worker |
| `PATCH` | `/api/admin/workers/:id/status` | Admin | Suspend or reactivate worker |
| `GET/POST/PATCH` | `/api/admin/categories...` | Admin | Category management |
| `GET` | `/api/admin/bookings` | Admin | All bookings and stats |
| `PATCH` | `/api/admin/bookings/:id/cancel` | Admin | Administrative cancellation |
| `GET` | `/api/admin/audit-logs` | Admin | Audit history |
| `GET` | `/api/admin/notifications` | Admin | Platform notifications |

## Security model

- Passwords are hashed with bcrypt (12 rounds) and never returned by the API.
- Sessions use a signed JWT stored in an HTTP-only, SameSite=Lax cookie; production cookies are `Secure`.
- `tokenVersion` invalidates existing sessions after password changes, suspensions and admin password resets.
- Middleware verifies the account still exists, is active and has the expected role on every protected request.
- Customer, worker and administrator routes are separated; resource-level checks prevent cross-account access.
- Pending, rejected and suspended workers are excluded from search, public profiles and new bookings.
- Login, registration and password-reset endpoints are rate-limited; the API has a global limit.
- Helmet security headers, an explicit CORS allowlist, request sanitisation and validation are applied.
- Uploads accept only JPEG, PNG or WebP up to the configured size; generated filenames are random.
- Password reset responses do not reveal whether an email exists. In non-production, the reset URL is returned for local testing because no email provider is configured.

## Production build and deployment

1. Build the React application:

   ```bash
   npm run build
   ```

2. Configure `server/.env` with `NODE_ENV=production`, a production MongoDB URI, a strong JWT secret and the public `CLIENT_URL` (for example `https://workconnect.example.com`).

3. Start the API:

   ```bash
   npm start
   ```

   When `client/dist` exists, Express serves the built SPA and falls back to `index.html` for client-side routes, so one Node process can host both the API and frontend behind a reverse proxy.

4. Recommended production setup:
   - Run behind HTTPS (Nginx, Caddy, a cloud load balancer or a platform proxy).
   - Set `CLIENT_URL` to the exact HTTPS origin; secure cookies require HTTPS in production.
   - Persist `server/uploads` on a volume or move uploads to object storage.
   - Back up MongoDB and restrict database network access.
   - Rotate the seeded administrator password and every credential in `.env`.
   - Use a process manager such as PM2, systemd or a container orchestrator.

## Available scripts

| Command | Action |
| --- | --- |
| `npm run install:all` | Install root, server and client dependencies |
| `npm run dev` | Run API and Vite client together |
| `npm start` | Start the API server |
| `npm run build` | Build the production client |
| `npm run seed` | Create categories, indexes and the initial admin |
| `npm run create-admin` | Create or update an administrator interactively |

## Verification checklist

- `GET /api/health` returns `database: "connected"`.
- Register a customer, search for an approved worker and create a booking.
- Sign in as the worker in a separate browser profile or after logging out; accept, start and complete the job.
- Confirm the customer receives persistent and real-time notifications at each step.
- Review the completed booking and confirm the worker rating updates.
- Sign in as the administrator and verify analytics, worker approval, user management, categories, bookings and audit logs.
- Attempt cross-role URLs and direct API calls with another role's cookie; all should return `403` or `404`.
- Attempt an invalid booking transition (for example, completing a pending booking) and confirm a `409` response.

## License

This project is provided for demonstration and educational use. Review licensing and compliance requirements before commercial deployment.
