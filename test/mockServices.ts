export const createSignInServiceStub = () => ({
  signIn: jest.fn(),
  refresh: jest.fn(),
  getClientCredentialsTokens: jest.fn().mockReturnValue({ token: 'system-token' }),
})

export const createLicenceServiceStub = () => ({
  getLicence: jest.fn().mockReturnValue({ licence: { key: 'value' } }),
  update: jest.fn(),
  updateSection: jest.fn(),
  updateLicenceConditions: jest.fn(),
  deleteLicenceCondition: jest.fn(),
  markForHandover: jest.fn(),
  createLicence: jest.fn(),
  updateAddress: jest.fn(),
  updateAddresses: jest.fn(),
  getEligibilityErrors: jest.fn(),
  addAddress: jest.fn(),
  addSplitDateFields: jest.fn((arg) => arg),
  removeDecision: jest.fn().mockReturnValue({}),
  validateForm: jest.fn().mockReturnValue({}),
  validateFormGroup: jest.fn().mockReturnValue({}),
  rejectProposedAddress: jest.fn().mockReturnValue({}),
  reinstateProposedAddress: jest.fn().mockReturnValue({}),
  createLicenceFromFlatInput: jest.fn().mockReturnValue({}),
  addCurfewHoursInput: jest.fn().mockReturnValue({}),
  rejectBass: jest.fn(),
  withdrawBass: jest.fn(),
  reinstateBass: jest.fn(),
  resetLicence: jest.fn(),
})

export const createLduServiceStub = () => ({
  getAllProbationAreas: jest.fn().mockReturnValue([]),
  getLdusForProbationArea: jest.fn().mockReturnValue([]),
  updateActiveLdus: jest.fn().mockReturnValue(null),
  getProbationArea: jest.fn(),
})

export const createConditionsServiceStub = () => ({
  getStandardConditions: jest.fn(),
  getAdditionalConditions: jest.fn(),
  formatConditionInputs: jest.fn(),
  populateLicenceWithConditions: jest.fn().mockReturnValue({}),
  getNonStandardConditions: jest.fn(),
})

export const createPrisonerServiceStub = () => ({
  getOrganisationContactDetails: jest.fn(),
  getEstablishment: jest.fn(),
  getEstablishmentForPrisoner: jest.fn().mockReturnValue(''),
  getPrisonerDetails: jest.fn().mockReturnValue({}),
  getPrisonerImage: jest.fn().mockReturnValue({ image: 'image' }),
  getPrisonerPersonalDetails: jest.fn().mockReturnValue({ firstName: 'fn', lastName: 'ln', dateOfBirth: '1980-01-01' }),
  getDestinations: jest.fn(),
  getDestinationForRole: jest.fn(),
})

export const createPdfServiceStub = () => ({
  getPdfLicenceData: jest.fn(),
  checkAndTakeSnapshot: jest.fn(),
  getPdf: jest.fn(),
  generatePdf: jest.fn(),
  updateLicenceType: jest.fn(),
})

export const createFormServiceStub = () => ({
  generatePdf: jest.fn(),
  getTemplateData: jest.fn(),
  getCurfewAddressCheckData: jest.fn(),
})

export const createUserAdminServiceStub = () => ({
  getRoUsers: jest.fn(),
  getRoUser: jest.fn(),
  getRoUserByDeliusId: jest.fn().mockReturnValue({}),
  updateRoUser: jest.fn(),
  deleteRoUser: jest.fn(),
  addRoUser: jest.fn(),
  findRoUsers: jest.fn(),
  verifyUserDetails: jest.fn(),
})

export const createWarningsClientStub = () => ({
  raiseWarning: jest.fn(),
  acknowledgeWarnings: jest.fn(),
  getOutstandingWarnings: () => jest.fn(),
  getAcknowledgedWarnings: () => jest.fn(),
})

export const createNotificationServiceStub = () => ({
  notify: jest.fn(),
  getNotificationData: jest.fn(),
})

export const caseListServiceStub = {
  getHdcCaseList: jest.fn().mockReturnValue([]),
}

export const createNomisPushServiceStub = () => ({
  pushStatus: jest.fn(),
  pushChecksPassed: jest.fn(),
  resetHDC: jest.fn(),
})

export const createCaServiceStub = {
  getReasonForNotContinuing: jest.fn().mockReturnValue([]),
}
