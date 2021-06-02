const request = require('supertest')
const { mockAudit } = require('../mockClients')
const { appSetup } = require('../supertestSetup')

const {
  // caseListServiceStub,
  createPrisonerServiceStub,
  createLicenceServiceStub,
  createSignInServiceStub,
  createFormServiceStub,
} = require('../mockServices')

const NullTokenVerifier = require('../../server/authentication/tokenverifier/NullTokenVerifier')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createFormsRoute = require('../../server/routes/forms')

describe('GET /forms', () => {
  let app
  beforeEach(() => {
    app = createApp('caUser')
  })

  test('gets ms-word version of agency_notification form', () => {
    return request(app)
      .get('/forms/agency_notification/1')
      .expect(200)
      .expect('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .expect('content-disposition', 'attachment; filename="agency_notification.docx"')
      .expect('content-length', '42782')
  })

  test('gets ms-word version of licence_variation form', () => {
    return request(app)
      .get('/forms/licence_variation/1')
      .expect(200)
      .expect('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .expect('content-disposition', 'attachment; filename="licence_variation.docx"')
      .expect('content-length', '33567')
  })
})

function createApp(user) {
  const prisonerService = createPrisonerServiceStub()
  const licenceService = createLicenceServiceStub()
  const signInService = createSignInServiceStub()
  const audit = mockAudit()

  const baseRouter = standardRouter({
    licenceService,
    prisonerService,
    audit,
    signInService,
    tokenVerifier: new NullTokenVerifier(),
    config: null,
  })

  const route = baseRouter(createFormsRoute({ formService: createFormServiceStub() }))

  return appSetup(route, user, '/forms/')
}
