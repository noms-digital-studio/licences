/**
 * @template T
 * @typedef {import("../../types/licences").Result<T>} Result
 */
/**
 * @typedef {import("../../types/licences").Error} Error
 * @typedef {import("../../types/licences").CaService} CaService
 * @typedef {import("../../types/licences").RoService} RoService
 */

const logger = require('../../log.js')
const { unwrapResult } = require('../utils/functionalHelpers')
const { NO_OFFENDER_NUMBER, NO_COM_ASSIGNED, LDU_INACTIVE, COM_NOT_ALLOCATED } = require('./serviceErrors')

/**
 * @param {RoService} roService
 * @returns {CaService} caService
 */
module.exports = function createCaService(roService, lduActiveClient, { continueCaToRoFeatureFlag }) {
  return {
    async getReasonForNotContinuing(bookingId, token) {
      if (!continueCaToRoFeatureFlag) {
        return []
        // When this feature is disabled, we never block the CA from continuing the case
      }

      const [ro, error] = unwrapResult(await roService.findResponsibleOfficer(bookingId, token))

      if (error) {
        logger.info(
          `Found reason for not continuing processing booking: ${bookingId}, error: ${error.code}:${error.message}`
        )
        switch (error.code) {
          case 'NO_OFFENDER_NUMBER':
            return [NO_OFFENDER_NUMBER]
          case 'NO_COM_ASSIGNED':
            return [NO_COM_ASSIGNED]
          default:
            throw new Error(`Unexpected error received: ${error.code}: ${error.message}`)
        }
      }

      const { lduCode, isAllocated } = ro

      const isLduActive = await lduActiveClient.isLduPresent(lduCode)

      if (!isLduActive || !isAllocated) {
        return [...(!isLduActive ? [LDU_INACTIVE] : []), ...(!isAllocated ? [COM_NOT_ALLOCATED] : [])]
      }
      // TODO: Do we need to warn if the com isn't the current responsible officer for the offender?
      // returning null means there is no reason preventing CA from continuing referral to RO
      return []
    },
  }
}
