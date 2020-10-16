const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const uuid = require('uuid');
const app = express();

const port = process.env.PORT || 9000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {};

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message));
}

const sendToAll = (clients, type, { id, name: userName }) => {
    Object.values(clients).forEach(client => {
        if (client.name !== userName) {
            client.send(
                JSON.stringify({
                    type,
                    user: { id, userName }
                })
            )
        }
    })
};

wss.on("connection", ws => {
    ws.on("close", () => {
        delete users[ws.name];
        sendToAll(users, "leave", ws);
    })

    ws.on("message", msg => {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (error) {
            console.log("Invalid JSON");
            data = {};
        }
        const { type, name, offer, answer, candidate } = data;
        switch (type) {
            case "leave":
                sendToAll(users, "leave", ws);
                break;
            case "candidate":
                const candidateRecipient = users[name];
                if (!!candidateRecipient) {
                    sendTo(candidateRecipient, {
                        type: "candidate",
                        candidate
                    })
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    });
                }
                break;
            case "answer":
                const answerRecipent = users[name];
                if (!!answerRecipent) {
                    sendTo(answerRecipent, {
                        type: "answer",
                        answer,
                    });
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    })
                }
                break;
            case "offer":
                const offerRecipient = users[name];
                if (!!offerRecipient) {
                    sendTo(offerRecipient, {
                        type: "offer",
                        offer,
                        name: ws.name
                    })
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    })
                }
                break;
            case "login":
                if (users[name]) {
                    sendTo(ws, {
                        type: "login",
                        success: false,
                        message: "Username is unavailable"
                    });
                } else {
                    const id = uuid.v4();
                    const loggedIn = Object.values(users).map(({ id, name: userName }) => ({ id, userName }));
                    users[name] = ws;
                    ws.name = name;
                    ws.id = id;
                    sendTo(ws, {
                        type: "login",
                        success: true,
                        users: loggedIn
                    })
                    sendToAll(users, "updateUsers", ws);
                }
                break;
            default:
                sendTo(ws, {
                    type: "error",
                    message: "Command not found: " + type
                });
                break;
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