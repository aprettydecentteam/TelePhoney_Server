//router
const express   = require('express'),
      router    = express.Router();
//helper modules
const _ = require('lodash');
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

router.ws( '/test', ( ws, req ) => {
    ws.send( 'Connection established!' );

    ws.onmessage = (msg) => {
        console.log( msg.data );
        ws.send("I see you said '" + msg.data + "'" );
    };

    ws.onclose = () => {
        console.log( 'WebSocket was closed' );
    };
});

router.post( '/newPlayer', async ( req, res ) => {
    let playerName = req.body.playerName;
    console.log(playerName);
    try {
        let player = await userManager.lookupUser( playerName );
        res.json( player );
    } catch ( e ) {
        console.log("Error is " + e);
        res.status(500).json( {error: e} );
    }
});

router.ws( '/connect', async ( ws, req ) => {
    console.log("joinSession was connected to");
    ws.send("Finding a session to join...");

    ws.onclose = () => {
      sessionManager.closeSession( ws.getWSS().clients, req.body.playerId );
    };

    ws.onmessage = (msg) => {
        //we want the playerId here because this was made by the server
        //this acts as the "authentication" in our prototype
        let request = JSON.parse(msg.data);
        console.log("Here is the serialized message: " + msg.data);
        console.log("Here is the JSON object: " + JSON.stringify(request));
        if (request.reqEvent = "joinSession")
        {
            try {
                console.log(request.playerId);
                let playerID = request.playerId;
                let session = sessionManager.joinSession( ws, playerID );

                ws.send("Connected to session");
                ws.send( session )
            } catch ( e ) {
                ws.send("Sorry, there was an error joining the session.");
                ws.terminate();
            }
        }
    }
});
module.exports = router;