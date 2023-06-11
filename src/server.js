const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

let players = {};

console.log("SERVER STARTED");
io.on('connection', (socket) => { 
    console.log("SERVER: socket", socket.id, "connected");

    // takes individual player data and updates the server's copy of that player
    socket.on("serverUpdateSelf", (playerData) => {
        players[playerData.id] = playerData;
    });

    socket.on("disconnect", () => {
        console.log("SERVER: socket", socket.id, "disconnected");
        delete players[socket.id];
    });
});

setInterval(() => {
    console.log("Players", players);
}, 1000);

// Send all player data to clients every 5ms (200 times per second) excluding the player's own data 
setInterval(() => {
    for (const playerSocketId in players) {
        const otherPlayers = { ...players };
        delete otherPlayers[playerSocketId];

        // Emit the updated data to the current player
        io.to(playerSocketId).emit("updateAll", otherPlayers);
    }
}, 5);


const port = 6969;
app.use(express.static('public'));
app.use('/pixi', express.static('./node_modules/pixi.js/dist/'));
server.listen(port);
