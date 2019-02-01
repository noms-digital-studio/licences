const {asyncMiddleware} = require('../utils/middleware');
const path = require('path');
const {getLicenceStatus} = require('../utils/licenceStatus');
const {getStatusLabel} = require('../utils/licenceStatusLabels');
const {getAllowedTransition} = require('../utils/licenceStatusTransitions');
const {isEmpty} = require('../utils/functionalHelpers');
const getTaskListModel = require('./viewModels/taskListModels');
const logger = require('../../log');

module.exports = ({prisonerService, licenceService, caseListService, audit}) => router => {

    router.get('/:bookingId', asyncMiddleware(async (req, res) => {
        const {bookingId} = req.params;
        const prisonerInfo = await prisonerService.getPrisonerDetails(bookingId, res.locals.token);
        if (isEmpty(prisonerInfo)) {
            logger.info('Prisoner not found for task list', bookingId);
            return res.redirect('/caseList');
        }

        const postRelease = prisonerInfo.agencyLocationId ? prisonerInfo.agencyLocationId.toUpperCase() === 'OUT' : false;
        const licence = await licenceService.getLicence(bookingId);

        const licenceStatus = getLicenceStatus(licence);
        const allowedTransition = getAllowedTransition(licenceStatus, req.user.role);
        const statusLabel = getStatusLabel(licenceStatus, req.user.role);

        const {taskListModel, taskListView} = getTaskListModel(
            req.user.role, postRelease, licenceStatus, licence || {}, allowedTransition
        );

        res.render(taskListView ? `taskList/${taskListView}` : 'taskList/taskListBuilder', {
            licenceStatus,
            licenceVersion: licence ? licence.version : 0,
            approvedVersionDetails: licence ? licence.approvedVersionDetails : 0,
            allowedTransition,
            statusLabel,
            prisonerInfo,
            bookingId,
            taskListModel,
            postApproval: ['DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'].includes(licenceStatus.stage)
        });
    }));

    router.post('/eligibilityStart', asyncMiddleware(async (req, res) => {
        const {bookingId} = req.body;

        const existingLicence = await licenceService.getLicence(bookingId);

        if (!existingLicence) {
            await licenceService.createLicence({bookingId});
            audit.record('LICENCE_RECORD_STARTED', req.user.staffId, {bookingId});
        }

        res.redirect(`/hdc/eligibility/excluded/${bookingId}`);
    }));

    router.post('/varyStart', asyncMiddleware(async (req, res) => {
        const {bookingId} = req.body;
        await licenceService.createLicence({
            bookingId,
            data: {variedFromLicenceNotInSystem: true},
            stage: 'VARY'});
        audit.record('VARY_NOMIS_LICENCE_CREATED', req.user.staffId, {bookingId});

        res.redirect(`/hdc/vary/evidence/${bookingId}`);
    }));

    router.get('/image/:imageId', asyncMiddleware(async (req, res) => {
        const prisonerImage = await prisonerService.getPrisonerImage(req.params.imageId, res.locals.token);

        if (!prisonerImage) {
            const placeHolder = path.join(__dirname, '../../assets/images/no-photo.png');
            res.status(302);
            return res.sendFile(placeHolder);
        }
        res.contentType('image/jpeg');
        res.send(prisonerImage);
    }));

    return router;
};


