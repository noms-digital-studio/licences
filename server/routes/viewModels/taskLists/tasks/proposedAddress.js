const { standardAction, standardActionMulti } = require('./utils/actions')

module.exports = {
  getLabel: ({ decisions, tasks }) => {
    const { optedOut, bassReferralNeeded, bassAreaNotSuitable, curfewAddressRejected } = decisions
    const { bassRequest, curfewAddress } = tasks

    if (optedOut) {
      return 'Offender has opted out of HDC'
    }

    if (bassReferralNeeded) {
      if (bassAreaNotSuitable) {
        return 'ALERT||BASS area rejected'
      }
      if (bassRequest === 'DONE') {
        return 'Completed'
      }
      return 'Not completed'
    }

    if (curfewAddressRejected) {
      return 'ALERT||Address rejected'
    }

    if (curfewAddress === 'DONE') {
      return 'Completed'
    }

    return 'Not completed'
  },

  getCaAction: ({ decisions, tasks }) => {
    const { curfewAddressRejected, bassAreaNotSuitable } = decisions
    const { curfewAddress, optOut, bassRequest } = tasks

    if (curfewAddressRejected) {
      return standardAction(curfewAddress, '/hdc/proposedAddress/rejected/')
    }

    if (bassAreaNotSuitable) {
      return standardAction(curfewAddress, '/hdc/bassReferral/rejected/')
    }

    return standardActionMulti([curfewAddress, optOut, bassRequest], '/hdc/proposedAddress/curfewAddressChoice/')
  },
}
