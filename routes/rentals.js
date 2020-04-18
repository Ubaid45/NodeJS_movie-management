const express = require('express')
const router = express.Router()
const { Customer } = require('../models/customer')
const Fawn = require('fawn')
const mongoose = require('mongoose')
const { Movie } = require('../models/movie')
const { Rental, validate } = require('../models/rental')

Fawn.init(mongoose)

router.get('/', async(req, res) => {
    const rentals = await Rental.find().sort('-dateOut');
    res.send(rentals);
})


router.post('/', async(req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Makes sure the customerId/customer sends us is valid
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(404).send('Invalid customerId');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(404).send('Invalid movieId');

    let rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    })

    // This is for our success scenario
    try {
        // All args in here treated all together as unit
        new Fawn.Task()
            // First arg is collection we work with, and second is obj we wanna save
            .save('rentals', rental)
            // Update movies collection Second Arg is movie that should be updated Third is we increment the numInstock prop, and decrement by 1
            .update('movies', { _id: movie._id }, {
                $inc: { numberInStock: -1 }
            })
            .run();
        res.send(rental);
    } catch (ex) {
        // 500 means Internal server error
        res.status(500).send('Something failed.');
    }
})

module.exports = router;