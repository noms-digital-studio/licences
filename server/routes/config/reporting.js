module.exports = {
    reportingInstructions: {
        licenceSection: 'reportingInstructions',
        fields: [
            {name: {}},
            {buildingAndStreet1: {}},
            {buildingAndStreet2: {}},
            {townOrCity: {}},
            {postcode: {}},
            {telephone: {}}
        ],
        nextPath: {
            path: '/hdc/taskList/',
            change: '/hdc/review/licenceDetails/'
        }
    },
    reportingDate: {
        licenceSection: 'reportingDate',
        fields: [
            {
                reportingDate: {
                    splitDate: {day: 'reportingDay', month: 'reportingMonth', year: 'reportingYear'}
                }
            },
            {reportingTime: {}}
        ],
        validateInPlace: true,
        noModify: true,
        nextPath: {
            path: '/hdc/pdf/taskList/'
        }
    }
};
