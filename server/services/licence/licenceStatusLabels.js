const { LicenceStage } = require('../config/licenceStage')
const { TaskState, anyStarted } = require('../config/taskState')

module.exports = { getStatusLabel }

const status = {
  // active
  notStarted: { statusLabel: 'Not started', activeCase: true },
  eligible: { statusLabel: 'Eligible', activeCase: true },
  approvedPremisesRequired: { statusLabel: 'Approved premises', activeCase: true },
  addressRejected: { statusLabel: 'Address not suitable', activeCase: true },
  bassRequest: { statusLabel: 'BASS request', activeCase: true },
  bassAreaRejected: { statusLabel: 'BASS area rejected', activeCase: true },
  approved: { statusLabel: 'Approved', activeCase: true },
  postponed: { statusLabel: 'Postponed', activeCase: true },
  addressSuitable: { statusLabel: 'Address suitable', activeCase: true },
  withPrison: { statusLabel: 'With prison', activeCase: true },
  withResponsibleOfficer: { statusLabel: 'With responsible officer', activeCase: true },
  withDecisionMaker: { statusLabel: 'With decision maker', activeCase: true },
  varyingLicence: { statusLabel: 'Varying licence', activeCase: true },
  awaitingRefusal: { statusLabel: 'Awaiting refusal', activeCase: true },
  licenceCreated: { statusLabel: 'Licence created', activeCase: true },
  notComplete: { statusLabel: 'Not complete', activeCase: true },
  inProgress: { statusLabel: 'In progress', activeCase: true },

  // inactive
  notEligible: { statusLabel: 'Not eligible', activeCase: false },
  presumedUnsuitable: { statusLabel: 'Presumed unsuitable', activeCase: false },
  notEnoughTime: { statusLabel: 'Not enough time', activeCase: false },
  optedOut: { statusLabel: 'Opted out', activeCase: false },
  refused: { statusLabel: 'Refused', activeCase: false },
  bassOfferWithdrawn: { statusLabel: 'BASS offer withdrawn', activeCase: false },
  bassRequestWithdrawn: { statusLabel: 'BASS request withdrawn', activeCase: false },
}

function getStatusLabel(licenceStatus, role) {
  // can these things all happen?
  if (
    !licenceStatus ||
    !licenceStatus.stage ||
    licenceStatus.stage === LicenceStage.UNSTARTED ||
    !licenceStatus.decisions ||
    !licenceStatus.tasks
  ) {
    return status.notStarted
  }

  return statusLabels(licenceStatus, role)
}

function statusLabels(licenceStatus, role) {
  const labels = {
    [LicenceStage.ELIGIBILITY]: {
      READONLY: caEligibilityLabel,
      RO_READONLY: () => status.withPrison,
      CA: caEligibilityLabel,
      RO: () => status.withPrison,
      DM: () => status.withPrison,
    },
    [LicenceStage.PROCESSING_RO]: {
      READONLY: roProcessingCaLabel,
      RO_READONLY: () => status.withResponsibleOfficer,
      CA: roProcessingCaLabel,
      RO: roProcessingLabel,
      DM: () => status.withResponsibleOfficer,
    },
    [LicenceStage.PROCESSING_CA]: {
      READONLY: caProcessingLabel,
      RO_READONLY: caProcessingRoLabel,
      CA: caProcessingLabel,
      RO: caProcessingRoLabel,
      DM: caProcessingDmLabel,
    },
    [LicenceStage.APPROVAL]: {
      READONLY: () => status.withDecisionMaker,
      RO_READONLY: () => status.withDecisionMaker,
      CA: () => status.withDecisionMaker,
      RO: () => status.withDecisionMaker,
      DM: dmProcessingLabel,
    },
    [LicenceStage.DECIDED]: {
      READONLY: caDecisionLabel,
      RO_READONLY: decisionLabel,
      CA: caDecisionLabel,
      RO: decisionLabel,
      DM: decisionLabel,
    },
    [LicenceStage.MODIFIED]: {
      READONLY: caDecisionLabel,
      RO_READONLY: decisionLabel,
      CA: caDecisionLabel,
      RO: decisionLabel,
      DM: decisionLabel,
    },
    [LicenceStage.MODIFIED_APPROVAL]: {
      READONLY: caDecisionLabel,
      RO_READONLY: decisionLabel,
      CA: caDecisionLabel,
      RO: decisionLabel,
      DM: decisionLabel,
    },
    [LicenceStage.VARY]: {
      READONLY: () => status.varyingLicence,
      RO_READONLY: () => status.varyingLicence,
      CA: () => status.varyingLicence,
      RO: () => status.varyingLicence,
      DM: () => status.varyingLicence,
    },
  }

  return labels[licenceStatus.stage][role](licenceStatus)
}

