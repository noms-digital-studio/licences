const logger = require('../../../log');
const {getLicenceStatus} = require('../../utils/licenceStatus');
const {getIn, firstItem} = require('../../utils/functionalHelpers');

module.exports = ({formConfig, prisonerService}) => {

    function approvalGets(formName) {
        return async (req, res) => {
            logger.debug(`GET /approval/${formName}/`);

            const {bookingId} = req.params;
            const prisonerInfo = await prisonerService.getPrisonerDetails(bookingId, req.user.token);

            const {nextPath, pageDataMap} = formConfig[formName];
            const dataPath = pageDataMap || ['licence', 'approval', 'release'];
            const data = getIn(res.locals.licence, dataPath) || {};
            const errors = firstItem(req.flash('errors'));
            const errorObject = getIn(errors, ['approval', 'release']) || {};
            const licenceStatus = getLicenceStatus(res.locals.licence);

            res.render(`approval/${formName}`, {
                prisonerInfo,
                bookingId,
                data,
                nextPath,
                errorObject,
                licenceStatus
            });
        };
    }

    return {
        getApprovalRelease: approvalGets('release'),
        getRefuseReason: approvalGets('refuseReason')
    };
};