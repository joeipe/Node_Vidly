const auth = require('../middleware/auth');
const { Movie, validateMovie } = require('../models/movie')
const { Genre } = require('../models/genre')
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const movies = await Movie.find().sort('title');
    res.send(movies);
});

router.get('/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
        res.status(404).send('Movie not found');
        return;
    }
    res.send(movie);
});

router.post('/', auth, async (req, res) => {
    const result = validateMovie(req.body);
    if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }

    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        res.status(400).send('Invalid genre.');
        return
    }

    const movie = new Movie({ 
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    });
    await movie.save();
    res.send(movie);
});

router.put('/:id', auth, async (req, res) => {
    const result = validateMovie(req.body);
    if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }

    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        res.status(400).send('Invalid genre.');
        return
    }

    const movie = await Movie.findByIdAndUpdate(
                            req.params.id, 
                            { 
                                title: req.body.title,
                                genre: {
                                    _id: genre._id,
                                    name: genre.name
                                },
                                numberInStock: req.body.numberInStock,
                                dailyRentalRate: req.body.dailyRentalRate
                            }, 
                            { new: true }
                        );
    if (!movie) {
        res.status(404).send('Movie not found');
        return;
    }

    res.send(movie);
});

router.delete('/:id', auth, async (req, res) => {
    const movie = await Movie.findByIdAndRemove(req.params.id);

    if (!movie) {
        res.status(404).send('Movie not found');
        return;
    }

    res.send(movie);
});

module.exports = router;