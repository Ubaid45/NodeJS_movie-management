//const Joi = require('joi');
/*const validate = require('../middleware/validate');
const {Rental} = require('../models/rental');
const {Movie} = require('../models/movie');
const auth = require('../middleware/auth');*/
const express = require('express');
const router = express.Router();

router.post('/', async(req, res) => {
    res.status(401).send('Unauthorized');
});


module.exports = router;