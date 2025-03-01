const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const pollRoutes = require('./src/routes/pollRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'));

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('vote', (pollId) => {
    socket.broadcast.emit('updatePoll', pollId); // Notify all other clients
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});

app.use('/', pollRoutes(io)); // Pass io to routes

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
