const logger = require('../../log.js');
const {formatObjectForView} = require('./utils/formatForView');

module.exports = {createPrisonerService};

function createPrisonerService(nomisClientBuilder) {
    async function getPrisonerDetails(nomisId, token) {
        try {
            logger.info(`getPrisonerDetail: ${nomisId}`);

            const nomisClient = nomisClientBuilder(token);

            const prisoners = await nomisClient.getHdcEligiblePrisoner(nomisId);
            const prisoner = prisoners[0];
            if (!prisoner) {
                return;
            }

            const bookingId = prisoner.bookingId;

            // todo could make this use promise.all, but wait until we know the API is stable and details are right
            const sentence = await nomisClient.getSentenceDetail(bookingId);
            const aliases = await nomisClient.getAliases(bookingId);
            const offences = await nomisClient.getMainOffence(bookingId);
            const com = await nomisClient.getComRelation(bookingId);

            const image = prisoner.facialImageId ?
                await nomisClient.getImageInfo(prisoner.facialImageId) : {imageId: false};

            return formatObjectForView({...prisoner, ...sentence, offences, ...image, com, aliases});

        } catch (error) {
            logger.error('Error getting prisoner info');
            logger.error(error);
            throw error;
        }
    }

    async function getPrisonerImage(imageId, token) {
        try {
            logger.info(`getPrisonerImage: ${imageId}`);

            const nomisClient = nomisClientBuilder(token);
            return await nomisClient.getImageData(imageId);
        } catch (error) {
            logger.error('Error getting prisoner image');

            return null;
        }
    }

    return {getPrisonerDetails, getPrisonerImage};
};


