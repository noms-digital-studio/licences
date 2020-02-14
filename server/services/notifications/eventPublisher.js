/** @typedef {import('../../../types/licences').Destination} Destination */

const flattenDestination = (type, destination) =>
  Object.keys(destination).reduce((result, key) => ({ ...result, [`${type}_${key}`]: destination[key] }), {})

class EventPublisher {
  /**
   * @param {import('../../data/audit')} audit
   * @param {import('applicationinsights') | undefined} applicationInsights
   */
  constructor(audit, applicationInsights) {
    this.audit = audit
    this.telemetryClient = applicationInsights ? applicationInsights.defaultClient : null
  }

  /**
   *
   * @param {object} args
   * @param {string} args.username
   * @param {string} args.bookingId
   * @param {string} args.transitionType
   * @param {*} args.submissionTarget
   * @param {Destination} args.source
   * @param {Destination} args.target
   */
  async raiseCaseHandover({ username, bookingId, transitionType, submissionTarget, source, target }) {
    await this.audit.record('SEND', username, {
      bookingId,
      transitionType,
      submissionTarget,
      source,
      target,
    })

    if (this.telemetryClient) {
      await this.telemetryClient.trackEvent({
        name: 'CaseHandover',
        properties: {
          bookingId,
          transitionType,
          ...flattenDestination('source', source),
          ...flattenDestination('target', target),
        },
      })
    }
  }
}

module.exports = EventPublisher
