const createCaseListService = require('../../server/services/caseListService');
const {
    sandbox,
    expect
} = require('../testSetup');

describe('caseListService', () => {
    const nomisClient = {
        getHdcEligiblePrisoners: sandbox.stub().returnsPromise().resolves([
            {
                bookingId: 0,
                offenderNo: 'A12345',
                firstName: 'MARK',
                middleNames: '',
                lastName: 'ANDREWS',
                agencyLocationDesc: 'BERWIN (HMP)',
                internalLocationDesc: 'A-C-2-002',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-09-07',
                    conditionalReleaseDate: '2017-12-15',
                    receptionDate: '2018-01-03'
                }
            }
        ])
    };

    const licenceClient = {
        getLicences: sandbox.stub().returnsPromise().resolves([])
    };

    const user = {
        staffId: '123',
        token: 'token',
        roleCode: 'CA'
    };

    const nomisClientBuilder = sandbox.stub().returns(nomisClient);

    const service = createCaseListService(nomisClientBuilder, licenceClient);

    afterEach(() => {
        sandbox.reset();
    });

    describe('getHdcCaseList', () => {
        it('should call getHdcEligiblePrisoners from nomisClient', () => {
            service.getHdcCaseList(user);

            expect(nomisClient.getHdcEligiblePrisoners).to.be.calledOnce();
        });

        it('should format dates', async () => {
            const result = await service.getHdcCaseList(user);

            expect(result[0].sentenceDetail.homeDetentionCurfewEligibilityDate).to.eql('07/09/2017');
            expect(result[0].sentenceDetail.conditionalReleaseDate).to.eql('15/12/2017');
        });

        it('should capitalise names', async () => {
            const result = await service.getHdcCaseList(user);

            expect(result[0].firstName).to.eql('Mark');
            expect(result[0].lastName).to.eql('Andrews');
        });

        it('should add a status to the prisoners', async () => {
            const result = await service.getHdcCaseList(user);

            expect(result[0].status).to.eql('Not started');
        });

        it('should add a started status to the prisoners if licence exists', async () => {
            licenceClient.getLicences.resolves([{
                licence: {
                    nomisId: 'A12345'
                }
            }]);
            const result = await service.getHdcCaseList(user);

            expect(result[0].status).to.eql('Started');
        });

        it('should return empty array if no results', () => {
            nomisClient.getHdcEligiblePrisoners.resolves([]);

            return expect(service.getHdcCaseList(user)).to.eventually.eql([]);
        });

        it('should return empty array if no null returned', () => {
            nomisClient.getHdcEligiblePrisoners.resolves(null);

            return expect(service.getHdcCaseList(user)).to.eventually.eql([]);
        });
    });
});
