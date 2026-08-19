const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// FinTech Security: Rate limiter to protect auth routes from brute-force/DDoS
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Wrap Express with HTTP and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});

// Make 'io' available inside your routes
app.set('io', io);

// Updated Socket.io Room Logic
io.on('connection', (socket) => {
  console.log(`Client connected for live updates: ${socket.id}`);

  socket.on('join-event', (eventId) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined room for event: ${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Apply rate limiter specifically to auth routes
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));