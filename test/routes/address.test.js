const request = require('supertest')

const {
  createPrisonerServiceStub,
  createLicenceServiceStub,
  auditStub,
  appSetup,
  createSignInServiceStub,
  createNomisPushServiceStub,
} = require('../supertestSetup')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/address')

describe('/hdc/proposedAddress/', () => {
  const licenceService = createLicenceServiceStub()
  licenceService.getLicence.mockResolvedValue({
    licence: {
      proposedAddress: {
        curfewAddress: {},
      },
    },
  })
  const app = createApp({ licenceServiceStub: licenceService }, 'caUser')
  describe('Should render each page', () => {
    test(`rejected/1 renders the "Curfew address rejected" page`, () => {
      return request(app)
        .get('/hdc/proposedAddress/rejected/1')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Curfew address rejected')
        })
    })
    test(`curfewAddress/1 renders the "Curfew address" page`, () => {
      return request(app)
        .get('/hdc/proposedAddress/curfewAddress/1')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Proposed curfew address')
        })
    })
    test(`curfewAddressChoice/1 renders the "Curfew address choice" page`, () => {
      return request(app)
        .get('/hdc/proposedAddress/curfewAddressChoice/1')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Has the offender provided a curfew address?')
        })
    })
  })
})

function createApp({ licenceServiceStub, prisonerServiceStub, nomisPushServiceStub }, user, config = {}) {
  const prisonerService = prisonerServiceStub || createPrisonerServiceStub()
  const licenceService = licenceServiceStub || createLicenceServiceStub()
  const signInService = createSignInServiceStub()
  const nomisPushService = nomisPushServiceStub || createNomisPushServiceStub()

  const baseRouter = standardRouter({
    licenceService,
    prisonerService,
    audit: auditStub,
    signInService,
    config,
  })
  const route = baseRouter(createRoute({ licenceService, nomisPushService }))

  return appSetup(route, user, '/hdc/proposedAddress')
}