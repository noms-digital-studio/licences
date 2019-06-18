const superagent = require('superagent')
const logger = require('../../log')
const config = require('../config')
const { unauthorisedError } = require('../utils/errors')

const timeoutSpec = {
  response: config.nomis.timeout.response,
  deadline: config.nomis.timeout.deadline,
}

const { apiUrl } = config.delius

module.exports = signInService => {
  return {
    getROPrisoners(deliusStaffCode) {
      const path = `${apiUrl}/staff/staffCode/${deliusStaffCode}/managedOffenders`
      return deliusGet({ path })
    },

    getResponsibleOfficer(offenderNo) {
      const path = `${apiUrl}/offenders/nomsNumber/${offenderNo}/responsibleOfficers`
      return deliusGet({ path })
    },
  }

  async function deliusGet({ path } = {}) {
    const token = await signInService.getAnonymousClientCredentialsTokens('delius')
    if (!token) {
      throw unauthorisedError()
    }

    try {
      const result = await superagent
        .get(path)
        .set('Authorization', `Bearer ${token.token}`)
        .timeout(timeoutSpec)

      return result.body
    } catch (error) {
      logger.warn('Error calling delius', path, error.stack)
      throw error
    }
  }
}