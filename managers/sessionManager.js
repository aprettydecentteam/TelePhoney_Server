'use strict';
const uuid   = require('uuid/v4'),
      _      = require('lodash'),
      moment = require('moment');

let sessions = {"0":{"players":[null,null,null]}}; //global instance of all sessions, if the server goes down all the sessions will be closed anyways

const joinSession = async ( socket, playerId ) => {

    //TODO edge case where, the socket for a player wasn't closed or the session wasn't deleted.
    // check if a session already exists for a player, if the session is active close the session, as clearly
    // said player is not in it.

    try {
        //is there an available session?
        let sessionId = Object.keys(sessions).forEach(async key => {
            console.log( sessions[key].players.length + " " + key );
            if (sessions[key].players.length < 3) {
                sessions[key].players.push(await createPlayer(socket, playerId));
                sessionId = key;
                return sessionId;
            }
        });
        await Promise.resolve(sessionId);
        if( !sessionId ) {
            console.log("Creating session ");
            sessionId = createSession( await createPlayer(socket, playerId));
        }
        await Promise.resolve(sessionId);
        return sessionId;
    }catch( e ) {
        throw e;
    }
};

//TODO doesn't work
// fix
const closeSession = async ( clients, playerId ) => {
    try {
        //does an open session exist for a player?
        let sessionId = await getSessionId(playerId);

        if (!sessionId) {
            return null; //the player wasn't in an open session or the session has already been terminated
        }

        //this iterates over the player array and returns the player's websocket
        let sockets = [];
        await _.each(sessions[sessionId].players, value => {
            _.each(value, innerValue => {
                sockets.push(innerValue);
            });
        });

        //send a message and kill all the clients that are connected to the session.
        await _.each(sockets, client => {
            // if we found a client and we're still connected; kill them.
            if (_.find(clients, client) && client.readyState === WebSocket.OPEN) {
                client.send("A player has left, the session is ending now.");
                client.terminate();
            }
        });

        //TODO if we want to keep sessions for a history of instead
        // don't delete the session and set a field sessions[sessionId].active = false;
        //now that all the clients have been killed the session is no longer active so remove it
        delete sessions[sessionId];
    } catch ( e ) {
        throw e;
    }
};
const createSession = player => {
    /*
    *   {
    *       sessionuuid: {
    *           players:[
    *               {uniqueplayerId: socket},
    *               {uniqueplayerId: socket},
    *               {uniqueplayerId: socket}
    *           ],
    *           created: moment,
    *           active: true|false // not sure if we want this could be useful.
    *       }
    *
    *   }
    * */
    //generate a uuid once per createSession
    let sessionId = uuid();
    sessions[sessionId] = {players:[]};
    sessions[sessionId].players.push( player );
    sessions[sessionId].created = moment().toISOString();
    return sessionId;
};

const createPlayer = ( socket, playerId ) => {
    let player = {};
    return player[playerId] = socket;
};

const getSessionId = playerId => {
    return Object.keys(sessions).forEach( key => {
        //if the player exists in a session return the sessionId
        if( _.find( sessions[key].players, playerId ) ) {
            return key; //break out because we found our sessionId
        }
    });
};

module.exports = {
    joinSession,
    closeSession
};