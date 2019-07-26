'use strict';
const uuid   = require('uuid/v4'),
      _      = require('lodash'),
      moment = require('moment');

//temp until db stuff
const fs = require('fs');
const userListPath = './data/userList.dat';

const lookupUser = async ( playerName ) => {
    try {
        //TODO replace with getUserCollection
        return await fs.open( userListPath, 'a+', async ( err, fd ) => {
            if( err )
                throw err;
            let users = await fs.readFile( fd, 'utf-8', ( err, data ) => {
                if( err )
                    throw err;
                return data;
            });

            let user;
            if( users != null )
                user = await _.find( users, playerName );

            if( user ) {
                return user;
            } else {
                //new player needs to be added
                let newPlayer = await buildUser( playerName );
                //TODO replace with saveUserCollection
                fs.appendFile( fd, newPlayer, ( err ) => {
                    fs.close( fd, ( err ) => {
                        if( err )
                            throw err;
                    });
                    if( err )
                        throw err;
                });
                return newPlayer;
            }
        });
    } catch ( e ) {
        throw e;
    }
};

const buildUser = ( playerName )=> {
  return user = {
      playerName,
      playerId: uuid(),
      created: moment().toISOString()
  };
};

module.exports = lookupUser;