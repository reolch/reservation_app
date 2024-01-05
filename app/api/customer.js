const express = require('express');
const path = require('path');
const customerRouter = express.Router();

const firebaseService = require('../services/firebaseService');

customerRouter.get('/', async (req, res) => {
    console.log('GET /');
    res.sendFile(path.join(__dirname, '..', 'public', 'customer.html'));
});

// 顧客情報を取得するエンドポイント
customerRouter.get('/:customerId', async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customerData = await firebaseService.getCustomerById(customerId);
        if (customerData) {
            res.status(200).json(customerData);
        } else {
            res.status(404).json({ message: "Customer not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = customerRouter;
