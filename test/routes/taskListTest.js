const request = require('supertest')

const {
  createPrisonerServiceStub,
  createLicenceServiceStub,
  caseListServiceStub,
  appSetup,
  auditStub,
  createSignInServiceStub,
  createCaServiceStub,
} = require('../supertestSetup')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/taskList')

const prisonerInfoResponse = {
  bookingId: 1,
  facialImageId: 2,
  dateOfBirth: '23/12/1971',
  firstName: 'F',
  middleName: 'M',
  lastName: 'L',
  offenderNo: 'noms',
  aliases: 'Alias',
  assignedLivingUnitDesc: 'Loc',
  physicalAttributes: { gender: 'Male' },
  imageId: 'imgId',
  captureDate: '23/11/1971',
  sentenceExpiryDate: '03/12/1985',
  sentenceDetail: {
    effectiveAutomaticReleaseDate: '01/01/2001',
  },
}

describe('GET /taskList/:prisonNumber', () => {
  let prisonerService
  let licenceService
  let caService

  beforeEach(() => {
    licenceService = createLicenceServiceStub()
    prisonerService = createPrisonerServiceStub()
    prisonerService.getPrisonerDetails = sinon.stub().returns(prisonerInfoResponse)
    caService = createCaServiceStub
  })

  describe('User is CA', () => {
    it('should call caService.getReasonForNotContinuing', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(caService.getReasonForNotContinuing).to.be.calledOnce()
        })
    })

    it('should return error message for NO_OFFENDER_NUMBER', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })
      caService.getReasonForNotContinuing.resolves({ NO_OFFENDER_NUMBER: 'NO_OFFENDER_NUMBER' })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.include('Offender number required but it is not entered in Delius')
        })
    })

    it('should return error message for NO_COM_ASSIGNED', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })
      caService.getReasonForNotContinuing.resolves({ NO_COM_ASSIGNED: 'NO_COM_ASSIGNED' })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.include('A Community Offender Manager has not been assigned')
        })
    })

    it('should return error messages for LDU_INACTIVE plus COM_NOT_ALLOCATED', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })
      const errors = { LDU_INACTIVE: 'LDU_INACTIVE', COM_NOT_ALLOCATED: 'COM_NOT_ALLOCATED' }
      caService.getReasonForNotContinuing.resolves(errors)

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.include(
            'The Local Delivery Unit is in a geographical area that is currently inactive. Please refer via Nomis'
          )
          expect(res.text).to.include('The Community Offender Manager (COM) assigned is a pseudo.')
        })
    })

    it('should disable the Start now button if there is an error', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })
      caService.getReasonForNotContinuing.resolves({ LDU_INACTIVE: 'LDU_INACTIVE' })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.include('button-disabled')
        })
    })

    it('should NOT disable the Start now button if there are no errors', async () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: { anyKey: 1 } })
      caService.getReasonForNotContinuing.resolves()

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.not.include('button-disabled')
        })
    })

    it('should call getPrisonerDetails from prisonerDetailsService', () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: {} })
      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })
      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(prisonerService.getPrisonerDetails).to.be.calledOnce()
          expect(prisonerService.getPrisonerDetails).to.be.calledWith('123', 'token')
        })
    })

    it('should should show ARD if no CRD', () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: {} })
      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })
      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.not.include('id="prisonerCrd"')
          expect(res.text).to.include('id="prisonerArd"> 01/01/2001')
        })
    })

    it('should return the eligibility', () => {
      licenceService.getLicence.resolves({
        stage: 'ELIGIBILITY',
        licence: {
          eligibility: {
            excluded: {
              decision: 'No',
            },
            suitability: {
              decision: 'No',
            },
            crdTime: {
              decision: 'No',
            },
          },
        },
      })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/1233456')
        .expect(200)
        .expect(res => {
          expect(res.text).to.not.include('id="eligibilityCheckStart"')
        })
    })

    it('should handle no eligibility', () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: {} })

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/1233456')
        .expect(200)
        .expect(res => {
          expect(res.text).to.include('id="eligibilityCheckStart"')
        })
    })

    context('when the is no licence in the db for the offender', () => {
      it('should still load the taskList', () => {
        licenceService.getLicence.resolves(null)
        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })
        return request(app)
          .get('/taskList/123')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).to.include('id="prisonerArd"> 01/01/2001')
          })
      })
    })
  })

  describe('POST /eligibilityStart', () => {
    beforeEach(() => {
      licenceService.getLicence.resolves({ bookingId: '1' })
      licenceService.createLicence.resolves()
    })

    it('should redirect to eligibility section', () => {
      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .post('/taskList/eligibilityStart')
        .send({ bookingId: '123' })
        .expect(302)
        .expect(res => {
          expect(res.header.location).to.include('/hdc/eligibility/excluded/123')
        })
    })

    context('licence exists in db', () => {
      it('should not create a new licence', () => {
        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })

        return request(app)
          .post('/taskList/eligibilityStart')
          .send({ bookingId: '123' })
          .expect(302)
          .expect(() => {
            expect(licenceService.createLicence).to.not.be.called()
          })
      })
    })

    context('licence does not exist in db', () => {
      it('should create a new licence', () => {
        licenceService.getLicence.resolves(undefined)
        licenceService.createLicence.resolves()

        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })

        return request(app)
          .post('/taskList/eligibilityStart')
          .send({ bookingId: '123' })
          .expect(302)
          .expect(() => {
            expect(licenceService.createLicence).to.be.called()
            expect(licenceService.createLicence).to.be.calledWith({ bookingId: '123' })
          })
      })

      it('should audit the new licence creation event', () => {
        licenceService.getLicence.resolves(undefined)
        licenceService.createLicence.resolves()

        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })

        return request(app)
          .post('/taskList/eligibilityStart')
          .send({ bookingId: '123' })
          .expect(302)
          .expect(() => {
            expect(auditStub.record).to.be.called()
            expect(auditStub.record).to.be.calledWith('LICENCE_RECORD_STARTED', 'CA_USER_TEST', {
              bookingId: '123',
            })
          })
      })
    })
  })

  describe('POST /varyStart', () => {
    beforeEach(() => {
      licenceService.getLicence.resolves(undefined)
      licenceService.createLicence.resolves()
    })

    it('should redirect to vary/evidence page', () => {
      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .post('/taskList/varyStart')
        .send({ bookingId: '123' })
        .expect(302)
        .expect('Location', '/hdc/vary/evidence/123')
    })

    context('licence does not exist in db', () => {
      it('should create a new licence', () => {
        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })

        return request(app)
          .post('/taskList/varyStart')
          .send({ bookingId: '123' })
          .expect(302)
          .expect(() => {
            expect(licenceService.createLicence).to.be.called()
            expect(licenceService.createLicence).to.be.calledWith({
              bookingId: '123',
              data: { variedFromLicenceNotInSystem: true },
              stage: 'VARY',
            })
          })
      })

      it('should audit the new licence creation event', () => {
        licenceService.getLicence.resolves(undefined)
        licenceService.createLicence.resolves()

        const app = createApp({
          licenceServiceStub: licenceService,
          prisonerServiceStub: prisonerService,
          caServiceStub: caService,
        })

        return request(app)
          .post('/taskList/varyStart')
          .send({ bookingId: '123' })
          .expect(302)
          .expect(() => {
            expect(auditStub.record).to.be.called()
            expect(auditStub.record).to.be.calledWith('VARY_NOMIS_LICENCE_CREATED', 'CA_USER_TEST', {
              bookingId: '123',
            })
          })
      })
    })
  })

  describe('GET /image/:imageId', () => {
    it('should return an image', () => {
      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/image/123')
        .expect(200)
        .expect('Content-Type', /image/)
    })

    it('should return placeholder if no image returned from nomis', () => {
      prisonerService.getPrisonerImage.resolves(null)

      const app = createApp({
        licenceServiceStub: licenceService,
        prisonerServiceStub: prisonerService,
        caServiceStub: caService,
      })

      return request(app)
        .get('/taskList/image/123')
        .expect(302)
        .expect('Content-Type', /image/)
    })
  })

  describe('User is RO', () => {
    it('should pass the client credential token not the user one', () => {
      licenceService.getLicence.resolves({ stage: 'ELIGIBILITY', licence: {} })
      const app = createApp(
        { licenceServiceStub: licenceService, prisonerServiceStub: prisonerService, caServiceStub: caService },
        'roUser'
      )
      return request(app)
        .get('/taskList/123')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(prisonerService.getPrisonerDetails).to.be.calledOnce()
          expect(prisonerService.getPrisonerDetails).to.be.calledWith('123', 'system-token')
        })
    })

    context('Prisoner has been released', () => {
      it('should allow a new variation to be started if no licence exists', () => {
        licenceService.getLicence.resolves(undefined)
        prisonerService.getPrisonerDetails.resolves({ agencyLocationId: 'Out' })

        const app = createApp(
          { licenceServiceStub: licenceService, prisonerServiceStub: prisonerService, caServiceStub: caService },
          'roUser'
        )

        return request(app)
          .get('/taskList/123')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).to.include('action="/hdc/taskList/varyStart/"')
          })
      })

      it('should link to evidence page if there is a licence', () => {
        licenceService.getLicence.resolves({ stage: 'VARY', licence: { variedFromLicenceNotInSystem: true } })
        prisonerService.getPrisonerDetails.resolves({ agencyLocationId: 'Out' })

        const app = createApp(
          { licenceServiceStub: licenceService, prisonerServiceStub: prisonerService, caServiceStub: caService },
          'roUser'
        )

        return request(app)
          .get('/taskList/123')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).to.include('/hdc/vary/evidence/')
          })
      })
    })
  })
})

function createApp({ licenceServiceStub, prisonerServiceStub, caServiceStub }, user) {
  const prisonerService = prisonerServiceStub || createPrisonerServiceStub()
  const licenceService = licenceServiceStub || createLicenceServiceStub()
  const signInService = createSignInServiceStub()
  const caService = caServiceStub || createCaServiceStub

  const baseRouter = standardRouter({ licenceService, prisonerService, audit: auditStub, signInService, caService })
  const route = baseRouter(
    createRoute({
      licenceService,
      prisonerService,
      caseListService: caseListServiceStub,
      audit: auditStub,
      caService,
    }),
    { licenceRequired: false }
  )

  return appSetup(route, user, '/taskList/')
}
