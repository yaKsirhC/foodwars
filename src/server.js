const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

let players = {};
let bullets = {};
const bulletSpeed = 100;

// io connections
io.on('connection', (socket) => { 
    console.log("SERVER: socket", socket.id, "connected");

    // updates the player
    socket.on("serverUpdateSelf", (playerData) => {
        let speed = 5;
        if (playerData.keyboard.shift) {
            speed += 5;
        }

        if (playerData.keyboard.w) {
            playerData.y -= speed;
        }
        if (playerData.keyboard.a) {
            playerData.x -= speed;
        }
        if (playerData.keyboard.s) {
            playerData.y += speed;
        }
        if (playerData.keyboard.d) {
            playerData.x += speed;
        }

        const playerBounds = {
            x: playerData.x,
            y: playerData.y,
            width: playerData.width,
            height: playerData.height
          };

        Object.entries(bullets).forEach(([key, bullet]) => {
        if (checkCollision(bullet, playerBounds)) {
            console.log("Collision detected!" + Math.random());
            playerData.health -= 10;
            delete bullets[key];
        }
        });

        if (playerData.health == 0) {
            console.log(playerData.id + " died");
        }

        socket.emit("clientUpdateSelf", playerData);
        players[playerData.id] = playerData;
    });

    socket.on("serverUpdateNewBullet", (bulletData) => {
        bullets[bulletData.id] = bulletData;
        io.emit("clientUpdateNewBullet", bulletData);
    });

    socket.on("disconnect", () => {
        console.log("SERVER: socket", socket.id, "disconnected");
        delete players[socket.id];
    });
});

// Sending x every y seconds
// Send all player data to clients every 5ms (200 times per second) excluding the player's own data 
setInterval(() => {
    for (const playerSocketId in players) {
        const enemies = { ...players };
        delete enemies[playerSocketId];

        // Emit the updated data to the current player
        io.to(playerSocketId).emit("clientUpdateAllEnemies", enemies);
    }
}, 5);

// Calculate bullet trajectory (server side) (200 times per second)
setInterval(() => {
    io.emit("updateAllBullets", bullets);
    for (const bulletId in bullets) {
        const bullet = bullets[bulletId];
        bullet.x += Math.cos(bullet.rotation) * bulletSpeed / 4;
        bullet.y += Math.sin(bullet.rotation) * bulletSpeed / 4;

        if (bullet.x > 10000 || bullet.x < -10000 || bullet.y > 10000 || bullet.y < -10000 ) {
            delete bullets[bulletId];
        }
    }
}, 0.1);


setInterval(() => {
    for (const playerSocketId in players) {
        if (playerSocketId === "undefined") {
            delete players[playerSocketId];
        }
    }
    console.log("Players", players);
}, 1500);

// HELPER FUNCTIONS
function checkCollision(aBox, bBox) {
    return aBox.x < bBox.x + bBox.width &&
           aBox.x + aBox.width > bBox.x &&
           aBox.y < bBox.y + bBox.height &&
           aBox.y + aBox.height > bBox.y;
  }

// final setup
const port = 6969;
app.use(express.static('public'));
app.use('/pixi', express.static('./node_modules/pixi.js/dist/'));
server.listen(port);
console.log("SERVER STARTED");
