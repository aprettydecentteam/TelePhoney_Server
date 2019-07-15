const express = require('express'),
      router = express.Router();

router.get('/', (req, res) => {
    res.write("<h2>Status: 200 OK</h2>");
    res.status(200).end();
});

module.exports = router;