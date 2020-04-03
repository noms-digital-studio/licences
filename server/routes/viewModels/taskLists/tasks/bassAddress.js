const { standardAction, viewEdit } = require('./utils/actions')

module.exports = {
  getLabel: ({ decisions, tasks }) => {
    const {
      bassAreaNotSuitable,
      bassWithdrawn,
      bassWithdrawalReason,
      bassAccepted,
      approvedPremisesRequired,
    } = decisions
    const { bassOffer, bassAddress } = tasks

    if (approvedPremisesRequired) {
      return 'Approved premises required'
    }

    if (bassAreaNotSuitable) {
      return 'BASS area rejected'
    }

    if (bassWithdrawn) {
      return bassWithdrawalReason === 'offer' ? 'BASS offer withdrawn' : 'BASS request withdrawn'
    }

    if (bassOffer === 'DONE') {
      if (bassAccepted === 'Yes') {
        return bassAddress === 'DONE' ? 'Offer made and address provided' : 'Offer made, awaiting address'
      }
      return bassAccepted === 'Unsuitable' ? 'WARNING||Not suitable for BASS' : 'WARNING||Address not available'
    }

    return 'Not completed'
  },

  getCaAction: ({ tasks }, dataQa) => {
    const { bassAddress, approvedPremisesAddress } = tasks
    if (approvedPremisesAddress === 'DONE') {
      return viewEdit('/hdc/bassReferral/approvedPremisesChoice/', dataQa)
    }
    return standardAction(bassAddress, '/hdc/bassReferral/bassOffer/', dataQa)
  },
}
