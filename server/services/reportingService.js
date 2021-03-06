module.exports = function createReportingService(audit) {
  function getSend(transitionType) {
    return (startMoment, endMoment) => {
      return audit.getEvents('SEND', { transitionType }, startMoment, endMoment)
    }
  }

  return {
    getAddressSubmission: getSend('caToRo'),
    getAssessmentComplete: getSend('roToCa'),
    getFinalChecksComplete: getSend('caToDm'),
    getApprovalComplete: getSend('dmToCa'),
  }
}
