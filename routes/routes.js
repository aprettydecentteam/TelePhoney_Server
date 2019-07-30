//router
const express   = require('express'),
      router    = express.Router();
//helper modules
const _     = require('lodash'),
      uuid  = require('uuid/v4');
//managers
const sessionManager    = require('../managers/sessionManager'),
      userManager       = require('../managers/userManager');

let sessions = sessionManager.sessions;

// Demo globals
let clients = [];
let solution = {};
let id = 0;
router.get( '/', ( req, res ) => {
    console.log("Ping");
    res.sendStatus(200);
});

router.post( '/', ( req, res ) => {
    console.log(req.body);
    console.log("Pong");
    res.sendStatus(200);
});

router.post( '/newPlayer', async ( req, res ) => {
    let playerName = req.body.playerName;
    try {
        let player = await userManager.lookupUser( playerName );
        res.json( player );
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.post( '/sendGuess', async ( req, res ) => {
    let sessionId = req.body.sessionId;
    let sockets = [];
    let eventMessage = {};
    let serialMessage = "";
    try {
        eventMessage.verbs = req.body.verbs;
        eventMessage.nouns = req.body.nouns;
        eventMessage.mesEvent = "updateGuess";
        serialMessage = JSON.stringify(eventMessage);
        await _.each(sessions[sessionId].players, value => {
            _.each(value, innerValue => {
                sockets.push(innerValue);
            });
        });
        await _.each(sockets, client => {
            if (_.find(clients, client) && client.readyState === WebSocket.OPEN) {
                client.send(serialMessage);
            }
        });
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.post( '/sendMessage', async ( req, res ) => {
    let playerId = req.body.playerId;
    let sessionId = req.body.sessionId;
    let eventMessage = {};
    let serialMessage = "";
    let recevSocket = "";
    let playerRole = -1; // 0 = sender, 1 = saboteur, 2 = receiver
    try {
        playerRole = _.findIndex(sessions[sessionId].players, playerId);
        eventMessage.noun = req.body.noun;
        eventMessage.verb = req.body.verb;
        eventMessage.step = req.body.step;
        eventMessage.mesEvent = "sentMessage";
        serialMessage = JSON.stringify(eventMessage);
        switch(playerRole) {
            case 0:
                // Send message to saboteur
                recevSocket = sessions[sessionId].players[1];
                break;
            case 1:
                // Send message to receiver
                recevSocket = sessions[sessionId].players[2];
                break;
            case 2:
                // Send message to sender (not sure why. I just threw it in here)
                recevSocket = sessions[sessionId].players[0];
                break;
            default:
                console.log("Valid player role not found.");
        }
        recevSocket.send(serialMessage);
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.ws( '/connect', async ( ws, req ) => {
    clients.push(ws);
    let playerID;
    let joinSessionMessage = {};
    let connectMessage = {};
    let sessionStartMessage = {};
    let serialMessage = "";
    connectMessage.msgEvent = "searchingForSession";
    ws.send(JSON.stringify(connectMessage));

    ws.onclose = () => {
      sessionManager.closeSession( clients, playerID );
    };

    ws.onmessage = async msg => {
        console.log(msg.data);
        //we want the playerId here because this was made by the server
        //this acts as the "authentication" in our prototype
        let request = JSON.parse(msg.data);
        if (request.reqEvent = "joinSession")
        {
            try {
                playerID = request.playerId;
                joinSessionMessage.sessionId = await sessionManager.joinSession( ws, playerID );
                let sessionId = joinSessionMessage.sessionId;
                joinSessionMessage.msgEvent = "joinedSession";
                serialMessage = JSON.stringify(joinSessionMessage);
                ws.send( serialMessage )

                if (sessions[sessionId].players.length == 3) {
                    try {
                        sessionStartMessage.mesEvent = "sessionStart";
                        sessionStartMessage.sessionRole = "Sender";
                        serialMessage = JSON.stringify(sessionStartMessage);
                        sessions[sessionId].players[0].send(serialMessage);

                        sessionStartMessage.sessionRole = "Saboteur";
                        serialMessage = JSON.stringify(sessionStartMessage);
                        sessions[sessionId].players[1].send(serialMessage);

                        sessionStartMessage.sessionRole = "Receiver";
                        serialMessage = JSON.stringify(sessionStartMessage);
                        sessions[sessionId].players[2].send(serialMessage);
                    } catch ( e ) {
                        ws.send("Sorry, there was an error starting the session.");
                        ws.terminate();
                    }
                }

            } catch ( e ) {
                console.log( e );
                ws.send("Sorry, there was an error joining the session.");
                ws.terminate();
            }
        }
    }
});
// Demo day routes
router.ws( '/connectdemo', async ( ws, req ) => {
    console.log("connection request");
    let client = {};
    let connectMessage = {};
    client.socket = ws;
    client.role = "";
    client.id = clients.length;
    clients.push(client);
    connectMessage.id = client.id;
    connectMessage.msgEvent = "connected";
    ws.send(JSON.stringify(connectMessage));
});

router.post( '/roledemo', ( req, res ) => {
    console.log("assigning role");
    clients[req.body.id].role = req.body.role;
});

router.post( '/sendmessagedemo', ( req, res ) => {
    console.log("sending message");
    let eventMessage = {};
    let serialMessage = "";
    let recevSocket = "";
    try {
        console.log("creating event message");
        eventMessage.noun = req.body.noun;
        eventMessage.verb = req.body.verb;
        eventMessage.step = req.body.step;
        eventMessage.mesEvent = "sentMessage";
        console.log("serializing response");
        serialMessage = JSON.stringify(eventMessage);
        console.log(JSON.stringify(clients[req.body.id].role));
        switch(clients[req.body.id].role) {
            case "Sender":
                console.log("Sender sent message to Saboteur!");
                // Send message to saboteur
                clients.forEach(element => {
                    console.log("element: " + element);
                    if(element.role === "Saboteur") {
                        recevSocket = element.ws;
                    }
                });
                break;
            case "Saboteur":
                console.log("Saboteur sent message to receiver!");
                // Send message to receiver
                clients.forEach(element => {
                    if(element.role === "Receiver") {
                        recevSocket = element.ws;
                    }
                });
                break;
            default:
                console.log("Valid player role not found.");
        }
        console.log("message sent was: " + serialMessage);
        recevSocket.send(serialMessage);
    } catch ( e ) {
        console.log("An error occured: " + JSON.stringify(e));
    }
});

router.post( '/sendguessdemo', ( req, res ) => {
    console.log("sending guess!");
    let eventMessage = {};
    let serialMessage = "";
    try {
        eventMessage.verbs = req.body.verbs;
        eventMessage.nouns = req.body.nouns;
        eventMessage.role = req.body.role;
        eventMessage.mesEvent = "updateGuess";
        serialMessage = JSON.stringify(eventMessage);

        clients.forEach(element => {
            element.ws.send(serialMessage);
        });
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.post( '/sendcorrectguessesdemo', ( req, res ) => {
    console.log("sending the number of correct guesses");
    let eventMessage = {};
    let serialMessage = "";
    try {
        eventMessage.correctGuesses = req.body.correctGuesses;
        eventMessage.mesEvent = "correctGuesses";
        serialMessage = JSON.stringify(eventMessage);

        clients.forEach(element => {
            element.ws.send(serialMessage);
        });
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.post( '/initreceiverdemo', ( req, res ) => {
    console.log("Initalizing cipher cypher");
    let eventMessage = {};
    let serialMessage = "";
    try {
        eventMessage.verbs = req.body.verbs;
        eventMessage.nouns = req.body.nouns;
        eventMessage.mesEvent = "initCypher";
        //serialMessage = JSON.stringify(eventMessage);

        clients.forEach(element => {
            console.log(element);
            if (element.role === "Receiver") {
                element.send(eventMessage);
            }
        });
    } catch ( e ) {
        console.log("error is: " + JSON.stringify(e));
    }
});

router.post( '/winnerdemo', ( req, res ) => {
    console.log("We have a winner!");
    let eventMessage = {};
    eventMessage.mesEvent = "gameOver"
    try {
        switch(req.body.role) {
            case "Saboteur":
                clients.forEach(element => {
                    if(element.role === "Saboteur") {
                        eventMessage.result = "Winner";
                        element.ws.send(JSON.stringify(eventMessage));
                    }
                    else {
                        eventMessage.result = "Loser";
                        element.ws.send(JSON.stringify(eventMessage));
                    }
                });
                break;
            case "Sender":
            case "Receiver":
                clients.forEach(element => {
                    if(element.role === "Saboteur") {
                        eventMessage.result = "Loser";
                        element.ws.send(JSON.stringify(eventMessage));
                    }
                    else {
                        eventMessage.result = "Winner";
                        element.ws.send(JSON.stringify(eventMessage));
                    }
                });
                break;
            default:
                console.log("No winner?");
                break;
        }
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});
module.exports = router;