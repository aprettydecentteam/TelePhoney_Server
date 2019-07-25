//router
const express   = require('express'),
      router    = express.Router();
//helper modules
const _ = require('lodash');
//managers
const sessionManager    = require('./managers/sessionManager'),
      userManager       = require('./managers/userManager');

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
    ws.send('Connection established!');

    ws.onmessage = (msg) => {
        console.log( msg.data );
        ws.send("I see you said '" + msg.data + "'" );
    };

    ws.onclose = () => {
        console.log('WebSocket was closed');
    };
});

router.post( '/newPlayer', async ( req, res ) => {
    let playerName = req.body.playerName;
    try {
        res.json( await userManager.lookupUser(playerName) );
    } catch ( e ) {
        res.status(500).json( {error: e} );
    }
});

router.ws( '/joinSession', async ( ws, req ) => {
    ws.send("Finding a session to join...");

    ws.onclose = () => {
      sessionManager.closeSession( ws.getWSS().clients, req.playerId );
    };

    try {
        //we want the playerId here because this was made by the server
        //this acts as the "authentication" in our prototype
        let session = await sessionManager.joinSession( ws, req.playerId )

        ws.send("Connected to session")
    } catch ( e ) {
        ws.send("Sorry, there was an error joining the session.")
        ws.terminate();
    }
});
module.exports = router;