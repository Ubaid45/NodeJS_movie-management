/*const moment = require('moment');
const request = require('supertest');*/
const { Rental } = require('../../models/rental');
const { Movie } = require('../../models/movie');
//const {User} = require('../../models/user');
const mongoose = require('mongoose');

describe('/api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let rental;


    beforeEach(async() => {
        server = require('../../index');

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        //token = new User().generateAuthToken();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345'
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        });
        await rental.save();
    });

    afterEach(async() => {
        await server.close();
        await Rental.remove({});
        //await Movie.remove({});
    });

    it('should work', async() => {
        const result = await Rental.findById(rental._id);
        expect(result).not.toBeNull();
    })
});