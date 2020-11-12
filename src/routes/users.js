const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User, validateUser } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    res.send(user);
});

router.post('/', async (req, res) => {
    const result = validateUser(req.body);

    if(result.error) {
        res.status(400).send(result.error.details[0].message);
        return;
    }

    let user = await User.findOne({ email: req.body.email })
    if (user) {
        res.status(404).send('User already registered');
        return;
    }

    user = new User(_.pick(req.body, ['name', 'email', 'password']))
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

module.exports = router;