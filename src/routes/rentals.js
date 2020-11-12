const auth = require('../middleware/auth');
const { Rental, validateRental } = require('../models/rental')
const { Movie } = require('../models/movie')
const { Customer } = require('../models/customer')
const mongoose = require('mongoose');
const Fawn = require('fawn');
const express = require('express');
const router = express.Router();

Fawn.init(mongoose);

router.get('/', async (req, res) => {
    const rentals = await Rental.find().sort('-dateOut');
    res.send(rentals);
});

router.get('/:id', async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404).send('Rental not found');
        return;
    }
    res.send(rental);
});

router.post('/', auth, async (req, res) => {
    const result = validateRental(req.body);
    if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }

    const customer = await Customer.findById(req.body.customerId);
    if(!customer) {
        res.status(400).send('Invalid customer.');
        return
    }

    const movie = await Movie.findById(req.body.movieId);
    if(!movie) {
        res.status(400).send('Invalid movie.');
        return
    }

    if(!movie.numberInStock === 0) {
        res.status(400).send('Movie not in stock.');
        return
    }

    const rental = new Rental({ 
        customer: {
            _id: customer._id,
            name: customer.name,
            isGold: customer.isGold,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    });
    /*
    await rental.save();

    movie.numberInStock--;
    movie.save();
    */
   try {
        new Fawn.Task()
            .save('rentals', rental)
            .update('movies', { _id: movie._id }, {
                $inc: { numberInStock: -1 }
            })
            .run();

        res.send(rental);
   } catch (ex) {
        res.status(500).send('Something failed.');
   }
   
});

router.put('/:id', auth, async (req, res) => {
    const result = validateRental(req.body);
    if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }

    const customer = await Customer.findById(req.body.customerId);
    if(!customer) {
        res.status(400).send('Invalid customer.');
        return
    }

    const movie = await Movie.findById(req.body.movieId);
    if(!movie) {
        res.status(400).send('Invalid movie.');
        return
    }

    const rental = await Rental.findByIdAndUpdate(
                            req.params.id, 
                            { 
                                customer: {
                                    _id: customer._id,
                                    name: customer.name,
                                    isGold: customer.isGold,
                                    phone: customer.phone
                                },
                                movie: {
                                    _id: movie._id,
                                    title: movie.title,
                                    dailyRentalRate: movie.dailyRentalRate
                                },
                                dateReturned: req.body.dateReturned,
                                rentalFee: req.body.rentalFee
                            }, 
                            { new: true }
                        );
    if (!rental) {
        res.status(404).send('Rental not found');
        return;
    }

    res.send(rental);
});

router.delete('/:id', auth, async (req, res) => {
    const rental = await Rental.findByIdAndRemove(req.params.id);

    if (!rental) {
        res.status(404).send('Rental not found');
        return;
    }

    res.send(rental);
});

module.exports = router;