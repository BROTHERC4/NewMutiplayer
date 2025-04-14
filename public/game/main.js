// public/game/main.js

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { NetworkManager } from './network.js';

export class Game {
  constructor() {
    this.networkManager = new NetworkManager();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.playerObjects = {};
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.prevTime = performance.now();
    
    // Initialize
    this.init();
  }
  
  init() {
    this.setupScene();
    this.setupNetworkCallbacks();
    this.setupEventListeners();
    this.animate();
  }
  
  setupScene() {
    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Create the camera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.y = 1.6; // Average eye height
    
    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Add pointer lock controls
    this.controls = new PointerLockControls(this.camera, document.body);
    
    // Create instruction screen
    this.createInstructions();
    
    // Add a floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x808080, 
      side: THREE.DoubleSide,
      wireframe: true
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light (like sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    this.scene.add(directionalLight);
  }
  
  createInstructions() {
    this.instructions = document.createElement('div');
    this.instructions.className = 'instructions';
    this.instructions.innerHTML = `
      <h2>Multiplayer FPS Game</h2>
      <p>Click to play</p>
      <p>WASD to move, Mouse to look around</p>
      <p>ESC to pause</p>
    `;
    document.body.appendChild(this.instructions);
    
    // Click to start game
    this.instructions.addEventListener('click', () => {
      this.controls.lock();
    });
    
    // Handle pointer lock changes
    this.controls.addEventListener('lock', () => {
      this.instructions.classList.add('hidden');
    });
    
    this.controls.addEventListener('unlock', () => {
      this.instructions.classList.remove('hidden');
    });
  }
  
  setupNetworkCallbacks() {
    // Handle current players
    this.networkManager.onCurrentPlayers = (players) => {
      Object.keys(players).forEach((id) => {
        if (id === this.networkManager.playerId) {
          // For the local player, just set the camera position
          this.camera.position.set(players[id].x, players[id].y + 1.6, players[id].z);
        } else {
          // Create objects for other players
          this.createPlayerObject(players[id]);
        }
      });
    };
    
    // Handle new players
    this.networkManager.onNewPlayer = (playerData) => {
      this.createPlayerObject(playerData);
    };
    
    // Handle player movements
    this.networkManager.onPlayerMoved = (playerData) => {
      if (this.playerObjects[playerData.id]) {
        const playerObject = this.playerObjects[playerData.id];
        playerObject.position.x = playerData.x;
        playerObject.position.y = playerData.y + 1; // Adjust to center of the object
        playerObject.position.z = playerData.z;
        playerObject.rotation.y = playerData.rotationY;
      }
    };
    
    // Handle player disconnections
    this.networkManager.onPlayerDisconnected = (playerId) => {
      if (this.playerObjects[playerId]) {
        this.scene.remove(this.playerObjects[playerId]);
        delete this.playerObjects[playerId];
      }
    };
  }
  
  createPlayerObject(playerData) {
    // Create a simple colored box for each player
    const geometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: playerData.color });
    const playerObject = new THREE.Mesh(geometry, material);
    
    playerObject.position.set(playerData.x, playerData.y + 1, playerData.z);
    playerObject.rotation.y = playerData.rotationY;
    
    this.scene.add(playerObject);
    this.playerObjects[playerData.id] = playerObject;
  }
  
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Handle keyboard controls
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
      }
    });
    
    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
  }
  
  updatePlayerPosition() {
    if (this.controls.isLocked === true) {
      const time = performance.now();
      const delta = (time - this.prevTime) / 1000;
      
      // Apply friction
      this.velocity.x -= this.velocity.x * 10.0 * delta;
      this.velocity.z -= this.velocity.z * 10.0 * delta;
      
      // Calculate direction
      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize();
      
      // Apply movement
      if (this.moveForward || this.moveBackward) {
        this.velocity.z -= this.direction.z * 20.0 * delta;
      }
      if (this.moveLeft || this.moveRight) {
        this.velocity.x -= this.direction.x * 20.0 * delta;
      }
      
      // Move the camera
      this.controls.moveRight(-this.velocity.x * delta);
      this.controls.moveForward(-this.velocity.z * delta);
      
      // Update the prevTime
      this.prevTime = time;
      
      // Send player position to server
      this.networkManager.sendPlayerMovement(
        this.camera.position,
        { 
          y: this.camera.rotation.y 
        }
      );
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.updatePlayerPosition();
    this.renderer.render(this.scene, this.camera);
  }
}
