'use strict';
const uuid   = require('uuid/v4'),
      _      = require('lodash'),
      moment = require('moment');

let users;
const lookupUser = async playerName => {
    try {
        //TODO users = getUserCollection
        let user;
        if( users != null ) {
            user = await _.find( users, {"playerName": playerName} );
            //TODO remove console used for debugging
            console.log("user: ", user);
        }
        else {
            users = [];
        }
        if( user ) {
            return user;
        } else {
            //new player needs to be added
            let newPlayer = await buildUser( playerName );
            users.push( newPlayer );
            //TODO replace with saveUserCollection
            // optionally add device id with new player
            return newPlayer.playerId;
        }
    } catch ( e ) {
        throw e;
    }
};

const buildUser = playerName => {
  return {
      playerName,
      playerId: uuid(),
      created: moment().toISOString()
  };
};

module.exports = {
    lookupUser
};