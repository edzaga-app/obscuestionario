const express = require('express')
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        data: "conjunto de datos"
    })
});

module.exports = router;