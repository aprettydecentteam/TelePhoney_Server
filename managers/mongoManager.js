const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Game_Server:Game_Server@telephony-edzav.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
const assert = require('assert');

// NOTE: it's assumed that all searching will be done through playerID rather than playerName
const updateMongoUser = (playerName,playerID) => {
    client.connect(err => {
        assert.equal(null,err);
        console.log("Connected to Mongo Server");
        // get the users collection
        const Collection = client.db('Telephony').collection('Users');
        // update user record, will make a user record if none exists
        Collection.updateOne(
            {userID: playerID},
            {
                $set: {userName: playerName, gamesPlayed : 0, wins : 0}
            },
            {upsert : true});
        console.log("User Collection Updated");
        client.close();
        console.log("Mongo Server Connection Closed");
    });
};

// NOTE: this can be modified into an array if it's understood that they will
// always be allocated in the sequence of sender, saboteur, recipient
// also, current version will always replace the player values for each position
// so overwriting is an issue.
const updateMongoSession = (UUID,playerIDSender,playerIDSaboteur,playerIDRecipient) => {
    client.connect(err => {
        assert.equal(null,err);
        console.log("Connected to Mongo Server");
        // get the users collection
        const SessionCollection = client.db('Telephony').collection('Sessions');
        const UserCollection = client.db('Telephony').collection('Users');
        // update session record, will make a session record if none exists
        SessionCollection.updateOne(
            {sessionID: UUID},
            {
                $set: {
                    sender : playerIDSender,
                    saboteur : playerIDSaboteur,
                    recipient : playerIDRecipient, 
                }
            },
            {upsert : true});
        
        // increment each player's games played, so we can compare it against wins
        UserCollection.updateOne(
            {userID: playerIDSender},
            {
                $inc: {
                    gamesPlayed : 1
                }
            }
        )
        UserCollection.updateOne(
            {userID: playerIDSaboteur},
            {
                $inc: {
                    gamesPlayed : 1
                }
            }
        )
        UserCollection.updateOne(
            {userID: playerIDRecipient},
            {
                $inc: {
                    gamesPlayed : 1
                }
            }
        )

        console.log("Session Collection Updated");
        client.close();
        console.log("Mongo Server Connection Closed");
    });
};

// NOTE: This has secondary variables for when 2 players win
// send either one or both and this will make it work
const updateMongoResults = (UUID,playerIDWinner,playerRole,playerIDWinner2 = null,playerRole2 = null) => {
    client.connect(err => {
        assert.equal(null,err);
        console.log("Connected to Mongo Server");
        // get the users collection
        const ResultCollection = client.db('Telephony').collection('Results');
        const UserCollection = client.db('Telephony').collection('Users');
        if(playerIDWinner2 == null)
        {
            ResultCollection.updateOne(
                {sessionID: UUID},
                {
                    $set: {
                        winningUser : [playerIDWinner],
                        winningRole : [playerRole], 
                    }
                },
                {upsert : true});            
        }
        else
        {
            ResultCollection.updateOne(
                {sessionID: UUID},
                {
                    $set: {
                        winningUser : [playerIDWinner,playerIDWinner2],
                        winningRole : [playerRole,playerRole2] 
                    }
                },
                {upsert : true}); 

            UserCollection.updateOne(
                {userID: playerIDWinner2},
                {
                    $inc: {
                        wins : 1
                    }
                }
            );
        }

        UserCollection.updateOne(
            {userID: playerIDWinner},
            {
                $inc: {
                    wins : 1
                }
            }
        );

        console.log("Results Collection Updated");
        client.close();
        console.log("Mongo Server Connection Closed");
    });
        
    
};

module.exports = {
    updateMongoUser,
    updateMongoSession,
    updateMongoResults
};

require('make-runnable');