const Application = PIXI.Application;
const Sprite = PIXI.Sprite;
const Assets = PIXI.Assets;

const socket = io("ws://localhost:6969");
socket.on("connect", () => {
  console.log("socket", socket.id, "connected");
});

// BASIC SETUP
const app = new Application({
  width: 500,
  height: 500,
  transparent: false,
  antialias: true,
});

const background = await Assets.load("images/img.jpg");
const backgroundSprite = Sprite.from(background);
backgroundSprite.x = 0;
backgroundSprite.y = 0;
backgroundSprite.scale.set(2, 2);

app.renderer.background.color = "#23395D";
app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.view.style.position = "absolute";

const Graphics = PIXI.Graphics;
const sample = new Graphics();
sample.beginFill(0xffffff).drawRect(0, 0, 200, 2000).endFill();

// ADDING PLAYER FIRST SO I CAN PUT COORDINATESTEXT
const playerTexture = await Assets.load("images/player.png");
const player = Sprite.from(playerTexture);
player.scale.set(2, 2);
player.anchor.set(0.5, 0.5);
let health = 100;

// DRAW UI ELEMENTS
const coordinatesText = new PIXI.Text("x: " + player.x + " y: " + player.y, {
  fontFamily: "Arial",
  fontSize: 30,
  fill: 'ffffff',
});
coordinatesText.x = 0;
coordinatesText.y = 0;

setInterval(() => {
  coordinatesText.text = "x:" + player.x + "y: " + player.y;
}, 100);

const socketText = new PIXI.Text("SOCKET ID: " + socket.id, {
  fontFamily: "Arial",
  fontSize: 10,
  fill: 'ffffff',
});
socketText.x = 0;
socketText.y = 0;

const inventory = new Graphics();
inventory.lineStyle({width: 2, color: 0x000000, alpha: 0.5});
inventory.beginFill(0x222222);
inventory.drawRoundedRect(0, 0, 500, 55, 5);
inventory.endFill();
inventory.x = 0;
inventory.y = 0;

const healthBar = new Graphics();
healthBar.lineStyle({width: 2, color: 0x000000, alpha: 0.5});
healthBar.beginFill(0x222222);
healthBar.drawRoundedRect(0, 0, 500, 30, 5);
healthBar.endFill();
healthBar.x = 0;
healthBar.y = 0;

const healthBarValue = new Graphics();
healthBarValue.beginFill(0x13EA22);
healthBarValue.drawRoundedRect(0, 0, 500, 30, 5);
healthBarValue.endFill();
healthBarValue.x = 0;
healthBarValue.y = 0;

const shieldBar = new Graphics();
shieldBar.lineStyle({width: 3, color: 0x000000, alpha: 0.3});
shieldBar.beginFill(0x0198EF);
shieldBar.drawRoundedRect(0, 0, 500, 25, 5);
shieldBar.endFill();
shieldBar.x = 0;
shieldBar.y = 0;

// CHANGING PROPERTIES
const mouse = {
  x: 0,
  y: 0,
};

const camera = {
  x: app.renderer.width / 2,
  y: app.renderer.height / 2,
};

const keyboard = {
  w: false,
  a: false,
  s: false,
  d: false,
  shift: false,
};

// EVENT LISTENERS
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mousedown", handleMouseDown);

// KEY EVENT HANDLER FUNCTIONS
function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (keyboard.hasOwnProperty(key)) {
    keyboard[key] = true;
  }
}

function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  if (keyboard.hasOwnProperty(key)) {
    keyboard[key] = false;
  }
}

