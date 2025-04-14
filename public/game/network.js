// public/game/network.js

export class NetworkManager {
  constructor() {
    this.socket = io();
    this.players = {};
    this.playerId = null;
    this.onCurrentPlayers = null;
    this.onNewPlayer = null;
    this.onPlayerMoved = null;
    this.onPlayerDisconnected = null;
    
    this.setupEvents();
  }
  
  setupEvents() {
    // When we connect to the server
    this.socket.on('connect', () => {
      this.playerId = this.socket.id;
      console.log('Connected to server with ID:', this.playerId);
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