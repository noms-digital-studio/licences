const nock = require('nock')

const createPdfService = require('../../server/services/pdfService')

describe('pdfService', () => {
  let licenceService
  let conditionsService
  let prisonerService
  let pdfFormatter
  let service

  const licence = { key: 'value' }
  const licenceResponse = { licence }
  const prisonerResponse = { facialImageId: 'imageId' }
  const establishmentResponse = {}
  const imageResponse = {}
  const values = {
    OFF_NAME: 'FIRST LAST',
  }
  const templateName = 'hdc_ap_pss'
  const logger = {
    info: sinon.stub(),
    error: sinon.stub(),
  }

  beforeEach(() => {
    licenceService = {
      getLicence: sinon.stub().resolves(licenceResponse),
      saveApprovedLicenceVersion: sinon.stub().resolves({}),
      update: sinon.stub().resolves({}),
    }

    conditionsService = {
      populateLicenceWithConditions: sinon.stub().resolves(licence),
    }

    prisonerService = {
      getPrisonerDetails: sinon.stub().resolves(prisonerResponse),
      getEstablishmentForPrisoner: sinon.stub().resolves(establishmentResponse),
      getPrisonerImage: sinon.stub().resolves(imageResponse),
    }

    pdfFormatter = {
      formatPdfData: sinon.stub().resolves({ values }),
      DEFAULT_PLACEHOLDER: 'placeholder',
    }

    service = createPdfService(logger, licenceService, conditionsService, prisonerService, pdfFormatter)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPdfLicenceData', () => {
    const rawLicence = {
      licence: { key: 'value' },
      approvedVersion: 1.3,
      approvedVersionDetails: { a: 'a' },
      versionDetails: { a: 'a' },
    }

    it('should request details from services and pass to formatter', async () => {
      await service.getPdfLicenceData(templateName, '123', rawLicence, 'token', false)

      expect(conditionsService.populateLicenceWithConditions).to.be.calledOnce()
      expect(conditionsService.populateLicenceWithConditions).to.be.calledWith(licence)

      expect(prisonerService.getPrisonerDetails).to.be.calledOnce()
      expect(prisonerService.getPrisonerDetails).to.be.calledWith('123')

      expect(prisonerService.getEstablishmentForPrisoner).to.be.calledOnce()
      expect(prisonerService.getEstablishmentForPrisoner).to.be.calledWith('123')

      expect(prisonerService.getPrisonerImage).to.be.calledOnce()
      expect(prisonerService.getPrisonerImage).to.be.calledWith('imageId')

      expect(pdfFormatter.formatPdfData).to.be.calledOnce()
      expect(pdfFormatter.formatPdfData).to.be.calledWith(
        templateName,
        {
          licence,
          prisonerInfo: prisonerResponse,
          establishment: establishmentResponse,
        },
        imageResponse,
        { a: 'a', approvedVersion: 1.3 }
      )
    })

    it('should throw if error in other service', () => {
      prisonerService.getPrisonerDetails.rejects(new Error('dead'))
      return expect(service.getPdfLicenceData(templateName, '123', rawLicence, 'token', false)).to.be.rejected()
    })

    it('should not try to get image data if missing facialImageId, use null instead', async () => {
      prisonerService.getPrisonerDetails.resolves({})

      await service.getPdfLicenceData(templateName, '123', rawLicence, 'token', false)

      expect(prisonerService.getPrisonerImage).not.to.be.calledOnce()

      expect(pdfFormatter.formatPdfData).to.be.calledOnce()
      expect(pdfFormatter.formatPdfData).to.be.calledWith(
        templateName,
        {
          licence,
          prisonerInfo: {},
          establishment: establishmentResponse,
        },
        null,
        { a: 'a', approvedVersion: 1.3 }
      )
    })

    it('should use null for photo if error getting image', async () => {
      prisonerService.getPrisonerImage.rejects(new Error('dead'))

      await service.getPdfLicenceData(templateName, '123', rawLicence, 'token', false)

      expect(prisonerService.getPrisonerImage).to.be.calledOnce()

      expect(pdfFormatter.formatPdfData).to.be.calledOnce()
      expect(pdfFormatter.formatPdfData).to.be.calledWith(
        templateName,
        {
          licence,
          prisonerInfo: prisonerResponse,
          establishment: establishmentResponse,
        },
        null,
        { a: 'a', approvedVersion: 1.3 }
      )
    })

    it('should update licence if template and offence date check are different to previous version', async () => {
      const rawLicenceData = {
        licence: {
          key: 'value',
          document: {
            template: {
              decision: 'hdc_ap',
              offenceCommittedBeforeFeb2015: 'No',
            },
          },
        },
        versionDetails: { version: 4, vary_version: 0 },
        approvedVersionDetails: { version: 3, template: 'hdc_ap_pss' },
      }

      await service.getPdfLicenceDataAndUpdateLicenceType(templateName, 'Yes', '123', rawLicenceData, 'token')

      expect(licenceService.update).to.be.calledOnce()
    })

    it('should not update licence if template and offence date check is same', async () => {
      const rawLicenceData = {
        licence: {
          key: 'value',
          document: {
            template: {
              decision: 'hdc_ap_pss',
              offenceCommittedBeforeFeb2015: 'Yes',
            },
          },
        },
        versionDetails: { version: 4, vary_version: 0 },
        approvedVersionDetails: { version: 3, template: 'hdc_ap_pss' },
      }

      await service.getPdfLicenceDataAndUpdateLicenceType(templateName, 'Yes', '123', rawLicenceData, 'token')

      expect(licenceService.update).not.to.be.calledOnce()
    })

    it('should write to the database when there is no licence type', async () => {
      const rawLicenceData = {
        licence: {
          key: 'value',
          document: {
            template: {
              decision: 'hdc_ap_pss',
              offenceCommittedBeforeFeb2015: 'Yes',
            },
          },
        },
        versionDetails: { version: 4, vary_version: 0 },
        approvedVersionDetails: { version: 3, template: 'hdc_ap_pss' },
      }

      const templateId = ''
      const offenceCommittedBefore = 'Yes'
      await service.updateOffenceCommittedBefore(rawLicenceData, '123', offenceCommittedBefore, templateId, 'token')

      expect(licenceService.update).to.be.calledOnce()
    })

    it('should not write to the database if templateId and licece type havent changed', async () => {
      const rawLicenceData = {
        licence: {
          key: 'value',
          document: {
            template: {
              decision: '',
              offenceCommittedBeforeFeb2015: 'Yes',
            },
          },
        },
        versionDetails: { version: 4, vary_version: 0 },
        approvedVersionDetails: { version: 3, template: 'hdc_ap_pss' },
      }

      const templateId = ''
      const offenceCommittedBefore = 'Yes'
      await service.updateOffenceCommittedBefore(rawLicenceData, '123', offenceCommittedBefore, templateId, 'token')

      expect(licenceService.update).not.to.be.calledOnce()
    })
  })
})
