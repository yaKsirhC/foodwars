const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

console.log("server started");
io.on('connection', (socket) => { 
    console.log("socket", socket.id, "connected");
});

const test = require("./test.js");

const port = 6969;
app.use(express.static('public'));
httpServer.listen(port);

console.log(__dirname)
console.log(__filename)
