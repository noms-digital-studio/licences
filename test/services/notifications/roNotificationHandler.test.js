const createRoNotificationHandler = require('../../../server/services/notifications/roNotificationHandler')
const transitionForDestinations = require('../../../server/services/notifications/transitionsForDestinations')
const { STAFF_NOT_LINKED } = require('../../../server/services/serviceErrors')

describe('roNotificationHandler', () => {
  let roNotificationSender
  let licenceService
  let prisonerService
  let eventPublisher
  let warningClient
  let deliusClient
  let roNotificationHandler
  let roContactDetailsService

  const prisoner = { firstName: 'first', lastName: 'last', dateOfBirth: 'off-dob', offenderNo: 'AB1234A' }
  const submissionTarget = { premise: 'HMP Blah', agencyId: 'LT1', name: 'Something', deliusId: 'delius' }
  const bookingId = -1
  const token = 'token-1'
  const licence = {}
  const username = 'bob'
  const user = { username }

  beforeEach(() => {
    licenceService = {
      markForHandover: jest.fn().mockReturnValue(),
      removeDecision: jest.fn().mockReturnValue({}),
    }

    roContactDetailsService = {
      getResponsibleOfficerWithContactDetails: jest.fn(),
    }

    warningClient = {
      raiseWarning: jest.fn(),
    }

    deliusClient = {
      addResponsibleOfficerRole: jest.fn(),
    }

    prisonerService = {
      getEstablishmentForPrisoner: jest.fn().mockReturnValue({ premise: 'HMP Blah', agencyId: 'LT1' }),
      getOrganisationContactDetails: jest.fn().mockReturnValue(submissionTarget),
      getPrisonerPersonalDetails: jest.fn().mockReturnValue(prisoner),
    }

    roNotificationSender = {
      sendNotifications: jest.fn().mockReturnValue({}),
    }

    eventPublisher = {
      raiseCaseHandover: jest.fn(),
    }

    roNotificationHandler = createRoNotificationHandler(
      roNotificationSender,
      licenceService,
      prisonerService,
      roContactDetailsService,
      warningClient,
      deliusClient,
      eventPublisher
    )
  })

  describe('send Ro', () => {
    test('handles caToRo', async () => {
      const responsibleOfficer = {
        name: 'Jo Smith',
        deliusId: 'delius1',
        email: 'ro@user.com',
        lduCode: 'code-1',
        lduDescription: 'lduDescription-1',
        nomsNumber: 'AAAA12',
        probationAreaCode: 'prob-code-1',
        probationAreaDescription: 'prob-desc-1',
      }
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)

      await roNotificationHandler.sendRo({
        transition: transitionForDestinations.addressReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(roNotificationSender.sendNotifications).toHaveBeenCalledWith({
        bookingId,
        responsibleOfficer,
        prison: 'HMP Blah',
        notificationType: 'RO_NEW',
        sendingUserName: username,
      })
      expect(eventPublisher.raiseCaseHandover).toHaveBeenCalledWith({
        username,
        bookingId,
        transitionType: 'caToRo',
        submissionTarget: responsibleOfficer,
        source: {
          agencyId: 'LT1',
          type: 'prison',
        },
        target: {
          lduCode: 'code-1',
          probationAreaCode: 'prob-code-1',
          type: 'probation',
        },
      })
      expect(licenceService.markForHandover).toHaveBeenCalledWith(bookingId, 'caToRo')
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when cannot get RO contact details', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue({
        message: 'failed to find RO',
      })

      await roNotificationHandler.sendRo({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(roNotificationSender.sendNotifications).not.toHaveBeenCalled()
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when cannot get prison', async () => {
      const responsibleOfficer = {
        name: 'Jo Smith',
        deliusId: 'delius1',
        email: 'ro@user.com',
        lduCode: 'code-1',
        lduDescription: 'lduDescription-1',
        nomsNumber: 'AAAA12',
        probationAreaCode: 'prob-code-1',
        probationAreaDescription: 'prob-desc-1',
      }
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)
      prisonerService.getEstablishmentForPrisoner.mockResolvedValue(null)

      await roNotificationHandler.sendRo({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(roNotificationSender.sendNotifications).not.toHaveBeenCalled()
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when delius staff records are not linked to user', async () => {
      const responsibleOfficer = {
        name: 'Jo Smith',
        deliusId: 'STAFF-1',
        lduCode: 'code-1',
        lduDescription: 'lduDescription-1',
        nomsNumber: 'AAAA12',
        probationAreaCode: 'prob-code-1',
        probationAreaDescription: 'prob-desc-1',
        isUnlinkedAccount: true,
      }

      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)

      await roNotificationHandler.sendRo({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(warningClient.raiseWarning).toHaveBeenCalledWith(
        bookingId,
        STAFF_NOT_LINKED,
        `RO with delius staff code: 'STAFF-1' and name: 'Jo Smith', responsible for managing: 'AAAA12', has unlinked staff record in delius`
      )

      expect(roNotificationSender.sendNotifications).toHaveBeenCalledWith({
        bookingId,
        responsibleOfficer,
        prison: 'HMP Blah',
        notificationType: 'RO_NEW',
        sendingUserName: username,
      })
      expect(eventPublisher.raiseCaseHandover).toHaveBeenCalledWith({
        username,
        bookingId,
        transitionType: 'caToRo',
        submissionTarget: responsibleOfficer,
        source: {
          agencyId: 'LT1',
          type: 'prison',
        },
        target: {
          lduCode: 'code-1',
          probationAreaCode: 'prob-code-1',
          type: 'probation',
        },
      })
      expect(licenceService.markForHandover).toHaveBeenCalledWith(bookingId, 'caToRo')
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })
  })

  test('caToRo adds RO role in delius if have access to delius username', async () => {
    const responsibleOfficer = {
      name: 'Jo Smith',
      deliusId: 'STAFF-1',
      username: 'userBob',
      lduCode: 'code-1',
      lduDescription: 'lduDescription-1',
      nomsNumber: 'AAAA12',
      probationAreaCode: 'prob-code-1',
      probationAreaDescription: 'prob-desc-1',
      isUnlinkedAccount: true,
    }

    roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)

    await roNotificationHandler.sendRo({
      transition: transitionForDestinations.bassReview,
      bookingId,
      token,
      licence,
      prisoner,
      user,
    })

    expect(deliusClient.addResponsibleOfficerRole).toHaveBeenCalledWith('userBob')
  })

  test('caToRo does not RO role in delius if delius username is not present', async () => {
    const responsibleOfficer = {
      name: 'Jo Smith',
      deliusId: 'STAFF-1',
      lduCode: 'code-1',
      lduDescription: 'lduDescription-1',
      nomsNumber: 'AAAA12',
      probationAreaCode: 'prob-code-1',
      probationAreaDescription: 'prob-desc-1',
      isUnlinkedAccount: true,
    }

    roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)

    await roNotificationHandler.sendRo({
      transition: transitionForDestinations.bassReview,
      bookingId,
      token,
      licence,
      prisoner,
      user,
    })

    expect(deliusClient.addResponsibleOfficerRole).not.toHaveBeenCalled()
  })

  describe('sendRoEmail', () => {
    const responsibleOfficer = {
      name: 'Jo Smith',
      deliusId: 'delius1',
      email: 'ro@user.com',
      lduCode: 'code-1',
      lduDescription: 'lduDescription-1',
      nomsNumber: 'AAAA12',
      probationAreaCode: 'prob-code-1',
      probationAreaDescription: 'prob-desc-1',
    }

    test('handles caToRo', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)

      const result = await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.addressReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(result).toStrictEqual(responsibleOfficer)

      expect(roNotificationSender.sendNotifications).toHaveBeenCalledWith({
        bookingId,
        responsibleOfficer,
        prison: 'HMP Blah',
        notificationType: 'RO_NEW',
        sendingUserName: username,
      })
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when cannot get RO contact details', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue({
        message: 'failed to find RO',
      })

      const result = await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(result).toStrictEqual({ message: 'failed to find RO' })

      expect(roNotificationSender.sendNotifications).not.toHaveBeenCalled()
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when cannot get prison', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue(responsibleOfficer)
      prisonerService.getEstablishmentForPrisoner.mockResolvedValue(null)

      const result = await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(result).toStrictEqual({ code: 'MISSING_PRISON', message: 'Missing prison for bookingId: -1' })

      expect(roNotificationSender.sendNotifications).not.toHaveBeenCalled()
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo when delius staff records are not linked to user', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue({
        ...responsibleOfficer,
        isUnlinkedAccount: true,
      })

      const result = await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(result).toStrictEqual({ code: 'STAFF_NOT_LINKED', message: 'User is not linked for bookingId: -1' })

      expect(warningClient.raiseWarning).not.toHaveBeenCalled()
      expect(roNotificationSender.sendNotifications).not.toHaveBeenCalled()
      expect(eventPublisher.raiseCaseHandover).not.toHaveBeenCalled()
      expect(licenceService.markForHandover).not.toHaveBeenCalled()
      expect(licenceService.removeDecision).not.toHaveBeenCalled()
    })

    test('caToRo adds RO role in delius if have access to delius username', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue({
        ...responsibleOfficer,
        username: 'userBob',
      })

      await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(deliusClient.addResponsibleOfficerRole).toHaveBeenCalledWith('userBob')
    })

    test('caToRo does not RO role in delius if delius username is not present', async () => {
      roContactDetailsService.getResponsibleOfficerWithContactDetails.mockResolvedValue({
        ...responsibleOfficer,
        username: undefined,
      })

      await roNotificationHandler.sendRoEmail({
        transition: transitionForDestinations.bassReview,
        bookingId,
        token,
        licence,
        prisoner,
        user,
      })

      expect(deliusClient.addResponsibleOfficerRole).not.toHaveBeenCalled()
    })
  })
})
