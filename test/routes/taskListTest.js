const {
    request,
    sandbox,
    expect,
    appSetup
} = require('../supertestSetup');

const createTaskListRoute = require('../../server/routes/taskList');
const auth = require('../mockAuthentication');
const authenticationMiddleware = auth.authenticationMiddleware;

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
    physicalAttributes: {gender: 'Male'},
    imageId: 'imgId',
    captureDate: '23/11/1971',
    sentenceExpiryDate: '03/12/1985'
};

const loggerStub = {
    debug: sandbox.stub()
};
const serviceStub = {
    getPrisonerDetails: sandbox.stub().returnsPromise().resolves(prisonerInfoResponse),
    getPrisonerImage: sandbox.stub().returnsPromise().resolves({image: 'image'})
};

const licenceServiceStub = {
    getLicence: sandbox.stub().returnsPromise().resolves(),
    createLicence: sandbox.stub().returnsPromise()
};

const testUser = {
    staffId: 'my-staff-id',
    token: 'my-token',
    roleCode: 'OM'
};

const app = appSetup(createTaskListRoute({
        prisonerService: serviceStub,
        licenceService: licenceServiceStub,
        logger: loggerStub,
        authenticationMiddleware
    }
), testUser);

describe('GET /taskList/:prisonNumber', () => {

    afterEach(() => {
       sandbox.reset();
    });

    it('should call getPrisonerDetails from prisonerDetailsService', () => {
        return request(app)
            .get('/123')
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
                expect(serviceStub.getPrisonerDetails).to.be.calledOnce();
                expect(serviceStub.getPrisonerDetails).to.be.calledWith('123');
            });

    });

    it('should return the eligibility', () => {
        licenceServiceStub.getLicence.resolves({licence: {eligibility: {key: 'value'}}});
        return request(app)
            .get('/1233456')
            .expect(200)
            .expect(res => {
                expect(res.text).to.not.include('id="eligibilityCheckStart"');
            });

    });

    it('should handle no eligibility', () => {
        licenceServiceStub.getLicence.resolves({licence: {}});
        return request(app)
            .get('/1233456')
            .expect(200)
            .expect(res => {
                expect(res.text).to.include('id="eligibilityCheckStart"');
            });
    });

    context('when prisoner is not excluded', () => {
        it('should display opt out form link', () => {
            licenceServiceStub.getLicence.resolves({licence: {eligibility: {
                excluded: 'No',
                unsuitable: 'No'
            }}});

            return request(app)
                .get('/1233456')
                .expect(200)
                .expect(res => {
                    expect(res.text).to.include('/hdc/proposedAddress/optOut/');
                });
        });
    });

    context('when licence has been started', () => {
        it('should load personal details from licence', () => {
            licenceServiceStub.getLicence.resolves({licence: {personalDetails: {details: {
                firstName: 'FIRSTNAME'
            }}}});
            return request(app)
                .get('/1233456')
                .expect(200)
                .expect(res => {
                    expect(res.text).to.include('FIRSTNAME');
                    expect(serviceStub.getPrisonerDetails).to.not.be.called();
                });
        });
    });

    context('when prisoner is ineligible', () => {
        it('should not display link to opt out when excluded', () => {
            licenceServiceStub.getLicence.resolves({licence: {eligibility: {
                excluded: 'No',
                unsuitable: 'Yes'
            }}});

            return request(app)
                .get('/1233456')
                .expect(200)
                .expect(res => {
                    expect(res.text).to.not.include('/hdc/optOut/');
                });
        });

        it('should not display link to opt out when unsuitable', () => {
            licenceServiceStub.getLicence.resolves({licence: {eligibility: {
                excluded: 'Yes',
                unsuitable: 'No'
            }}});

            return request(app)
                .get('/1233456')
                .expect(200)
                .expect(res => {
                    expect(res.text).to.not.include('/hdc/optOut/');
                });
        });

        it('should not display link to opt out when unsuitable and excluded', () => {
            licenceServiceStub.getLicence.resolves({licence: {eligibility: {
                excluded: 'Yes',
                unsuitable: 'Yes'
            }}});

            return request(app)
                .get('/1233456')
                .expect(200)
                .expect(res => {
                    expect(res.text).to.not.include('/hdc/optOut/');
                });
        });
    });

});

describe('POST /taskList/:prisonNumber', () => {

    it('should create a new licence if a licence does not already exist', () => {
        const formResponse = {
            nomisId: '123',
            extra: 'field'
        };

        licenceServiceStub.getLicence.resolves(undefined);
        licenceServiceStub.createLicence.resolves();
        return request(app)
            .post('/1233456')
            .send(formResponse)
            .expect(302)
            .expect(res => {
                expect(licenceServiceStub.createLicence).to.be.called();
                expect(licenceServiceStub.createLicence).to.be.calledWith('123', formResponse);
                expect(res.header['location']).to.include('/dischargeAddress');
            });
    });
});

describe('GET /image/:imageId', () => {

    it('should return an image', () => {
        return request(app)
            .get('/image/123')
            .expect(200)
            .expect('Content-Type', /image/);
    });

    it('should return placeholder if no image returned from nomis', () => {
        serviceStub.getPrisonerImage.resolves(null);
        return request(app)
            .get('/image/123')
            .expect(302)
            .expect('Content-Type', /image/);
    });
});

