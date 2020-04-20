//const Joi = require('joi');
//const validate = require('../middleware/validate');
const { Rental } = require('../models/rental');
//const {Movie} = require('../models/movie');
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();

router.post('/', auth, async(req, res) => {
    if (!req.body.customerId) return res.status(400).send("Customer id not found");
    if (!req.body.movieId) return res.status(400).send("Movie id not found");

    const rental = await Rental.findOne({
        'customer._id': req.body.customerId,
        'movie._id': req.body.movieId
    });

    if (!rental) return res.status(404).send('Rental not found.');
    if (rental.dateReturned) return res.status(400).send('Return already processed.');
    return res.status(200).send();
});


module.exports = router;