const request = require('supertest')

const {
  createPrisonerServiceStub,
  createLicenceServiceStub,
  appSetup,
  auditStub,
  createSignInServiceStub,
} = require('../supertestSetup')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/sent')

describe('GET sent', () => {
  const prisonerService = createPrisonerServiceStub()
  prisonerService.getOrganisationContactDetails = sinon
    .stub()
    .resolves({ premise: 'HMP Blah', com: { name: 'Something' } })

  let app
  beforeEach(() => {
    app = createApp({ prisonerServiceStub: prisonerService }, 'caUser')
    prisonerService.getOrganisationContactDetails.reset()
  })

  it('renders the sent page for CAtoRO', () => {
    return request(app)
      .get('/hdc/sent/RO/caToRo/123')
      .expect(200)
      .expect(() => {
        expect(prisonerService.getOrganisationContactDetails).to.be.calledOnce()
        expect(prisonerService.getOrganisationContactDetails).to.be.calledWith('RO', '123', 'token')
      })
      .expect(res => {
        expect(res.text).to.include('Case sent')
      })
  })

  it('renders the sent page for CAtoDM', () => {
    return request(app)
      .get('/hdc/sent/DM/caToDm/123')
      .expect(200)
      .expect(() => {
        expect(prisonerService.getOrganisationContactDetails).to.be.calledOnce()
        expect(prisonerService.getOrganisationContactDetails).to.be.calledWith('DM', '123', 'token')
      })
      .expect(res => {
        expect(res.text).to.include('Submitted for approval')
      })
  })

  it('renders the sent page for ROtoCA', () => {
    return request(app)
      .get('/hdc/sent/CA/roToCa/123')
      .expect(200)
      .expect(() => {
        expect(prisonerService.getOrganisationContactDetails).to.be.calledOnce()
        expect(prisonerService.getOrganisationContactDetails).to.be.calledWith('CA', '123', 'token')
      })
      .expect(res => {
        expect(res.text).to.include('Case sent')
      })
  })

  it('renders the sent page for DMtoCA', () => {
    return request(app)
      .get('/hdc/sent/CA/dmToCa/123')
      .expect(200)
      .expect(() => {
        expect(prisonerService.getOrganisationContactDetails).to.be.calledOnce()
        expect(prisonerService.getOrganisationContactDetails).to.be.calledWith('CA', '123', 'token')
      })
      .expect(res => {
        expect(res.text).to.include('Submitted to prison case admin')
      })
  })

  it('renders the sent page for CAtoDMRefusal', () => {
    return request(app)
      .get('/hdc/sent/DM/caToDmRefusal/123')
      .expect(200)
      .expect(() => {
        expect(prisonerService.getOrganisationContactDetails).to.be.calledOnce()
        expect(prisonerService.getOrganisationContactDetails).to.be.calledWith('DM', '123', 'token')
      })
      .expect(res => {
        expect(res.text).to.include('Submitted for refusal')
      })
  })

  it('errors when an invalid transition type is provided', () => {
    return request(app)
      .get('/hdc/sent/CA/foobar/123')
      .expect(500)
  })
})

function createApp({ licenceServiceStub, prisonerServiceStub }, user) {
  const prisonerService = prisonerServiceStub || createPrisonerServiceStub()
  const licenceService = licenceServiceStub || createLicenceServiceStub()
  const signInService = createSignInServiceStub()

  const baseRouter = standardRouter({ licenceService, prisonerService, audit: auditStub, signInService })
  const route = baseRouter(createRoute({ licenceService, prisonerService }), 'USER_MANAGEMENT')

  return appSetup(route, user, '/hdc/sent/')
}
