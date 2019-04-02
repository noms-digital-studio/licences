const request = require('supertest')

const {
  appSetup,
  caseListServiceStub,
  createPrisonerServiceStub,
  createLicenceServiceStub,
  auditStub,
  createSignInServiceStub,
} = require('../supertestSetup')

const caseListResponse = require('../stubs/caseListResponse')

caseListServiceStub.getHdcCaseList.resolves(caseListResponse)

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createCaseListRoute = require('../../server/routes/caseList')

describe('GET /caseList', () => {
  let app
  beforeEach(() => {
    app = createApp('caUser')
  })

  it('returns forbidden status if logged in as admin user role', () => {
    app = createApp('batchUser')
    return request(app)
      .get('/caselist/')
      .expect(403)
  })

  it('redirects if accesss /', () => {
    return request(app)
      .get('/caselist/')
      .expect(302)
      .expect('Location', '/caseList/active')
  })

  it('renders the hdc eligible prisoners page', () => {
    return request(app)
      .get('/caselist/active')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).to.include('id="hdcEligiblePrisoners">')
      })
  })
})

function createApp(user) {
  const prisonerService = createPrisonerServiceStub()
  const licenceService = createLicenceServiceStub()
  const signInService = createSignInServiceStub()

  const baseRouter = standardRouter({ licenceService, prisonerService, audit: auditStub, signInService })
  const route = baseRouter(createCaseListRoute({ caseListService: caseListServiceStub }))

  return appSetup(route, user, '/caselist/')
}
