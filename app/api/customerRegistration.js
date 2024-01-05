const express = require('express');
const path = require('path');
const customerRegistrationRouter = express.Router();

const firebaseService = require('../services/firebaseService');

customerRegistrationRouter.get('/', async (req, res) => {
    console.log('GET /');
    res.sendFile(path.join(__dirname, '..', 'public', 'CustomerRegistration.html'));
});

customerRegistrationRouter.post('/', async (req, res) => {
    console.log('POST /: ', req.body);
    await firebaseService.registerCustomer(req, res);
});


module.exports = customerRegistrationRouter;
