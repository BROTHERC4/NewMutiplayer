// public/game/network.js

export class NetworkManager {
  constructor() {
    // When deployed, connect to the server domain
    // For local development, just use io()
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Add connection options for mobile
    const options = {
      reconnectionAttempts: 5,
      timeout: 10000, // Longer timeout for mobile connections
      transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
    };
    
    this.socket = isLocalhost ? io(options) : io(window.location.origin, options);
    this.players = {};
    this.playerId = null;
    this.onCurrentPlayers = null;
    this.onNewPlayer = null;
    this.onPlayerMoved = null;
    this.onPlayerDisconnected = null;
    
    // Add connection state tracking
    this.connected = false;
    this.connectionError = false;
    
    this.setupEvents();
  }
  
  setupEvents() {
    // When we connect to the server
    this.socket.on('connect', () => {
      this.playerId = this.socket.id;
      this.connected = true;
      this.connectionError = false;
      console.log('Connected to server with ID:', this.playerId);
    });
    
    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectionError = true;
      this.showConnectionError();
    });
    
    // When we receive the current players
    this.socket.on('currentPlayers', (players) => {
      this.players = players;
      if (this.onCurrentPlayers) {
        this.onCurrentPlayers(players);
      }
    });
    
    // When a new player joins
    this.socket.on('newPlayer', (playerData) => {
      this.players[playerData.id] = playerData;
      if (this.onNewPlayer) {
        this.onNewPlayer(playerData);
      }
    });
    
    // When a player moves
    this.socket.on('playerMoved', (playerData) => {
      this.players[playerData.id] = { 
        ...this.players[playerData.id], 
        ...playerData 
      };
      if (this.onPlayerMoved) {
        this.onPlayerMoved(playerData);
      }
    });
    
    // When a player disconnects
    this.socket.on('playerDisconnected', (playerId) => {
      delete this.players[playerId];
      if (this.onPlayerDisconnected) {
        this.onPlayerDisconnected(playerId);
      }
    });
  }
  
  showConnectionError() {
    if (document.getElementById('connection-error')) return;
    
    const errorMsg = document.createElement('div');
    errorMsg.id = 'connection-error';
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'Connection failed. Please check your internet connection and try again.';
    document.body.appendChild(errorMsg);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
      if (errorMsg.parentNode) {
        errorMsg.parentNode.removeChild(errorMsg);
      }
    }, 5000);
  }
  
  // Send player movement to the server
  sendPlayerMovement(position, rotation) {
    this.socket.emit('playerMovement', {
      x: position.x,
      y: position.y,
      z: position.z,
      rotationY: rotation.y
    });
  }
}