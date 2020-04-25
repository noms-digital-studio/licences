const { continueBtn } = require('./utils/actions')

const getCaAction = ({ decisions, tasks, stage }) => {
  const { approved, bassReferralNeeded, addressWithdrawn, approvedPremisesRequired } = decisions
  const { bassAddress, approvedPremisesAddress } = tasks

  if (!approved || stage === 'MODIFIED_APPROVAL') {
    return null
  }

  const outstandingApproved = approvedPremisesRequired && approvedPremisesAddress !== 'DONE'
  const outstandingBass = bassReferralNeeded && bassAddress !== 'DONE'

  return !outstandingApproved && !outstandingBass && !addressWithdrawn
    ? continueBtn('/hdc/pdf/selectLicenceType/')
    : null
}

module.exports = {
  ca: ({ decisions, tasks, stage }) => {
    return {
      title: 'Create licence',
      action: getCaAction({ decisions, tasks, stage }),
    }
  },
  vary: (version) => () => ({
    title: 'Create licence',
    label: `Ready to create version ${version}`,
    action: { type: 'btn', text: 'Continue', href: '/hdc/pdf/selectLicenceType/' },
  }),
}
