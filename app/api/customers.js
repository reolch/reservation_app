const express = require('express');
const path = require('path');
const customersRouter = express.Router();

const firebaseService = require('../services/firebaseService');

customersRouter.get('/', async (req, res) => {
    try {
        const customers = await firebaseService.getDocumentsFromCollection('Customers');
        console.log(customers);
        res.json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

customersRouter.get('/:id', async (req, res) => {
    try {
        const customer = await firebaseService.getCustomerById(req.params.id);
        if (customer) {
            console.log(customer);
            res.json(customer);
        } else {
            res.status(404).send('Customer Not Found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = customersRouter;
