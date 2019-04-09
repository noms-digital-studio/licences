const request = require('supertest')

const {
  auditStub,
  authenticationMiddleware,
  createPrisonerServiceStub,
  createLicenceServiceStub,
  users,
  appSetup,
} = require('../supertestSetup')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/user')

describe('/user', () => {
  let userService

  beforeEach(() => {
    userService = {
      getAllRoles: sinon.stub().resolves(['CA', 'RO']),
      getAllCaseLoads: sinon
        .stub()
        .resolves([{ caseLoadId: '1', description: 'a' }, { caseLoadId: '2', description: 'b' }]),
      setRole: sinon.stub().resolves(),
      setActiveCaseLoad: sinon.stub().resolves(),
    }
    auditStub.record.reset()
  })

  describe('user page get', () => {
    it(`renders the /user page`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.contain('Select role')
        })
    })

    it(`renders the role dropdown if user has multiple roles`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.contain('<option value="CA"')
          expect(res.text).to.contain('<option value="RO"')
        })
    })

    it(`renders the case load dropdown if user has multiple case loads`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).to.contain('<option value="1"')
          expect(res.text).to.contain('<option value="2"')
        })
    })

    it(`does not render the case load dropdown if user is admin role`, () => {
      const app = createApp({ userService }, 'batchUser')
      return request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.to.contain('<option value="1"')
          expect(res.text).not.to.contain('<option value="2"')
        })
    })
  })

  describe('user page post', () => {
    it(`calls setRole if role is different to that on user`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ role: 'RO' })
        .expect(302)
        .expect(() => {
          expect(userService.setRole).to.be.calledOnce()
          expect(userService.setRole).to.be.calledWith('RO')
        })
    })

    it(`does not call setRole if role is the same as that on user`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ role: 'CA' })
        .expect(302)
        .expect(() => {
          expect(userService.setRole).to.not.be.called()
        })
    })

    it(`calls setActiveCaseload if caseLoad is different to that on user`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ caseLoadId: 'caseLoadId2' })
        .expect(302)
        .expect(() => {
          expect(userService.setActiveCaseLoad).to.be.calledOnce()
          expect(userService.setActiveCaseLoad).to.be.calledWith('caseLoadId2', users.caUser, 'token')
        })
    })

    it(`does not call setActiveCaseload if caseLoad is the same as that on user`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ caseLoadId: 'caseLoadId' })
        .expect(302)
        .expect(() => {
          expect(userService.setActiveCaseLoad).to.not.be.called()
        })
    })

    it(`does not call setActiveCaseload if caseLoadId is missing`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ someOtherId: 'caseLoadId' })
        .expect(302)
        .expect(() => {
          expect(userService.setActiveCaseLoad).to.not.be.called()
        })
    })

    it(`redirects to the /user page`, () => {
      const app = createApp({ userService }, 'caUser')
      return request(app)
        .post('/')
        .send({ role: 'RO' })
        .expect(302)
        .expect('Location', '/user')
    })
  })
})

function createApp({ userService }, user) {
  const prisonerService = createPrisonerServiceStub()
  const licenceService = createLicenceServiceStub()

  const baseRouter = standardRouter({ licenceService, prisonerService, authenticationMiddleware, audit: auditStub })
  const route = baseRouter(createRoute({ userService }))

  return appSetup(route, user)
}
