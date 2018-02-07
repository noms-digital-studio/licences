module.exports = {
    optOut: {
        licenceSection: 'optOut',
        fields: [
            {decision: {}},
            {reason: {dependentOn: 'decision', predicate: 'Yes'}}
        ],
        nextPathDecision: {
            discriminator: 'decision',
            Yes: '/hdc/taskList/',
            No: '/hdc/proposedAddress/bassReferral/'
        },
        nextPath: null
    },
    bassReferral: {
        licenceSection: 'bassReferral',
        fields: [
            {decision: {}},
            {proposedTown: {dependentOn: 'decision', predicate: 'Yes'}},
            {proposedCounty: {dependentOn: 'decision', predicate: 'Yes'}}
        ],
        nextPathDecision: {
            discriminator: 'decision',
            Yes: '/hdc/taskList/',
            No: '/hdc/proposedAddress/curfewAddress/'
        },
        nextPath: null
    },
    curfewAddress: {
        licenceSection: 'curfewAddress',
        nextPath: '/hdc/proposedAddress/confirmAddress/',
        fields: [
            {addressLine1: {}},
            {addressLine2: {}},
            {addressTown: {}},
            {postCode: {}},
            {telephone: {}},
            {electricity: {}},
            {occupier: {}},
            {residents: {}},
            {cautionedAgainstResident: {}}
        ]
    },
    confirmAddress: {
        licenceSection: 'curfewAddress',
        nextPath: '/hdc/proposedAddress/submit/'
    },
    submit: {
        fields: [
            {licenceStatus: {}}
        ],
        nextPath: '/hdc/proposedAddress/confirmation/'
    },
    confirmation: {
        nextPath: '/hdc/taskList/'
    }
};
