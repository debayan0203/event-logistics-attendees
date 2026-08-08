# 🎫 EventPulse: Real-Time Event & Ticketing System

A full-stack MERN application designed to manage event registrations, issue secure QR-code tickets, and track venue capacity in real-time. Built with a focus on Role-Based Access Control (RBAC) and hardware-integrated ticket scanning.

---

## ✨ Core Features

*   **Real-Time Capacity Dashboard:** Utilizes WebSockets (`socket.io`) to instantly update the Organizer's dashboard the millisecond a ticket is scanned at the door, completely eliminating the need for page refreshes.
*   **Role-Based Access Control (RBAC):** Secure routing and backend middleware enforcing strict data boundaries between three distinct user types: `Organizers`, `Attendees`, and `Volunteers`.
*   **Hardware-Integrated Scanning:** React-based QR code scanner that interfaces directly with device cameras to validate digital tickets on-site. Includes manual fallback for hardware failures.
*   **Secure Authentication:** End-to-end security pipeline featuring strict schema validation (`Zod`), password hashing (`bcrypt`), and stateless session authorization (`JWT`).

---

## 🛠️ Tech Stack

**Frontend (Client)**
*   **React (Vite):** UI component architecture
*   **Tailwind CSS:** Rapid, responsive styling
*   **Zustand:** Global state management (Auth state & user sessions)
*   **Zod:** Strict schema-based form validation
*   **Axios:** HTTP client with global JWT interceptors
*   **html5-qrcode:** Hardware camera integration for scanning

**Backend (Server)**
*   **Node.js & Express:** RESTful API architecture
*   **MongoDB & Mongoose:** NoSQL database with junction-table schemas
*   **Socket.io:** Persistent TCP connection for bi-directional live updates
*   **JSON Web Tokens (JWT):** Stateless endpoint protection
*   **Bcrypt:** Cryptographic password hashing

---

## 🚀 Local Development Setup

To run this project locally on your machine, follow these steps:

### 1. Clone the repository
git clone https://github.com/debayan0203/event-logistics-attendees.git
cd event-logistics-attendees

### 2. Environment Variables
Create a .env file in the backend directory and add the following:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key

### 3. Install Dependencies & Run
Open two separate terminal windows.

**Terminal 1 (Backend):**
cd backend

npm install

npm run dev

**Terminal 2 (Frontend):**
cd frontend

npm install

npm run dev

---

## 🏗️ Architecture & Design Decisions

*   **Stateless JWT Authentication:** By embedding the user's `role` directly into the signed JWT payload, the backend middleware can instantly authorize protected routes without needing to query the database, reducing latency and database load.
*   **Component Lifecycle Management:** Hardware components (like the camera scanner) strictly utilize `useEffect` cleanup functions to unmount the media stream, preventing memory leaks and hardware lockups often caused by React's Virtual DOM updates.
