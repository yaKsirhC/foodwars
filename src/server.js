const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

console.log("SERVER STARTED");
io.on('connection', (socket) => { 
    console.log("socket", socket.id, "connected");
});

const port = 6969;
app.use(express.static('public'));
app.use('/pixi', express.static('./node_modules/pixi.js/dist/'));
server.listen(port);

