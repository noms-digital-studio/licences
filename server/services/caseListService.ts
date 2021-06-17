import R from 'ramda'

import { Fail, Success, Result } from '../utils/Result'
import { RoService } from './roService'
import { StaffDetails } from '../data/deliusClient'
import { LicenceClient } from '../data/licenceClient'
import { DeliusIds } from '../data/licenceClientTypes'

const logger = require('../../log')
const { isEmpty } = require('../utils/functionalHelpers')

export = function createCaseListService(
  nomisClientBuilder,
  roService: RoService,
  licenceClient: LicenceClient,
  caseListFormatter
) {
  async function getCaseList(username, role, token): Promise<{ hdcEligible: any[]; message?: string }> {
    switch (role) {
      case 'READONLY':
      case 'CA':
      case 'DM':
        return getPrisonCaseList(token)

      case 'RO':
      case 'RO_READONLY':
        return getROCaseList(username, token)

      default:
        throw Error(`Illegal state: unrecognised role ${role}`)
    }
  }

  const getPrisonCaseList = async (token) => {
    const hdcEligible = await nomisClientBuilder(token).getHdcEligiblePrisoners()
    return { hdcEligible }
  }

  /**
   * Assume username is assigned to an RO.  Look up this user in the local db (staff_ids table) and take the staff identifier.
   * Alternatively if a unique staff identifier cannot be found in this db, ask Delius for a staff identifier.
   */
  const getROCaseList = async (username, token) => {
    const idsFromLocalDB = await getIdsFromDb(username)
    const ids = await idsFromLocalDB.orRecoverAsync(() => getIdsFromDelius(username))
    const offenders = await ids.mapAsync(getOffendersForIds(token))
    return offenders.match(R.identity, (message) => ({ hdcEligible: [], message }))
  }

  const getIdsFromDb = async (username: string): Promise<Result<DeliusIds, string>> => {
    const deliusIds = await licenceClient.getDeliusIds(username)
    return validateDeliusIds(deliusIds).flatMap(getDeliusId)
  }

  const getIdsFromDelius = async (username: string): Promise<Result<DeliusIds, string>> => {
    const staffDetailsResult = await getStaffDetailsFromDelius(username)

    return staffDetailsResult.flatMap(({ staffIdentifier }) =>
      isEmpty(staffIdentifier)
        ? Fail(`Delius did not supply a staff identifier for username ${username}`)
        : Success({ staffIdentifier })
    )
  }

  const getStaffDetailsFromDelius = async (username: string): Promise<Result<StaffDetails, string>> => {
    const staffDetails = await roService.getStaffByUsername(username)

    return isEmpty(staffDetails)
      ? Fail(`Staff details not found in Delius for username: ${username}`)
      : Success(staffDetails)
  }

  const validateDeliusIds = (deliusIds: DeliusIds[]): Result<DeliusIds[], string> =>
    !Array.isArray(deliusIds) || deliusIds.length < 1 || isEmpty(deliusIds[0].staffIdentifier)
      ? Fail('Delius username not found for current user')
      : Success(deliusIds)

  const getDeliusId = (deliusIds: DeliusIds[]): Result<DeliusIds, string> =>
    deliusIds.length > 1 ? Fail('Multiple Delius usernames found for current user') : Success(deliusIds[0])

  const getOffendersForIds =
    (token: string) =>
    async ({ staffIdentifier }: DeliusIds): Promise<{ hdcEligible: any[] }> => {
      const offenders = await roService.getROPrisonersForStaffIdentifier(staffIdentifier, token)

      const hdcEligible = (offenders || []).filter(R.path(['sentenceDetail', 'homeDetentionCurfewEligibilityDate']))
      return { hdcEligible }
    }

  function neededForRole(prisoner, role) {
    const interestedStatuses = {
      RO: [
        { stage: 'PROCESSING_RO' },
        { stage: 'PROCESSING_CA' },
        { stage: 'APPROVAL' },
        { stage: 'DECIDED' },
        { stage: 'MODIFIED' },
        { stage: 'MODIFIED_APPROVAL' },
      ],
      DM: [
        { stage: 'PROCESSING_CA', status: 'Postponed' },
        { stage: 'APPROVAL' },
        { stage: 'DECIDED' },
        { stage: 'MODIFIED' },
        { stage: 'MODIFIED_APPROVAL' },
      ],
    }

    if (!interestedStatuses[role]) {
      return true
    }

    const includedStage = interestedStatuses[role].find((config) => prisoner.stage === config.stage)

    if (!includedStage) {
      return false
    }

    if (includedStage.status) {
      return includedStage.status === prisoner.status
    }

    return true
  }

  async function getHdcCaseList(token, username, role, tab = 'active') {
    try {
      const { hdcEligible, message } = await getCaseList(username, role, token)

      if (isEmpty(hdcEligible)) {
        logger.info('No hdc eligible prisoners')
        return { hdcEligible: [], message: message || 'No HDC cases' }
      }

      const formattedCaseList = await caseListFormatter.formatCaseList(hdcEligible, role)
      const formatted = formattedCaseList.filter(
        (prisoner) => neededForRole(prisoner, role) && prisoner.activeCase === (tab === 'active')
      )

      return { hdcEligible: formatted }
    } catch (error) {
      logger.error('Error during getHdcCaseList: ', error.stack)
      throw error
    }
  }

  return { getHdcCaseList }
}
