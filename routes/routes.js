//router
const express   = require('express'),
      router    = express.Router();
//helper modules
const _     = require('lodash'),
      uuid  = require('uuid/v4');
//managers
const sessionManager    = require('../managers/sessionManager'),
      userManager       = require('../managers/userManager');

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

let clients = [];
router.ws( '/connect', async ( ws, req ) => {
    clients.push(ws);
    let playerID;
    ws.send("Finding a session to join...");

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
                console.log("PlayerID: ", request.playerId);
                playerID = request.playerId;
                let session = await sessionManager.joinSession( ws, playerID );
                console.log("sessionId: ", session );
                ws.send("Connected to session");
                ws.send( session )
            } catch ( e ) {
                console.log( e );
                ws.send("Sorry, there was an error joining the session.");
                ws.terminate();
            }
        }
    }
});
module.exports = router;