const {taskStates} = require('../models/taskStates');

module.exports = {getAllowedTransition};

function getAllowedTransition(licenceStatus, role) {

    if (!licenceStatus) {
        return null;
    }

    switch (role) {


        case 'RO':
            if (canSendRoToCa(licenceStatus)) {
                return 'roToCa';
            }

            return null;

        case 'DM':
            if (canSendDmToCa(licenceStatus)) {
                return 'dmToCa';
            }

            return null;

        default:

            if (canSendCaToDmRefusal(licenceStatus)) {
                return 'caToDmRefusal';
            }

            if (canSendCaToDm(licenceStatus)) {
                return 'caToDm';
            }

            if (canSendCaToRo(licenceStatus)) {
                return 'caToRo';
            }

            return null;
    }
}

function canSendRoToCa(licenceStatus) {
    const tasks = licenceStatus.tasks;
    const stage = licenceStatus.stage;
    const decisions = licenceStatus.decisions || {};

    if (stage !== 'PROCESSING_RO') {
        return false;
    }

    if (decisions.bassReferralNeeded && tasks.bassAreaCheck === taskStates.DONE) {
        return true;
    }

    if (decisions.curfewAddressApproved === 'rejected') {
        return true;
    }

    if (decisions.optedOut) {
        return true;
    }

    const required = [
        tasks.curfewAddressReview,
        tasks.curfewHours,
        tasks.licenceConditions,
        tasks.riskManagement,
        tasks.reportingInstructions
    ];

    return required.every(it => it === taskStates.DONE);
}

function canSendDmToCa(licenceStatus) {
    const {tasks, stage} = licenceStatus;
    return tasks.approval === taskStates.DONE && stage === 'APPROVAL';
}

function canSendCaToRo(licenceStatus) {
    const {tasks, decisions, stage} = licenceStatus;

    const {eligible, optedOut, bassReferralNeeded, curfewAddressApproved} = decisions;

    const addressReviewNeeded = !bassReferralNeeded &&
        ['PROCESSING_CA', 'MODIFIED', 'MODIFIED_APPROVAL'].includes(stage) && tasks.curfewAddressReview === 'UNSTARTED';

    if (addressReviewNeeded) {
        return true;
    }

    const notToProgress = !eligible || optedOut || curfewAddressApproved === 'rejected';

    if (stage !== 'ELIGIBILITY' || notToProgress) {
        return false;
    }

    const required = [
        tasks.exclusion,
        tasks.crdTime,
        tasks.suitability,
        tasks.optOut,
        tasks.curfewAddress
    ];

    const allTaskComplete = required.every(it => it === taskStates.DONE);

    if (bassReferralNeeded) {
        return allTaskComplete && tasks.bassReferral === taskStates.DONE;
    }

    return allTaskComplete;
}

function canSendCaToDmRefusal(licenceStatus) {
    const {stage, decisions} = licenceStatus;
    const {curfewAddressApproved, bassAreaNotSuitable} = decisions;

    if (['PROCESSING_CA', 'MODIFIED', 'MODIFIED_APPROVAL'].includes(stage)) {
        return curfewAddressApproved === 'withdrawn' || bassAreaNotSuitable;
    }

    if (stage === 'ELIGIBILITY') {
        const {eligible, insufficientTimeStop} = decisions;

        if (!eligible && !insufficientTimeStop) {
            return false;
        }

        return insufficientTimeStop || curfewAddressApproved === 'rejected' || bassAreaNotSuitable;
    }

    return false;
}

function canSendCaToDm(licenceStatus) {
    const tasks = licenceStatus.tasks;
    const decisions = licenceStatus.decisions;
    const stage = licenceStatus.stage;

    if (stage === 'MODIFIED_APPROVAL') {
        return true;
    }

    if (stage !== 'PROCESSING_CA') {
        return false;
    }

    if (decisions.insufficientTimeStop) {
        return true;
    }

    const required = getRequiredTasks(decisions, tasks);
    const tasksComplete = required.every(it => it === taskStates.DONE);

    const addressOk = decisions.bassReferralNeeded || decisions.curfewAddressApproved === 'approved';

    const decisionsOk =
        !decisions.excluded &&
        !decisions.postponed &&
        !decisions.finalChecksRefused &&
        addressOk;

    return tasksComplete && decisionsOk;
}

function getRequiredTasks(decisions, tasks) {

    if (decisions.bassReferralNeeded) {
        return [
            tasks.bassOffer,
            tasks.finalChecks
        ];
    }

    return [
        tasks.finalChecks
    ];
}