function handleMouseMove(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

// PLAYERS
const enemySprites = {}; // Stores the other player sprites

const enemyTexture = await Assets.load("images/enemies.png");
function renderPlayer(enemyData) {
  if (!enemySprites[enemyData.id]) {
    // Create a new PIXI sprite for the player
    const enemySprite = Sprite.from(enemyTexture);
    enemySprite.scale.set(2, 2);
    enemySprite.anchor.set(0.5, 0.5);
    app.stage.addChild(enemySprite);
    enemySprites[enemyData.id] = enemySprite;
  }

  const enemySprite = enemySprites[enemyData.id];
  enemySprite.x = enemyData.x;
  enemySprite.y = enemyData.y;
  enemySprite.rotation = enemyData.rotation;
}

socket.on("clientUpdateAllEnemies", (enemies) => {
  const connectedEnemyIds = Object.keys(enemies);
  // Iterate over the existing player sprites
  for (const enemyId in enemySprites) {
    // Check if the player is still connected
    if (!connectedEnemyIds.includes(enemyId)) {
      // Player is disconnected, remove the sprite
      const enemySprite = enemySprites[enemyId];
      app.stage.removeChild(enemySprite);
      delete enemySprites[enemyId];
    }
  }

  for (const enemyId in enemies) {
    const enemyData = enemies[enemyId];
    renderPlayer(enemyData);
  }
});

let boundingBoxes = {};

socket.on("clientUpdateSelf", (playerData) => {
  console.log(playerData.health);
  if (playerData.health < 100) {
    healthBarValue.width = playerData.health * 5;
  }

  player.x = playerData.x;
  player.y = playerData.y;
  player.rotation = playerData.rotation;
  health = playerData.health;

  if (!boundingBoxes[playerData.id]) {
    const boundingBox = new Graphics();
    boundingBox.lineStyle({ width: 1, color: 0x00FF00, alpha: 1 });
    boundingBox.drawRect(-playerData.width / 2, -playerData.height / 2, playerData.width, playerData.height);
    app.stage.addChild(boundingBox);
    boundingBoxes[playerData.id] = boundingBox;
  }

  const boundingBox = boundingBoxes[playerData.id];
  boundingBox.x = playerData.x;
  boundingBox.y = playerData.y;
  boundingBox.width = playerData.width;
  boundingBox.height = playerData.height;

  console.log(
    playerData.x,
    playerData.y,
    playerData.width,
    playerData.height
  );
});

// BULLETS
let bulletSprites = [];
const bulletSpeed = 100;

const bulletTexture = await Assets.load("images/bullet.png");

let isMouseDown = false;
let emitIntervalId = null;

function handleMouseDown(event) {
  isMouseDown = true;
  emitBulletsContinuously();
}

function handleMouseUp(event) {
  isMouseDown = false;
  clearInterval(emitIntervalId);
}

function emitBullet() {
  const offsetFactor = 70; // Adjust this value to control the offset
  
  socket.emit("serverUpdateNewBullet", {
    id: Math.random(),
    x: player.x + Math.cos(player.rotation - Math.PI/2) * offsetFactor,
    y: player.y + Math.sin(player.rotation - Math.PI/2) * offsetFactor,
    width: 40, // width and height really rough estimate of the bullet size. real range 35-45 (idk why)
    height: 40,
    rotation: player.rotation - Math.PI/2,
  });
}

function emitBulletsContinuously() {
  emitBullet(); // Emit the first bullet immediately
  
  // Start emitting bullets continuously at a fixed interval
  emitIntervalId = setInterval(() => {
    if (isMouseDown) {
      emitBullet();
    } else {
      clearInterval(emitIntervalId);
    }
  }, 100); // Adjust the interval as needed
}

// Attach event listeners
document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);


socket.on("clientUpdateNewBullet", (bulletData) => {
  const bullet = Sprite.from(bulletTexture);
  bullet.scale.set(1, 1);
  bullet.anchor.set(0.5, 0.5);
  bullet.x = bulletData.x;
  bullet.y = bulletData.y;
  bullet.width = bulletData.width;
  bullet.height = bulletData.height;
  bullet.rotation = bulletData.rotation;
  app.stage.addChild(bullet);
  bulletSprites.push(bullet);
});

