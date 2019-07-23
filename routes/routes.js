const express = require('express'),
      router = express.Router();

router.get('/', (req, res) => {
    res.write("<h2>Status: 200 OK</h2>");
	console.log("Ping");
    res.status(200).end();
});

router.post('/', (req, res) => {
    console.log(req.body)
    console.log("Pong")

    var state;

    if (req.body.action == "TEST") {
        state = { state: "YUH", almonds: "ACTIVATED" };
    }
    else {
        state = { state: "BRUH", almonds: "ROASTED" };
    }

    res.send(JSON.stringify(state));
})

router.ws('/test', (ws, req) => {
    ws.send(JSON.stringify({ connection: "established" }));

    ws.onmessage = (msg) => {
        console.log(msg.data)
        ws.send("I see you said '" + msg.data + "'")
    }

    ws.onclose = () => {
        console.log('WebSocket was closed')
    }
});

module.exports = router;