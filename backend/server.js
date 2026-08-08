const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Wrap Express with HTTP and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite frontend
    methods: ["GET", "POST", "PUT"]
  }
});

// Make 'io' available inside your routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected for live updates');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));