socket.on("updateAllBullets", (bulletsData) => {
  Object.keys(bulletsData).forEach((bulletId) => {
    if (!boundingBoxes[bulletId]) {
      const boundingBox = new Graphics();
      boundingBox.lineStyle({width: 1, color: 0x00FF00, alpha: 1});
      boundingBox.drawRect(-bulletsData[bulletId].width / 2, -bulletsData[bulletId].height / 2, bulletsData[bulletId].width, bulletsData[bulletId].height);
      app.stage.addChild(boundingBox);
      boundingBoxes[bulletId] = boundingBox;
    }

    const boundingBox = boundingBoxes[bulletId];
    boundingBox.x = bulletsData[bulletId].x;
    boundingBox.y = bulletsData[bulletId].y;
    boundingBox.width = bulletsData[bulletId].width;
    boundingBox.height = bulletsData[bulletId].height;
  });
});

// NOTIFICATIONS
let notifications = [];

const notificationContainer = new PIXI.Container();
let notificationOffsetY = 0;

function notification(text) {
  const notificationBar = new Graphics();
  notificationBar.beginFill(0x000000, 0.5);
  notificationBar.drawRoundedRect(0, 0, 400, 30, 5);
  notificationBar.endFill();
  notificationBar.x = -5;
  notificationBar.y = notificationOffsetY;

  const notification = new PIXI.Text(text, {
    fontFamily: "Arial",
    fontSize: 20,
    fill: "white",
    align: "center",
  });
  notification.x = 0;
  notification.y = notificationOffsetY;

  notificationOffsetY += 40; // Increase the offset for the next notification

  notificationContainer.addChild(notificationBar);
  notificationContainer.addChild(notification);

  setTimeout(() => {
    notificationContainer.removeChild(notification);
    notificationContainer.removeChild(notificationBar);

    // Adjust the position of remaining notifications
    notificationOffsetY -= 40;
    notificationContainer.children.forEach((child) => {
      child.y -= 40;
    });
  }, 3000);
}



socket.on("notification", (text) => {
  notification(text);
});

// MAIN GAME LOOP
app.ticker.add(() => {
  socket.emit("serverUpdateSelf", {
    id: socket.id,
    health: health,
    x: player.x,
    y: player.y,
    width: 50,
    height: 50,
    rotation: Math.atan2(
      mouse.y - app.renderer.height / 2,
      mouse.x - app.renderer.width / 2
    ) + Math.PI / 2, //2 * Math.PI
    keyboard: keyboard,
  });

  for (var b = bulletSprites.length - 1; b >= 0; b--) {
    bulletSprites[b].x += Math.cos(bulletSprites[b].rotation) * bulletSpeed;
    bulletSprites[b].y += Math.sin(bulletSprites[b].rotation) * bulletSpeed;
  }

  // Adjust the camera position to keep the player in the middle
  camera.x = player.x;
  camera.y = player.y;
  app.stage.position.x = app.renderer.width / 2 - camera.x;
  app.stage.position.y = app.renderer.height / 2 - camera.y;

  // Shift UI elements with Camera
  coordinatesText.x = camera.x;
  coordinatesText.y = camera.y;

  socketText.x = camera.x + 765;
  socketText.y = camera.y + 460;

  inventory.x = camera.x - 250;
  inventory.y = camera.y + 400;

  healthBar.x = camera.x - 925;
  healthBar.y = camera.y + 430;

  healthBarValue.x = camera.x - 925;
  healthBarValue.y = camera.y + 430;

  shieldBar.x = camera.x - 925;
  shieldBar.y = camera.y + 400;

  notificationContainer.x = camera.x + 550;
  notificationContainer.y = camera.y - 420;
});

// DISPLAY ON CANVAS
document.body.appendChild(app.view);
app.stage.addChild(backgroundSprite);
app.stage.addChild(player);
app.stage.addChild(sample);
app.stage.addChild(socketText);
app.stage.addChild(inventory);
app.stage.addChild(healthBar);
app.stage.addChild(healthBarValue);
app.stage.addChild(shieldBar);
app.stage.addChild(coordinatesText);
app.stage.addChild(notificationContainer);
