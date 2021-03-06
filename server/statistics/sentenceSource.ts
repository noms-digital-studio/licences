import createSignInService from '../authentication/signInService'
import { OffenderSentence } from '../data/nomisClientTypes'
import nomisClientBuilder = require('../data/nomisClientBuilder')

const signInService = createSignInService()

export default class SentenceSource {
  async getOffenderSentencesByBookingId(bookingIds: number[]): Promise<Map<number, OffenderSentence>> {
    console.log(`Fetching sentences for ${bookingIds.length} bookingIds`)
    const token = await signInService.getAnonymousClientCredentialsTokens('nomis')
    const sentences: OffenderSentence[] = await nomisClientBuilder(token.token).getOffenderSentencesByBookingId(
      bookingIds
    )
    console.log(`Retrieved ${sentences.length} sentence rows`)
    return sentences.reduce(
      (map, sentence) => map.set(sentence.bookingId, sentence),
      new Map<number, OffenderSentence>()
    )
  }
}
