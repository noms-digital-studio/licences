const request = require('supertest');
const express = require('express');
const moment = require('moment');

const createApiRoute = require('../../server/routes/api');
let reportingService;

describe('/api/', () => {

    beforeEach(() => {
        reportingService = createReportingServiceStub();
    });

    describe('address submission', () => {


        it('returns json', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/addressSubmission/')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(response.body.msg).to.eql('hello');
                });
        });
    });

    describe('assessmentComplete submission', () => {

        it('returns json', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/assessmentComplete/')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(response.body.assessment).to.eql('complete');
                });
        });
    });

    describe('final checks complete', () => {

        it('returns json', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/finalChecksComplete/')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(response.body.finalChecks).to.eql('complete');
                });
        });
    });

    describe('decision made', () => {

        it('returns json', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/decisionMade/')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(response.body.approval).to.eql('complete');
                });
        });

        it('uses start and end query parameters', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/decisionMade?start=22-11-2017&end=04-09-2018')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(reportingService.getApprovalComplete).to.be.calledOnce();
                    expect(reportingService.getApprovalComplete).to.be.calledWith(
                        moment('22-11-2017', 'DD-MM-YYYY'), moment('04-09-2018', 'DD-MM-YYYY'));
                });
        });

        it('returns a bad request if invalid date used', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/decisionMade?start=22-13-2017&end=04-09-2018')
                .expect('Content-Type', /json/)
                .expect(400)
                .then(response => {
                    expect(response.body.message).to.eql('Invalid date format');
                });
        });

    });

    describe('unknown report', () => {
        it('returns 404', () => {

            const app = createApp(reportingService);
            return request(app)
                .get('/api/somethingElse/')
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });

});

function createApp(service = reportingService) {
    const route = createApiRoute({reportingService: service});

    const app = express();
    app.use('/api/', route);

    return app;
}

const createReportingServiceStub = () => ({
    getAddressSubmission: sinon.stub().resolves({msg: 'hello'}),
    getAssessmentComplete: sinon.stub().resolves({assessment: 'complete'}),
    getFinalChecksComplete: sinon.stub().resolves({finalChecks: 'complete'}),
    getApprovalComplete: sinon.stub().resolves({approval: 'complete'})
});