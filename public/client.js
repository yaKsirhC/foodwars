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

// DRAW UI ELEMENTS
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
healthBar.beginFill(0x13EA22);
healthBar.drawRoundedRect(0, 0, 500, 30, 5);
healthBar.endFill();
healthBar.x = 0;
healthBar.y = 0;

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

const playerTexture = await Assets.load("images/player.png");
const player = Sprite.from(playerTexture);
player.x = 0;
player.y = 0;
player.scale.set(2, 2);
player.anchor.set(0.5, 0.5);

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

// BULLETS
let bullets = [];
const bulletSpeed = 100;

const bulletTexture = await Assets.load("images/bullet.png");

function handleMouseDown(event) {
  socket.emit("serverUpdateNewBullet", {
    id: Math.random(),
    x: player.x + Math.cos(player.rotation) * 20,
    y: player.y + Math.sin(player.rotation) * 20,
    rotation: player.rotation,
  });
}

socket.on("clientUpdateNewBullet", (bulletData) => {
  const bullet = Sprite.from(bulletTexture);
  bullet.scale.set(1, 1);
  bullet.anchor.set(0.5, 0.5);
  bullet.x = bulletData.x;
  bullet.y = bulletData.y;
  bullet.rotation = bulletData.rotation - Math.PI/2;
  app.stage.addChild(bullet);
  bullets.push(bullet);
});

socket.on("clientUpdateSelf", (playerData) => {
  player.x = playerData.x;
  player.y = playerData.y;
  player.rotation = playerData.rotation;
});

// While game is running
app.ticker.add(() => {
  socket.emit("serverUpdateSelf", {
    id: socket.id,
    x: player.x,
    y: player.y,
    rotation: Math.atan2(
      mouse.y - app.renderer.height / 2,
      mouse.x - app.renderer.width / 2
    ) + Math.PI / 2, //2 * Math.PI
    keyboard: keyboard,
  });

  // HANDLING/CHECKING COLLISIONS
  for (const enemyID in enemySprites) {
    if (checkCollision(player, enemySprites[enemyID])) { 
      console.log("collision");
    }
  }

  for (var b = bullets.length - 1; b >= 0; b--) {
    bullets[b].x += Math.cos(bullets[b].rotation) * bulletSpeed;
    bullets[b].y += Math.sin(bullets[b].rotation) * bulletSpeed;
  }

  // Adjust the camera position to keep the player in the middle
  camera.x = player.x;
  camera.y = player.y;
  app.stage.position.x = app.renderer.width / 2 - camera.x;
  app.stage.position.y = app.renderer.height / 2 - camera.y;

  // Shift UI elements with Camera
  socketText.x = camera.x + 765;
  socketText.y = camera.y + 460;

  inventory.x = camera.x - 250;
  inventory.y = camera.y + 400;

  healthBar.x = camera.x - 925;
  healthBar.y = camera.y + 430;

  shieldBar.x = camera.x - 925;
  shieldBar.y = camera.y + 400;
});

// HELPER FUNCTIONS
function checkCollision(a, b) {
  var aBox = a.getBounds();
  var bBox = b.getBounds();

  return (
    aBox.x + aBox.width > bBox.x &&
    aBox.x < bBox.x + bBox.width &&
    aBox.y + aBox.height > bBox.y &&
    aBox.y < bBox.y + bBox.height
  );
}

// DISPLAY ON CANVAS
document.body.appendChild(app.view);
app.stage.addChild(backgroundSprite);
app.stage.addChild(player);
app.stage.addChild(sample);
app.stage.addChild(socketText);
app.stage.addChild(inventory);
app.stage.addChild(healthBar);
app.stage.addChild(shieldBar);
