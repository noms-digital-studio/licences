const express = require('express');
const {getIn} = require('../utils/functionalHelpers');
const asyncMiddleware = require('../utils/asyncMiddleware');

module.exports = function({logger, licenceService, authenticationMiddleware}) {
    const router = express.Router();
    router.use(authenticationMiddleware());

    router.use(function(req, res, next) {
        if (typeof req.csrfToken === 'function') {
            res.locals.csrfToken = req.csrfToken();
        }
        next();
    });

    router.get('/:nomisId', asyncMiddleware(async (req, res) => {

        const {nomisId} = req.params;
        const licence = await licenceService.getLicence(nomisId, {populateConditions: true});
        const status = getIn(licence, ['status']);

        console.log(nomisId);
        console.log(status);

        res.render('send/index', {nomisId, status});
    }));

    router.post('/:nomisId', asyncMiddleware(async (req, res) => {
        const {nomisId, sender, receiver} = req.body;
        await licenceService.markForHandover(nomisId, sender, receiver);
        res.redirect('/hdc/sent/' + nomisId);
    }));

    return router;
};