function caEligibilityLabel(licenceStatus) {
  const labels = [
    { decision: 'excluded', label: status.notEligible },
    { decision: 'unsuitableResult', label: status.presumedUnsuitable },
    { decision: 'insufficientTimeContinue', label: status.notEnoughTime },
    { decision: 'insufficientTime', label: status.notEnoughTime },
    { decision: 'optedOut', label: status.optedOut },
    { decision: 'bassReferralNeeded', label: status.eligible },
    { decision: 'curfewAddressRejected', label: status.addressRejected },
    { decision: 'eligible', label: status.eligible },
  ]

  return getLabel(labels, licenceStatus) || status.notStarted
}

function caProcessingLabel(licenceStatus) {
  const bassRouteLabels = [
    { decision: 'bassWithdrawalReason', value: 'offer', label: status.bassOfferWithdrawn },
    { decision: 'bassWithdrawalReason', value: 'request', label: status.bassRequestWithdrawn },
  ]

  const addressRouteLabels = [
    { decision: 'curfewAddressWithdrawn', label: status.addressRejected },
    { decision: 'curfewAddressRejected', label: status.addressRejected },
  ]

  const commonLabels = [
    { decision: 'finalChecksRefused', label: status.refused },
    { decision: 'postponed', label: status.postponed },
    { decision: 'excluded', label: status.notEligible },
    { decision: 'optedOut', label: status.optedOut },
    { decision: 'approvedPremisesRequired', label: status.approvedPremisesRequired },
  ]

  const labels = licenceStatus.decisions.bassReferralNeeded
    ? commonLabels.concat(bassRouteLabels)
    : commonLabels.concat(addressRouteLabels)

  return getLabel(labels, licenceStatus) || status.addressSuitable
}

function caProcessingRoLabel(licenceStatus) {
  if (licenceStatus && licenceStatus.decisions && !licenceStatus.decisions.eligible) return status.notEligible
  const labels = [{ decision: 'postponed', label: status.postponed }]
  return getLabel(labels, licenceStatus) || status.withPrison
}

function caProcessingDmLabel(licenceStatus) {
  const labels = [{ decision: 'postponed', label: status.postponed }]

  return getLabel(labels, licenceStatus) || status.withPrison
}

function roProcessingLabel(licenceStatus) {
  const optOutLabel = getLabel([{ decision: 'optedOut', label: status.optedOut }], licenceStatus)

  if (optOutLabel) {
    return optOutLabel
  }

  if (licenceStatus.decisions.bassReferralNeeded) {
    if (licenceStatus.tasks.bassAreaCheck === TaskState.UNSTARTED) {
      return status.notStarted
    }

    if (licenceStatus.decisions.bassAreaNotSuitable) {
      return status.bassAreaRejected
    }
  }

  if (
    anyStarted([
      licenceStatus.tasks.bassAreaCheck,
      licenceStatus.tasks.curfewAddressReview,
      licenceStatus.tasks.approvedPremisesAddress,
      licenceStatus.tasks.curfewHours,
      licenceStatus.tasks.licenceConditions,
      licenceStatus.tasks.riskManagement,
      licenceStatus.tasks.victim,
      licenceStatus.tasks.reportingInstructions,
    ])
  ) {
    return status.inProgress
  }

  return status.notStarted
}

function roProcessingCaLabel(licenceStatus) {
  const labels = [{ decision: 'optedOut', label: status.optedOut }]

  return getLabel(labels, licenceStatus) || status.withResponsibleOfficer
}

function dmProcessingLabel(licenceStatus) {
  const labels = [{ decision: 'insufficientTimeStop', label: status.awaitingRefusal }]

  return getLabel(labels, licenceStatus) || status.notStarted
}

function caDecisionLabel(licenceStatus) {
  const { decisions, tasks } = licenceStatus

  if (decisions.postponed) return status.postponed

  if (decisions.approved) {
    if (tasks.createLicence === TaskState.DONE) {
      return status.licenceCreated
    }
    return status.approved
  }

  if (decisions.refused) return status.refused
  return status.notComplete
}

function decisionLabel(licenceStatus) {
  if (licenceStatus.decisions.approved) {
    if (licenceStatus.tasks.createLicence === TaskState.DONE) {
      return status.licenceCreated
    }
  }

  const labels = [
    { decision: 'approved', label: status.approved },
    { decision: 'refused', label: status.refused },
  ]

  return getLabel(labels, licenceStatus) || status.notComplete
}

function getLabel(labels, licenceStatus) {
  const found = labels.find((label) => {
    const value = label.value || true
    return licenceStatus.decisions[label.decision] === value
  })

  return found ? found.label : null
}
