const uuid   = require('uuid/v4'),
      _      = require('lodash'),
      moment = require('moment');

let sessions = {}; //global instance of all sessions, if the server goes down all the sessions will be closed anyways

const joinSession = ( socket, playerId ) => {
    //is there an available session?
    return Object.keys.forEach( (key) => {
        if( sessions[key].players.length < 3 ) {
            sessions[key].players.push( createPlayer( socket, playerId ) );
            return key;
        }
        else {
            return createSession( createPlayer( socket, playerId ) );
        }
    });
};
const closeSession = async ( clients, playerId ) => {
    //does an open session exist for a player?
    let sockets = [];

    await Object.keys(sessions).forEeach( ( key ) => {
        //if the player exists in a session
        if(_.find( sessions[key].players, playerId ) ) {
            _.each( sessions[key].players, (value) => {
                _.each( value, ( innerValue ) => {
                    sockets.push( innerValue );
                });
            });
        return key; //break out because we found our sessionId
        }
    });
    //send a message and kill all the clients that are connected to the session.
    _.each( sockets, ( client ) => {
        // if we found a client and we're still connected; kill them.
        if( _.find(clients, client ) && client.readyState === WebSocket.OPEN ) {
            client.send("A player has left, the session is ending now.");
            client.terminate();
        }
    });
};
const createSession = ( player ) => {
    /*
    *   {
    *       sessionuuid: {
    *           players:[
    *               {uniqueplayerId: socket},
    *               {uniqueplayerId: socket},
    *               {uniqueplayerId: socket}
    *           ],
    *           created: moment
    *       }
    *   }
    * */
    //generate a uuid once per createSession
    let sessionId = uuid();
    sessions[sessionId].players = [];
    sessions[sessionId].players.push( player );
    sessions[sessionId].created = moment().toISOString();

    return sessionId;
};
const createPlayer = ( socket, playerId ) => {
    let player = {};
    return player[playerId] = socket;
}
module.exports = {
    joinSession,
    closeSession
};