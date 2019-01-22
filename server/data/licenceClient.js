const {licenceStages} = require('../services/config/licenceStages');
const db = require('./dataAccess/db');

module.exports = {

    deleteAll: function() {
        return db.query(`delete from licences where booking_id != 1200635; 
        delete from licence_versions where booking_id != 1200635`);
    },

    deleteAllTest: function() {
        return db.query(`delete from licences where booking_id < 23 or booking_id = '1200635'; 
          delete from licence_versions where booking_id < 23 or booking_id = '1200635'`);
    },

    getLicences: async function(bookingIds) {
        const query = {
            text: `select l.licence, l.booking_id, l.stage, l.version, l.transition_date,
                   v.version as approvedVersion 
                   from licences l 
                   left outer join licence_versions v on v.id = (
                   select id from licence_versions
                   where booking_id = l.booking_id
                   order by version desc limit 1
                   )
                   where l.booking_id in (${bookingIds.map(id => `'${id}'`).join(',')})`
        };

        const {rows} = await db.query(query);
        return rows;
    },

    getLicence: async function(bookingId) {
        const query = {
            text: `select licence, booking_id, stage, version, vary_version from licences where booking_id = $1`,
            values: [bookingId]
        };

        const {rows} = await db.query(query);

        if (rows) {
            return rows[0];
        }

        return {};
    },

    getApprovedLicenceVersion: async function(bookingId) {
        const query = {
            text: `select version, vary_version, template, timestamp from licence_versions 
                    where booking_id = $1 order by version desc, vary_version desc limit 1`,
            values: [bookingId]
        };

        const {rows} = await db.query(query);

        if (rows && rows[0]) {
            return rows[0];
        }

        return null;
    },

    createLicence: function(bookingId, licence = {}, stage = licenceStages.DEFAULT, version = 1, varyVersion = 0) {
        const query = {
            text: 'insert into licences (booking_id, licence, stage, version, vary_version) values ($1, $2, $3, $4, $5)',
            values: [bookingId, licence, stage, version, varyVersion]
        };

        return db.query(query);
    },

    updateLicence: async function(bookingId, licence = {}, postRelease) {
        const query = {
            text: 'UPDATE licences SET licence = $1 where booking_id=$2;',
            values: [licence, bookingId]
        };

        await db.query(query);
        return updateVersion(bookingId, postRelease);
    },

    updateSection: async function(section, bookingId, object, postRelease) {
        const path = `{${section}}`;

        const query = {
            text: 'update licences set licence = jsonb_set(licence, $1, $2) where booking_id=$3',
            values: [path, object, bookingId]
        };

        await db.query(query);
        return updateVersion(bookingId, postRelease);
    },

    updateStage: function(bookingId, stage) {
        const query = {
            text: 'update licences set (stage, transition_date) = ($1, current_timestamp) where booking_id = $2',
            values: [stage, bookingId]
        };

        return db.query(query);
    },

    getDeliusUserName: async function(nomisUserName) {
        const query = {
            text: 'select staff_id from staff_ids where nomis_id = $1',
            values: [nomisUserName]
        };

        const {rows} = await db.query(query);

        if (rows[0]) {
            return rows[0].staff_id;
        }

        return undefined;
    },

    saveApprovedLicenceVersion: function(bookingId, template) {
        const query = {
            text: `insert into licence_versions (booking_id, licence, version, vary_version, template)
                    select booking_id, licence, version, vary_version, $1
                    from licences where booking_id = $2`,
            values: [template, bookingId]
        };

        return db.query(query);
    }
};

async function updateVersion(bookingId, postRelease) {
    const version = postRelease ? 'vary_version' : 'version';
    const query = {
        text: `UPDATE licences SET ${version} = ${version} + 1
               WHERE booking_id = $1 and ${version} in (
                SELECT max(${version})
                FROM licence_versions
                WHERE booking_id = $1);`,
        values: [bookingId]
    };
    return db.query(query);
}
