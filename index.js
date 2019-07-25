//TODO convert to ES6 import style for node_modules
const express       = require('express'),
      app           = express(),
      expressWs     = require('express-ws')(app),
      port          = process.env.PORT || 8095,
      routes        = require('./routes/routes');

app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );

app.use( '/', routes );

app.use( ( req, res ) => {
    res.sendStatus(404);
});

app.listen( port, () => console.log('Server running on port ' + port) );