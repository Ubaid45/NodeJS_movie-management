//const Joi = require('joi');
/*const validate = require('../middleware/validate');
const {Rental} = require('../models/rental');
const {Movie} = require('../models/movie');
const auth = require('../middleware/auth');*/
const express = require('express');
const router = express.Router();

router.post('/', async(req, res) => {
    if (!req.body.customerId) return res.status(400).send("Customer id not found");
    if (!req.body.movieId) return res.status(400).send("Movie id not found");
    res.status(401).send('Unauthorized');
});


module.exports = router;