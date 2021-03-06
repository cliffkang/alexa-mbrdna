/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';

const { handler } = require('./index');

const server = express();
server.use(express.json());

// Create POST route
server.post('/', (req, res) => {
    console.log('req in server', req);
    // Create dummy context with fail and succeed functions
    const context = {
        fail: () => res.sendStatus(500),
        succeed: data => res.send(data),
    };

    // Initialize alexa sdk
    handler(req.body, context);
});

// Start express server
server.listen(3000, () => {
    console.log('Local alexa skill listening on port 3000!');
});