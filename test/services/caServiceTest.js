const createCaService = require('../../server/services/caService')
const activeLduClient = require('../../server/data/activeLduClient')

describe('caService', () => {
  let roService
  let caService

  describe('Responsible Officer is allocated and Ldu determined', () => {
    const responsibleOfficerOrError = {
      isAllocated: true,
      lduCode: 'ldu-123',
    }

    beforeEach(() => {
      roService = {
        findResponsibleOfficer: sinon.stub().resolves(responsibleOfficerOrError),
      }
      caService = createCaService(roService)
    })

    describe('getReasonForNotContinuing ', () => {
      it('should return null because Ro is COM and ldu is active', async () => {
        activeLduClient.isLduPresent = sinon.stub().resolves(1)
        const result = await caService.getReasonForNotContinuing('bookingId-1', 'token-1')
        expect(result).to.eql(null)
      })

      it('should return LDU_INACTIVE because ldu is not active', async () => {
        activeLduClient.isLduPresent = sinon.stub().resolves(0)
        const result = await caService.getReasonForNotContinuing('bookingId-1', 'token-1')
        expect(result).to.eql('LDU_INACTIVE')
      })

      it('should return COM_NOT_ALLOCATED because COM has not been assigned', async () => {
        activeLduClient.isLduPresent = sinon.stub().resolves(1)
        responsibleOfficerOrError.isAllocated = false
        const result = await caService.getReasonForNotContinuing('bookingId-1', 'token-1')
        expect(result).to.eql('COM_NOT_ALLOCATED')
        responsibleOfficerOrError.isAllocated = true
      })
    })
  })

  describe('Responsible officer not assigned or Ldu not determined', () => {
    const responsibleOfficerOrError = {
      code: 'NO_OFFENDER_NUMBER',
      message: 'Offender number not entered in delius',
    }

    beforeEach(() => {
      roService = {
        findResponsibleOfficer: sinon.stub().resolves(responsibleOfficerOrError),
      }
      caService = createCaService(roService)
    })

    describe('getReasonForNotContinuing', () => {
      it('should return NO_OFFENDER_NUMBER because no offender number on nomis for bookingId', async () => {
        const result = await caService.getReasonForNotContinuing('bookingId-1', 'token-1')
        expect(result).to.eql('NO_OFFENDER_NUMBER')
      })

      it('should return NO_COM_ASSIGNED', async () => {
        responsibleOfficerOrError.code = 'NO_COM_ASSIGNED'
        const result = await caService.getReasonForNotContinuing('bookingId-1', 'token-1')
        expect(result).to.eql('NO_COM_ASSIGNED')
      })
    })
  })
})