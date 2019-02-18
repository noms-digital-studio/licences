const request = require('supertest')

const {
    createPrisonerServiceStub,
    createLicenceServiceStub,
    authenticationMiddleware,
    auditStub,
    appSetup,
    testFormPageGets,
    createConditionsServiceStub,
    createSignInServiceStub,
} = require('../supertestSetup')

const standardRouter = require('../../server/routes/routeWorkers/standardRouter')
const createRoute = require('../../server/routes/conditions')
const formConfig = require('../../server/routes/config/licenceConditions')

describe('/hdc/licenceConditions', () => {
    let conditionsService

    beforeEach(() => {
        conditionsService = createConditionsServiceStub()
        conditionsService.getStandardConditions = sinon.stub().resolves([{ text: 'Not commit any offence' }])
        conditionsService.getAdditionalConditions = sinon.stub().returns({
            base: {
                base: [{ text: 'hi', id: 'ho', user_input: {} }],
            },
        })
        conditionsService.populateLicenceWithConditions = sinon.stub().resolves({ licence: {} })
        auditStub.record.reset()
    })

    describe('licenceConditions routes', () => {
        const licenceService = createLicenceServiceStub()
        const conditionsServiceStub = createConditionsServiceStub()
        conditionsServiceStub.getStandardConditions = sinon.stub().returns([{ text: 'Not commit any offence' }])
        conditionsServiceStub.getAdditionalConditions = sinon.stub().returns({
            base: {
                base: [{ text: 'hi', id: 'ho', user_input: {} }],
            },
        })

        conditionsServiceStub.populateLicenceWithConditions = sinon.stub().resolves({ licence: {} })
        const app = createApp({ licenceService, conditionsService: conditionsServiceStub }, 'roUser')
        const routes = [
            { url: '/hdc/licenceConditions/standard/1', content: 'Not commit any offence' },
            { url: '/hdc/licenceConditions/additionalConditions/1', content: 'Select additional conditions</h1>' },
            { url: '/hdc/licenceConditions/conditionsSummary/1', content: 'Add additional condition' },

            // Is this meant to be here?
            // {url: '/hdc/reporting/reportingInstructions/1', content: 'Reporting instructions'}
        ]

        testFormPageGets(app, routes, licenceService)
    })

    describe('POST /hdc/licenceConditions/:section/:bookingId', () => {
        const routes = [
            {
                url: '/hdc/licenceConditions/standard/1',
                body: { additionalConditionsRequired: 'Yes', bookingId: 1 },
                nextPath: '/hdc/licenceConditions/additionalConditions/1',
                formName: 'standard',
            },
            {
                url: '/hdc/licenceConditions/standard/1',
                body: { additionalConditionsRequired: 'No', bookingId: 1 },
                nextPath: '/hdc/taskList/1',
                formName: 'standard',
            },
        ]

        routes.forEach(route => {
            it(`renders the correct path '${route.nextPath}' page`, () => {
                const licenceService = createLicenceServiceStub()
                const app = createApp({ licenceService, conditionsService }, 'roUser')

                return request(app)
                    .post(route.url)
                    .send(route.body)
                    .expect(302)
                    .expect(res => {
                        expect(licenceService.update).to.be.calledOnce()
                        expect(licenceService.update).to.be.calledWith({
                            bookingId: '1',
                            originalLicence: { licence: { key: 'value' } },
                            config: formConfig[route.formName],
                            userInput: route.body,
                            licenceSection: 'licenceConditions',
                            formName: route.formName,
                            postRelease: false,
                        })

                        expect(res.header.location).to.equal(route.nextPath)
                    })
            })

            it(`renders the correct path '${route.nextPath}' page when ca in post approval`, () => {
                const licenceService = createLicenceServiceStub()
                licenceService.getLicence.resolves({ stage: 'DECIDED', licence: { key: 'value' } })
                const app = createApp({ licenceService, conditionsService }, 'caUser')

                return request(app)
                    .post(route.url)
                    .send(route.body)
                    .expect(302)
                    .expect(res => {
                        expect(licenceService.update).to.be.calledOnce()
                        expect(licenceService.update).to.be.calledWith({
                            bookingId: '1',
                            originalLicence: { licence: { key: 'value' }, stage: 'DECIDED' },
                            config: formConfig[route.formName],
                            userInput: route.body,
                            licenceSection: 'licenceConditions',
                            formName: route.formName,
                            postRelease: false,
                        })

                        expect(res.header.location).to.equal(route.nextPath)
                    })
            })

            it(`throws when posting to '${route.nextPath}' when ca in non-post approval`, () => {
                const licenceService = createLicenceServiceStub()
                licenceService.getLicence.resolves({ stage: 'PROCESSING_RO', licence: { key: 'value' } })
                const app = createApp({ licenceService, conditionsService }, 'caUser')

                return request(app)
                    .post(route.url)
                    .send(route.body)
                    .expect(403)
            })
        })

        it(`passes postRelease true if agencyLocationId is out`, () => {
            const licenceService = createLicenceServiceStub()
            const prisonerService = createPrisonerServiceStub()
            prisonerService.getPrisonerPersonalDetails.resolves({ agencyLocationId: 'out' })
            const app = createApp({ licenceService, conditionsService, prisonerService }, 'roUser')

            return request(app)
                .post('/hdc/licenceConditions/standard/1')
                .send({ additionalConditionsRequired: 'Yes', bookingId: 1 })
                .expect(302)
                .expect(() => {
                    expect(licenceService.update).to.be.calledOnce()
                    expect(licenceService.update).to.be.calledWith({
                        bookingId: '1',
                        originalLicence: { licence: { key: 'value' } },
                        config: formConfig.standard,
                        userInput: { additionalConditionsRequired: 'Yes', bookingId: 1 },
                        licenceSection: 'licenceConditions',
                        formName: 'standard',
                        postRelease: true,
                    })
                })
        })
    })

    describe('POST /additionalConditions/:bookingId/delete/:conditionId', () => {
        const formResponse = {
            bookingId: '123',
            conditionId: 'ABC',
        }

        it('calls licence service delete and returns to summary page', () => {
            const licenceService = createLicenceServiceStub()
            const app = createApp({ licenceService, conditionsService }, 'roUser')

            return request(app)
                .post('/hdc/licenceConditions/additionalConditions/123/delete/ABC')
                .send(formResponse)
                .expect(302)
                .expect(res => {
                    expect(licenceService.deleteLicenceCondition).to.be.calledWith(
                        '123',
                        { licence: { key: 'value' } },
                        'ABC'
                    )
                    expect(res.header.location).to.equal('/hdc/licenceConditions/conditionsSummary/123')
                })
        })

        it('audits the delete event', () => {
            const licenceService = createLicenceServiceStub()
            const app = createApp({ licenceService, conditionsService }, 'roUser')

            return request(app)
                .post('/hdc/licenceConditions/additionalConditions/123/delete/ABC')
                .send(formResponse)
                .expect(() => {
                    expect(auditStub.record).to.be.calledOnce()
                    expect(auditStub.record).to.be.calledWith('UPDATE_SECTION', 'RO_USER', {
                        path: '/hdc/licenceConditions/additionalConditions/123/delete/ABC',
                        bookingId: '123',
                        userInput: {
                            conditionId: 'ABC',
                        },
                    })
                })
        })
    })

    describe('GET /additionalConditions/conditionsSummary/:bookingId', () => {
        it('should validate the conditions', () => {
            const licenceService = createLicenceServiceStub()
            licenceService.getLicence.resolves({ licence: { licenceConditions: { additional: { cond: 'that' } } } })
            licenceService.validateForm = sinon.stub().returns({ error: 'object' })
            const app = createApp({ licenceService, conditionsService }, 'roUser')

            return request(app)
                .get('/hdc/licenceConditions/conditionsSummary/1')
                .expect(200)
                .expect(() => {
                    expect(licenceService.validateForm).to.be.calledWith({
                        formResponse: { cond: 'that' },
                        pageConfig: formConfig.additional,
                        formType: 'additional',
                    })
                    expect(conditionsService.populateLicenceWithConditions).to.be.calledWith(
                        { licenceConditions: { additional: { cond: 'that' } } },
                        { error: 'object' }
                    )
                })
        })
    })
})

function createApp({ licenceService, conditionsService, prisonerService }, user) {
    const prisonerServiceMock = prisonerService || createPrisonerServiceStub()
    const signInService = createSignInServiceStub()

    const baseRouter = standardRouter({
        licenceService,
        prisonerService: prisonerServiceMock,
        authenticationMiddleware,
        audit: auditStub,
        signInService,
    })
    const route = baseRouter(createRoute({ licenceService, conditionsService }))

    return appSetup(route, user, '/hdc/licenceConditions/')
}
