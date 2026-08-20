# 🎫 EventPulse — Real-Time Event & Ticketing System

A full-stack MERN application for managing event registrations, issuing secure QR-code tickets, and tracking venue capacity in real time. Built around Role-Based Access Control (RBAC) and hardware-integrated ticket scanning for on-site check-in.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?style=flat&logo=jsonwebtokens)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Tech Stack](#️-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Key Design Decisions](#️-key-design-decisions)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🔎 Overview

EventPulse solves a concrete logistics problem: an Organizer creates an event with a fixed capacity, Attendees register and receive a unique QR-coded ticket, and Volunteers scan tickets at the door using a device camera — with every successful check-in pushed live to the Organizer's dashboard via WebSockets, no refresh required. Capacity is enforced atomically at the database layer to prevent overbooking under concurrent registrations.

---

## ✨ Core Features

- **Real-Time Capacity Dashboard** — WebSockets (`socket.io`) push check-in events to the Organizer's dashboard the instant a ticket is scanned, scoped per-event via Socket.io rooms.
- **Role-Based Access Control (RBAC)** — Backend middleware and protected client routes enforce strict boundaries across three roles: `Organizer`, `Attendee`, `Volunteer`.
- **Hardware-Integrated QR Scanning** — Camera-based ticket validation via `html5-qrcode`, with a manual entry fallback for hardware failures or damaged codes.
- **Atomic, Overbooking-Safe Registration** — Ticket booking runs inside a MongoDB multi-document transaction, so concurrent requests for the last available seat can't both succeed.
- **Secure Authentication Pipeline** — Client-side schema validation (`Zod`), server-side bcrypt password hashing, and stateless JWT-based authorization with a rate-limited auth surface.
- **Self-Service Password Reset** — One-time, time-boxed, cryptographically random reset tokens (hashed at rest, never stored in plaintext).

---

## 🛠️ Tech Stack

**Frontend**
| Tool | Purpose |
|---|---|
| React 19 + Vite | UI component architecture, fast dev server |
| Tailwind CSS | Utility-first responsive styling |
| Zustand | Lightweight global state (auth/session) |
| React Router | Client-side routing + protected routes |
| Zod | Schema-based form validation |
| Axios | HTTP client with a global JWT interceptor |
| html5-qrcode / qrcode.react | Camera-based scanning / QR generation |
| Socket.io-client | Live dashboard updates |

**Backend**
| Tool | Purpose |
|---|---|
| Node.js + Express 5 | REST API |
| MongoDB + Mongoose | Document data store, referenced schemas |
| Socket.io | Bi-directional real-time layer |
| JSON Web Tokens | Stateless auth |
| bcryptjs | Password hashing |
| express-rate-limit | Brute-force protection on auth routes |
| Nodemailer | Password-reset email delivery |

---

## 🏗️ System Architecture

```
Browser (React SPA)
   │  Axios (JWT in Authorization header)      │  Socket.io-client
   ▼                                            ▼
Express API ── rate-limit → auth → RBAC → route handler
   │
   ├── Mongoose ODM ──► MongoDB (Users / Events / Registrations)
   └── Socket.io server ──► per-event rooms ──► live dashboard pushes
```

- **HTTP** handles all request/response operations (auth, CRUD, ticket booking, scanning).
- **WebSockets** handle exactly one thing HTTP can't do well: the server pushing a check-in event to a dashboard without being polled.
- **Registration** acts as the many-to-many join between `User` and `Event`, carrying its own state (`qrId`, `status`, `checkInTime`).

---

## 📂 Project Structure

```
event-logistics-attendees/
├── backend/
│   ├── config/          # DB connection
│   ├── middleware/       # protect (JWT) + authorize (RBAC)
│   ├── models/           # User, Event, Registration schemas
│   ├── routes/           # auth, events, registrations
│   ├── utils/             # email sending
│   └── server.js          # Express + Socket.io bootstrap
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance + interceptors
    │   ├── components/     # Navbar, ProtectedRoute, etc.
    │   ├── pages/           # Login, Dashboards, Scanner
    │   └── store/            # Zustand auth store
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/debayan0203/event-logistics-attendees.git
cd event-logistics-attendees
```

### 2. Configure environment variables
See [Environment Variables](#-environment-variables) below.

### 3. Install & run

**Terminal 1 — Backend**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

The API runs on `http://localhost:5000`, the client on `http://localhost:5173`.

---

## 🔐 Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key

# Email (for password reset)
SMTP_HOST=
SMTP_PORT=
SMTP_EMAIL=
SMTP_PASSWORD=
```

> ⚠️ Never commit `.env`. Use a long, random `JWT_SECRET` — anyone with this value can forge valid tokens for any role.

---

## 📡 API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new account |
| `POST` | `/api/auth/login` | Public | Authenticate, receive JWT |
| `POST` | `/api/auth/forgotpassword` | Public | Request a reset email |
| `PUT` | `/api/auth/resetpassword/:token` | Public | Set a new password |
| `GET` | `/api/events` | Public | List all events |
| `GET` | `/api/events/stats` | Organizer | Aggregate capacity/check-in stats |
| `POST` | `/api/events` | Organizer | Create an event |
| `POST` | `/api/registrations/:eventId` | Attendee | Book a ticket (transactional) |
| `GET` | `/api/registrations/my-tickets` | Attendee | List the caller's tickets |
| `PUT` | `/api/registrations/scan/:qrId` | Volunteer, Organizer | Validate & check in a ticket |

**Socket.io events**
| Event | Direction | Payload |
|---|---|---|
| `join-event` | Client → Server | `eventId` — subscribe to an event's room |
| `newCheckIn` | Server → Client | `{ attendeeName }` — broadcast on successful scan |

---

## ⚙️ Key Design Decisions

- **Stateless JWT with embedded role** — `role` is signed into the token payload, so `authorize()` middleware never needs a database round trip to check permissions.
- **Atomic capacity enforcement** — ticket booking (read capacity → check existing registration → write) runs inside a MongoDB session/transaction, closing the race window where two concurrent bookings could both see an open seat.
- **Referenced, not embedded, schemas** — `Registration` stores `ObjectId` references to `User`/`Event` rather than nesting data, since registrations can scale into the thousands per event and need to be queried independently (e.g., "all my tickets across every event").
- **Component lifecycle discipline** — hardware-facing components (camera scanner, socket connections) release resources in `useEffect` cleanup functions, preventing dangling media streams and socket leaks across re-renders.

---

## 🗺️ Roadmap

- [ ] Authenticate the Socket.io handshake (currently any client can join any event's room)
- [ ] Scope CORS to known frontend origin(s) instead of `*`
- [ ] Atomic conditional update (`findOneAndUpdate`) on the scan route to close a check-in race window
- [ ] Server-side pagination for `GET /events` and `GET /my-tickets`
- [ ] `tokenVersion` claim for immediate JWT revocation on password change

---

## 📄 License

MIT — free to use, modify, and distribute.
