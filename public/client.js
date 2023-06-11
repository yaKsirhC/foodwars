const Application = PIXI.Application;
const Sprite = PIXI.Sprite;
const Assets = PIXI.Assets;

const socket = io("ws://localhost:6969");
socket.on("connect", () => {
    console.log("socket", socket.id, "connected");
});

// PIXI
const app = new Application({
    width: 500,
    height: 500,
    transparent: false,
    antialias: true,
});

const background = await Assets.load("img.jpg")
const backgroundSprite = Sprite.from(background);
backgroundSprite.x = 0;
backgroundSprite.y = 0;
backgroundSprite.scale.set(5, 5);

app.renderer.background.color = '#23395D';
app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.view.style.position = "absolute";

const Graphics = PIXI.Graphics;
const sample = new Graphics();
sample.beginFill(0xFFFFFF)
    .drawRect(0, 0, 200, 2000)
    .endFill();

const texture = await Assets.load("player.png");
const player = Sprite.from(texture);
player.x = 0;
player.y = 0;
player.scale.set(5, 5);
player.anchor.set(0.5, 0.5);

// Mouse events
const mouse = {
    x: 0,
    y: 0,
};

window.addEventListener("mousemove", handleMouseMove);

function handleMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};

// Camera properties
const camera = {
    x: app.renderer.width / 2,
    y: app.renderer.height / 2,
};

// Create a keyboard state object to keep track of the key states
const keyboard = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
};

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("mousedown", handleMouseDown);


let bullets = [];  
let bulletSpeed = 100;

// Key event handler
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

function handleMouseDown(event) {
    shoot(player.rotation, {
        x: player.x + Math.cos(player.rotation) * 20,
        y: player.y + Math.sin(player.rotation) * 20,
    });
}

function shoot(rotation, startPosition){  
    var bullet = Sprite.from(texture);
    bullet.x = startPosition.x;
    bullet.y = startPosition.y;
    bullet.rotation = rotation - Math.PI/2;
    bullet.anchor.set(0.5, 0.5);
    app.stage.addChild(bullet);
    bullets.push(bullet);
  }

  // Create a new PIXI Text object
const text = new PIXI.Text(socket.id, {
    fontFamily: "Arial",
    fontSize: 24,
    fill: 0xffffff, // Color in hexadecimal format
  });
  
  // Set the position of the text
  text.x = 100;
  text.y = 100;
  
  // Add the text to the stage
  app.stage.addChild(text);

  const playerSprites = {}; // Object to store the player sprites

  function renderPlayer(playerData) {
      if (!playerSprites[playerData.id]) {
          // Create a new PIXI sprite for the player
          const otherPlayer = Sprite.from(texture);
          otherPlayer.scale.set(5, 5);
          otherPlayer.anchor.set(0.5, 0.5);
          app.stage.addChild(otherPlayer);
          playerSprites[playerData.id] = otherPlayer;
      }
  
      const playerSprite = playerSprites[playerData.id];
      playerSprite.x = playerData.x;
      playerSprite.y = playerData.y;
      playerSprite.rotation = playerData.rotation;
  }
  

socket.on("updateAll", (players) => {
    for (const playerId in players) {
        console.log(players);
        if (playerId !== socket.id) {

            const playerData = players[playerId];
            renderPlayer(playerData);
        }
    }
});

// While game is running
app.ticker.add(() => {
    socket.emit("serverUpdateSelf", {id: socket.id, x: player.x, y: player.y, rotation: player.rotation + (2 * Math.PI)})

    for(var b=bullets.length-1;b>=0;b--){
        bullets[b].position.x += Math.cos(bullets[b].rotation)*bulletSpeed;
        bullets[b].position.y += Math.sin(bullets[b].rotation)*bulletSpeed;
      }

    let speed = 5;
    if (keyboard.shift) {
        speed += 5;
    }

    if (keyboard.w) {
        player.y -= speed;
    }

    if (keyboard.a) {
        player.x -= speed;
    }

    if (keyboard.s) {
        player.y += speed;
    }

    if (keyboard.d) {
        player.x += speed;
    }

    // Adjust the camera position to keep the player in the middle
    camera.x = player.x + player.width / 2;
    camera.y = player.y + player.height / 2;
    app.stage.position.x = app.renderer.width / 2 - camera.x;
    app.stage.position.y = app.renderer.height / 2 - camera.y;

    let rotation = Math.atan2(mouse.y-(app.renderer.height/2), mouse.x-(app.renderer.width/2));
    player.rotation = rotation + Math.PI/2;
});

// Put on the canvas
document.body.appendChild(app.view);
app.stage.addChild(backgroundSprite);
app.stage.addChild(player);
app.stage.addChild(sample);
