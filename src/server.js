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

    // takes individual player data and updates the server's copy of that player
    socket.on("serverUpdateSelf", (playerData) => {
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
        const otherPlayers = { ...players };
        delete otherPlayers[playerSocketId];

        // Emit the updated data to the current player
        io.to(playerSocketId).emit("clientUpdateAllPlayers", otherPlayers);
    }
}, 5);

// Calculate bullet trajectory (server side) (200 times per second)
setInterval(() => {
    io.emit("updateAllBullets", bullets);
    for (const bullet in bullets) {
        bullet.x += Math.cos(bullet.rotation) * bulletSpeed;
        bullet.y += Math.sin(bullet.rotation) * bulletSpeed;
    }
}, 5);

setInterval(() => {
    for (const playerSocketId in players) {
        if (playerSocketId === "undefined") {
            delete players[playerSocketId];
        }
    }
    console.log("Players", players);
}, 1000);

// final setup
const port = 6969;
app.use(express.static('public'));
app.use('/pixi', express.static('./node_modules/pixi.js/dist/'));
server.listen(port);
console.log("SERVER STARTED");
