const express = require('express'),
      router = express.Router();

router.get('/', (req, res) => {
    res.write("<h2>Status: 200 OK</h2>");
	console.log("Ping");
    res.status(200).end();
});

router.post('/', (req, res) => {
    console.log(req.body);
    console.log("Pong");
    res.status(200).end();
});

module.exports = router;