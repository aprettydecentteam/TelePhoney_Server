const express       = require('express'),
      router        = express.Router()

router.get('/', (req, res) => {
    console.log("Ping")
    res.write("<h2>Status: 200 OK</h2>")
    res.status(200).end()
})


router.post('/', (req, res) => {
    console.log(req.body)
    console.log("Pong")
    res.status(200).end()
})

router.ws('/test', (ws, req) => {
    ws.send('Connection established!')

    ws.onmessage = (msg) => {
        console.log( msg.data )
        ws.send("I see you said '" + msg.data + "'" )
    }

    ws.onclose = () => {
        console.log('WebSocket was closed')
    }
})

module.exports = router;