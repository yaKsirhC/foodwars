const socket = io("ws://localhost:6969");
socket.on("connect", () => { 
    console.log("socket", socket.id, "connected");
});

// Create a PixiJS application
var app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xAAAAAA
});

// Add the PixiJS canvas to the HTML document
document.body.appendChild(app.view);

// Create a background rectangle
var background = new PIXI.Graphics();
background.beginFill(0xFF0000); // Set the background color (replace 0xFF0000 with your desired color)
background.drawRect(0, 0, app.screen.width, app.screen.height);
background.endFill();

// Add the background to the stage
app.stage.addChild(background);
