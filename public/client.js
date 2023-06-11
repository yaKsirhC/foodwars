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

// While game is running
app.ticker.add(() => {
    let speed = 5;
    if (keyboard.shift) {
        speed *= 2;
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

    console.log(app.renderer.interaction);
    let rotation = Math.atan2(mouse.y-(app.renderer.width/2), mouse.x-(app.renderer.height/2));
    player.rotation = rotation;
    console.log("player rot:" + player.rotation + " rotation: " + rotation)
});

// Put on the canvas
document.body.appendChild(app.view);
app.stage.addChild(backgroundSprite);
app.stage.addChild(player);
app.stage.addChild(sample);
