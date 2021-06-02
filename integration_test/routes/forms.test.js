const pdfParse = require('pdf-parse')
const request = require('supertest')
const { appSetup } = require('../../test/supertestSetup')
const { createSignInServiceStub } = require('../../test/mockServices')
const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/forms')
const NullTokenVerifier = require('../../server/authentication/tokenverifier/NullTokenVerifier')

describe('/forms/', () => {
  let licenceService
  let prisonerService
  let formService

  let app

  const licence = { licence: {}, stage: 'DECIDED' }
  const formTemplateData = {
    OFF_NAME: 'Mark Andrews',
    OFF_NOMS: 'A5001DY',
    EST_PREMISE: 'HMP Albany',
    CREATION_DATE: '25th June 2019',
    SENT_HDCED: '23rd August 2019',
    SENT_CRD: '15th October 2019',
    CURFEW_HOURS: { daySpecificInputs: 'Yes' },
    CURFEW_FIRST: { firstNightFrom: '' },
  }
  const prisoner = {
    lastName: 'LAST',
    firstName: 'FIRST MIDDLE',
    dateOfBirth: '01/01/2001',
    agencyLocationId: '123',
  }
  const curfewData = {
    prisoner,
    sentenceDetail: {},
    isBass: false,
    curfewAddress: {},
    curfewAddressReview: {},
    occupier: {},
    prisonEmail: {},
    reportingInstructions: {},
    conditions: { standardConditions: ['STANDARD CONDITION'], additionalConditions: ['ADDITIONAL CONDITION'] },
    riskManagement: {},
    victimLiaison: {},
    responsibleOfficer: {},
  }

  beforeEach(() => {
    licenceService = {
      getLicence: jest.fn().mockReturnValue(licence),
    }
    prisonerService = {
      getPrisonerPersonalDetails: jest.fn().mockReturnValue(prisoner),
      getPrisonerDetails: jest.fn().mockReturnValue(prisoner),
      getResponsibleOfficer: jest.fn().mockReturnValue({}),
    }
    formService = {
      getTemplateData: jest.fn().mockReturnValue(formTemplateData),
      getCurfewAddressCheckData: jest.fn().mockReturnValue(curfewData),
    }
  })

  describe('/:templateName/:bookingId/', () => {
    test('calls formService', () => {
      app = createApp('caUser')

      return request(app)
        .get('/hdc/forms/eligible/1')
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect((res) => {
          expect(Buffer.isBuffer(res.body)).toBe(true)
        })
        .expect(() => {
          expect(formService.getTemplateData).toHaveBeenCalled()
          expect(formService.getTemplateData).toHaveBeenCalledWith('eligible', licence.licence, prisoner)
        })
    })

    test('handles error and does not hang forever ', () => {
      app = createApp('caUser')
      formService.getTemplateData.mockImplementation(() => {
        throw new Error('an error message')
      })

      return request(app).get('/hdc/forms/eligible/1').expect(500)
    })

    test('should throw if a non CA tries to access the page', () => {
      app = createApp('dmUser')

      return request(app).get('/hdc/forms/eligible/1').expect(403)
    })

    test('should throw if unknown form template name', () => {
      app = createApp('caUser')

      return request(app).get('/hdc/forms/unknown/1').expect(500)
    })

    test('Generates a PDF - hard to verify exactly but can at least check that some values appear in the output', async () => {
      app = createApp('caUser')

      const res = await request(app).get('/hdc/forms/eligible/1')

      const pdf = await pdfParse(res.body)
      const pdfText = pdf.text.replace(/([\t\n])/gm, ' ') // The extracted PDF text has newline and tab characters

      expect(pdfText).toContain('Home detention curfew (tagging): eligible')
      expect(pdfText).toContain('Name: Mark Andrews')
      expect(pdfText).toContain('Location: HMP Albany')
      expect(pdfText).toContain('Prison no: A5001DY')
      expect(pdfText).toContain('Mark Andrews You are eligible for early release')
      expect(pdfText).toContain('you could be released from prison on 23rd August 2019')
    })
  })

  describe('/forms/:bookingId/', () => {
    test('should throw if a non CA tries to access the page', () => {
      app = createApp('dmUser')

      return request(app).get('/hdc/forms/1').expect(403)
    })

    test('should list all forms with bookingId', () => {
      app = createApp('caUser')

      return request(app)
        .get('/hdc/forms/1')
        .expect('Content-Type', /html/)
        .expect((res) => {
          expect(res.text).toContain('href="/hdc/forms/eligible/1')
          expect(res.text).toContain('href="/hdc/forms/approved/1')
          expect(res.text).toContain('href="/hdc/forms/refused/1')
        })
    })
  })

  describe('/curfewAddress/:bookingId/', () => {
    test('calls the form service to get the data', () => {
      app = createApp('roUser')

      return request(app)
        .get('/hdc/forms/curfewAddress/1')
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect((res) => {
          expect(Buffer.isBuffer(res.body)).toBe(true)
        })
        .expect(() => {
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalled()
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalledWith({
            agencyLocationId: '123',
            licence: licence.licence,
            isBass: false,
            isAp: false,
            bookingId: '1',
            token: 'system-token',
          })
        })
    })

    test('requests bass data when is bass', () => {
      const bassLicence = {
        licence: {
          bassReferral: { bassRequest: { bassRequested: 'Yes' } },
          proposedAddress: { addressProposed: { decision: 'No' } },
        },
        stage: 'DECIDED',
      }
      licenceService.getLicence = jest.fn().mockReturnValue(bassLicence)
      app = createApp('roUser')

      return request(app)
        .get('/hdc/forms/curfewAddress/1')
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect((res) => {
          expect(Buffer.isBuffer(res.body)).toBe(true)
        })
        .expect(() => {
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalled()
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalledWith({
            agencyLocationId: '123',
            licence: bassLicence.licence,
            isBass: true,
            isAp: false,
            bookingId: '1',
            token: 'system-token',
          })
        })
    })

    test('requests AP data when is AP', () => {
      const apLicence = { licence: { curfew: { approvedPremises: { required: 'Yes' } } }, stage: 'DECIDED' }
      licenceService.getLicence = jest.fn().mockReturnValue(apLicence)
      app = createApp('roUser')

      return request(app)
        .get('/hdc/forms/curfewAddress/1')
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect((res) => {
          expect(Buffer.isBuffer(res.body)).toBe(true)
        })
        .expect(() => {
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalled()
          expect(formService.getCurfewAddressCheckData).toHaveBeenCalledWith({
            agencyLocationId: '123',
            licence: apLicence.licence,
            isBass: false,
            isAp: true,
            bookingId: '1',
            token: 'system-token',
          })
        })
    })

    test('should throw if a non RO tries to access the page', () => {
      app = createApp('caUser')

      return request(app).get('/hdc/forms/curfewAddress/1').expect(403)
    })

    test('Generates a PDF - hard to verify exactly but can at least check that some values appear in the output', async () => {
      app = createApp('roUser')

      const res = await request(app).get('/hdc/forms/curfewAddress/1')

      const pdf = await pdfParse(res.body)
      const pdfText = pdf.text.replace(/([\t\n])/gm, ' ') // The extracted PDF text has newline and tab characters

      expect(pdfText).toContain('Home detention curfew - Address checks')
      expect(pdfText).toContain('SurnameLAST')
      expect(pdfText).toContain('Forename(s)FIRST MIDDLE')
      expect(pdfText).toContain('DOB01/01/2001')
      expect(pdfText).toContain('STANDARD CONDITION')
      expect(pdfText).toContain('ADDITIONAL CONDITION')
    })
  })

  function createApp(user) {
    const signInService = createSignInServiceStub()
    const baseRouter = standardRouter({
      licenceService,
      prisonerService,
      signInService,
      audit: null,
      tokenVerifier: new NullTokenVerifier(),
      config: null,
    })
    const route = baseRouter(createRoute({ formService }))
    return appSetup(route, user, '/hdc/forms')
  }
})
