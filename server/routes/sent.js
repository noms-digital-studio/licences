const express = require('express');
const {async} = require('../utils/middleware');

module.exports = function({logger, licenceService, authenticationMiddleware}) {
    const router = express.Router();

    router.use(authenticationMiddleware());

    router.use(function(req, res, next) {
        if (typeof req.csrfToken === 'function') {
            res.locals.csrfToken = req.csrfToken();
        }
        next();
    });

    router.get('/:handoverType', async(async (req, res) => {
        res.render(`sent/${req.params.handoverType}`);
    }));

    return router;
};
