const express       = require('express'),
      app           = express(),
      expressWs     = require('express-ws')(app),
      bodyParser    = require('body-parser'),
      port          = process.env.PORT || 8095,
      routes        = require('./routes/routes')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use( '/', routes )

app.use( ( req, res ) => {
    res.write('<h2>404 - Not Found</h2>')
    res.status(404).end()
});

app.listen( port, () => console.log('Server running on port ' + port) )