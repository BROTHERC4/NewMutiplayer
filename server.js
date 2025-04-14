// server.js

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Create the Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected players
const players = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Create a new player
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 10 - 5,  // Random X position between -5 and 5
    y: 0,                       // Start at ground level
    z: Math.random() * 10 - 5,  // Random Z position between -5 and 5
    rotationY: 0,               // Initial rotation (looking forward)
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}` // Random color
  };
  
  // Send the current players to the new player
  socket.emit('currentPlayers', players);
  
  // Tell all other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  
  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].z = movementData.z;
    players[socket.id].rotationY = movementData.rotationY;
    
    // Broadcast the player's movement to all other players
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      x: players[socket.id].x,
      y: players[socket.id].y,
      z: players[socket.id].z,
      rotationY: players[socket.id].rotationY
    });
  });
  
  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});