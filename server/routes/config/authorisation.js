module.exports = {
  '/admin': {
    authorised: [{ role: 'BATCHLOAD' }],
  },
  '/caseList/': {
    authorised: [{ role: 'RO_READONLY' }, { role: 'READONLY' }, { role: 'CA' }, { role: 'RO' }, { role: 'DM' }],
  },
  '/hdc/eligibility/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/forms/curfewAddress': {
    authorised: [{ role: 'RO' }],
  },
  '/hdc/forms/': {
    authorised: [{ role: 'CA' }, { role: 'RO' }],
  },
  '/hdc/proposedAddress/curfewAddressChoice/': {
    authorised: [{ role: 'CA' }, { role: 'RO', stage: ['VARY'] }],
  },
  'hdc/bassReferral/bassRequest': {
    authorised: [{ role: 'CA' }],
  },
  'hdc/bassReferral/bassAreaCheck': {
    authorised: [{ role: 'RO' }],
  },
  'hdc/bassReferral/bassOffer': {
    authorised: [{ role: 'CA' }],
  },
  'hdc/bassReferral/bassWithdrawn': {
    authorised: [{ role: 'CA' }],
  },
  'hdc/bassReferral/rejected': {
    authorised: [{ role: 'CA' }],
  },
  'hdc/bassReferral/unsuitable': {
    authorised: [{ role: 'CA' }],
  },
  'hdc/proposedAddress/curfewAddress': {
    authorised: [{ role: 'CA' }, { role: 'RO' }],
  },
  'hdc/eligibility/exceptionalCircumstances/': {
    authorised: [{ role: 'CA' }],
  },

  '/hdc/curfew/withdrawAddress/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/curfew/withdrawConsent/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/curfew/reinstateAddress/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/curfew/consentWithdrawn/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/curfew/addressWithdrawn/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/curfew/firstNight/': {
    authorised: [{ role: 'CA' }, { role: 'RO', stage: ['VARY'] }],
  },
  '/hdc/curfew/': {
    authorised: [{ role: 'RO' }, { role: 'CA', stage: ['PROCESSING_CA', 'DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'] }],
  },
  '/hdc/risk/': {
    authorised: [
      { role: 'RO' },
      { role: 'CA', stage: ['ELIGIBILITY', 'PROCESSING_CA', 'DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'] },
    ],
  },
  '/hdc/victim/': {
    authorised: [{ role: 'RO' }, { role: 'CA', stage: ['PROCESSING_CA', 'DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'] }],
  },
  '/hdc/licenceConditions/': {
    authorised: [{ role: 'RO' }, { role: 'CA', stage: ['PROCESSING_CA', 'DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'] }],
  },
  '/hdc/reporting/': {
    authorised: [{ role: 'RO' }, { role: 'CA', stage: ['PROCESSING_CA', 'DECIDED', 'MODIFIED', 'MODIFIED_APPROVAL'] }],
  },

  '/hdc/finalChecks/': {
    authorised: [{ role: 'CA' }],
  },

  '/hdc/approval/': {
    authorised: [{ role: 'DM' }],
  },

  '/hdc/pdf/': {
    authorised: [{ role: 'CA' }, { role: 'RO' }],
  },

  '/hdc/send/addressReview/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/send/finalChecks/': {
    authorised: [{ role: 'RO' }],
  },
  '/hdc/send/approval/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/send/decided/': {
    authorised: [{ role: 'DM' }],
  },
  '/hdc/send/return/': {
    authorised: [{ role: 'DM' }],
  },
  '/hdc/send/refusal/': {
    authorised: [{ role: 'CA' }],
  },
  '/hdc/send/addressRejected/': {
    authorised: [{ role: 'RO' }],
  },
  '/hdc/send/optedOut/': {
    authorised: [{ role: 'RO' }],
  },
}
