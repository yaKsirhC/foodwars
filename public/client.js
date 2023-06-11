const Application = PIXI.Application;

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
})

app.renderer.backgroundColor = 0x23395D;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.view.style.position = "absolute";

const Graphics = PIXI.Graphics;
const rectangle = new Graphics();
rectangle.beginFill(0xAA33BB)
.drawRect(200, 200, 100, 120)
.endFill();

// Create a keyboard state object to keep track of the key states
const keyboard = {
    w: false,
    a: false,
    s: false,
    d: false,
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
    if (keyboard.w) {
      rectangle.y -= 5;
    }
  
    if (keyboard.a) {
      rectangle.x -= 5;
    }
  
    if (keyboard.s) {
      rectangle.y += 5;
    }
  
    if (keyboard.d) {
      rectangle.x += 5;
    }

  });
  
// put on the canvas
document.body.appendChild(app.view);
app.stage.addChild(rectangle);

