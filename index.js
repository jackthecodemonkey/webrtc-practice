const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const uuidv4 = require('uuid');
const app = express();

const port = process.env.PORT || 9000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    ws.on("message", msg => {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (error) {
            console.log("Invalid JSON");
            data = {};
        }
        console.log("Received message: %s from client", msg);
    });

    ws.send(
        JSON.stringify({
            type: "connect",
            message: "Well hello there, I am a WebSocket server"
        })
    )
})

server.listen(port, () => {
    console.log(`Signalling Server running on port: ${port}`);
})