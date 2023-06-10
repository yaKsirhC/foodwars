// Sockets
const socket = io("ws://localhost:6969");
socket.on("connect", () => { 
    console.log("socket", socket.id, "connected");
});

// Create the Pixi.js application
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xAAAAAA,
  });
  
  // Add the Pixi.js canvas to the HTML document
  document.body.appendChild(app.view);
  
  // Create a basic rectangle shape
  const rectangle = new PIXI.Graphics();
  rectangle.beginFill(0xFF0000);
  rectangle.drawRect(0, 0, 100, 100);
  rectangle.endFill();
  
  // Add the rectangle to the Pixi.js stage
  app.stage.addChild(rectangle);
  