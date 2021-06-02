require('dotenv').config()

const production = process.env.NODE_ENV === 'production'
const oneDay = 24 * 60 * 60

function get(name, fallback, options = {}) {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

module.exports = {
  version: 0.1,

  production,

  enableTestUtils: get('ENABLE_TEST_UTILS', false),

  db: {
    username: get('DB_USER', 'licences'),
    password: get('DB_PASS', 'licences'),
    server: get('DB_SERVER', 'localhost'),
    database: get('DB_NAME', 'licences'),
    sslEnabled: get('DB_SSL_ENABLED', 'false'),
    port: get('DB_PORT', 5432),
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },

  nomis: {
    apiUrl: get('NOMIS_API_URL', 'http://localhost:8080/elite2api'),
    authUrl: get('NOMIS_AUTH_URL', 'http://localhost:9090/auth'),
    authExternalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth')),
    timeout: {
      response: 30000,
      deadline: 35000,
    },
    agent: {
      maxSockets: 100,
      maxFreeSockets: 10,
      freeSocketTimeout: 30000,
    },
    apiClientId: get('API_CLIENT_ID', 'licences'),
    apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
    admin: {
      apiClientId: get('ADMIN_API_CLIENT_ID', 'licencesadmin'),
      apiClientSecret: get('ADMIN_API_CLIENT_SECRET', 'clientsecret'),
    },
  },

  delius: {
    apiUrl: get('DELIUS_API_URL', 'http://localhost:8080/communityapi'),
    authUrl: get('DELIUS_AUTH_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth')),
    admin: {
      apiClientId: get('DELIUS_API_CLIENT_ID', get('ADMIN_API_CLIENT_ID', 'licencesadmin')),
      apiClientSecret: get('DELIUS_API_CLIENT_SECRET', get('ADMIN_API_CLIENT_SECRET', 'clientsecret')),
    },
    timeout: {
      response: 30000,
      deadline: 35000,
    },
    agent: {
      maxSockets: 100,
      maxFreeSockets: 10,
      freeSocketTimeout: 30000,
    },
    apiPrefix: get('DELIUS_API_PREFIX', '/api'),
    // this refers to the 'HDC Digital Update' RBAC which is mapped to LICENCE_RO and GLOBAL_SEARCH in the auth server
    responsibleOfficerRoleId: get('DELIUS_RO_ROLE_ID', 'LHDCBT002'),
    // this refers to the 'HDC Digital Update' RBAC which is mapped to LICENCE_RO, GLOBAL_SEARCH and LICENCE_VARY in the auth server
    responsibleOfficerVaryRoleId: get('DELIUS_RO_VARY_ROLE_ID', 'LHDCBT003'),
  },

  probationTeams: {
    apiUrl: get('PROBATION_TEAMS_API_URL', 'http://localhost:8080/probationteams'),
    authUrl: get('PROBATION_TEAMS_AUTH_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth')),
    timeout: {
      response: 30000,
      deadline: 35000,
    },
    agent: {
      maxSockets: 100,
      maxFreeSockets: 10,
      freeSocketTimeout: 30000,
    },
    admin: {
      apiClientId: get('PROBATION_TEAMS_API_CLIENT_ID', get('ADMIN_API_CLIENT_ID', 'licencesadmin')),
      apiClientSecret: get('PROBATION_TEAMS_API_CLIENT_SECRET', get('ADMIN_API_CLIENT_SECRET', 'clientsecret')),
    },
  },

  gotenberg: {
    apiUrl: get('GOTENBERG_API_URL', 'http://localhost:3001'),
    /*
     The HTML documents sent to Gotenberg for PDF conversion contain links to css files served by the HDC service.
     HDC_URL should be the base url inserted into the CSS links so that Gotenberg can fetch these CSS files.

     If you're running Gotenberg in a docker container on a mac, and running the licences service on the host (the mac)
     then the Gotenberg container will find the licences service at host.docker.internal.  This is a standard Docker feature.

     You can check this using curl or ping from within a handy container:

     docker run --rm -it alpine sh
     ping host.docker.internal
     curl http://host.docker.internal:3000

     */
    hdcUrl: get('HDC_URL', 'http://host.docker.internal:3000'),
  },

  tokenVerification: {
    url: get('TOKENVERIFICATION_API_URL', 'http://localhost:8100', { requireInProduction: true }),
    timeout: {
      response: get('TOKENVERIFICATION_TIMEOUT_RESPONSE', 10000),
      deadline: get('TOKENVERIFICATION_TIMEOUT_DEADLINE', 10000),
    },
    agent: {
      maxSockets: 100,
      maxFreeSockets: 10,
      freeSocketTimeout: 30000,
    },
    enabled: get('TOKENVERIFICATION_API_ENABLED', 'true') === 'true',
  },

  https: production,
  staticResourceCacheDuration: 365 * oneDay,

  session: {
    secret: get('SESSION_SECRET', 'licences-insecure-default-session', { requireInProduction: true }),
    expiryMinutes: get('WEB_SESSION_TIMEOUT_IN_MINUTES', '120', true),
  },

  pdf: {
    licences: {
      taggingCompanyTelephone: get('TAGGING_CO_PHONE', '0800 137 291'),
      pdfOptions: {
        marginTop: '0.8',
        marginBottom: '0.7',
        marginLeft: '0.55',
        marginRight: '0.35',
      },
    },
    forms: {
      formsDateFormat: 'Do MMMM YYYY',
      formsFileDateFormat: 'YYYYMMDD',
      formTemplates: {
        eligible: 'Eligible',
        ineligible: 'Not eligible',
        unsuitable: 'Not suitable',
        address_checks: 'Information about address checks',
        address: 'Address form',
        address_unsuitable: 'Address unsuitable',
        optout: 'Opt out',
        postponed: 'Postponed',
        no_time: 'Not enough time',
        refused: 'Refused',
        approved: 'Approved',
        agency_notification: 'Agency notification',
        cancel_agency_notification: 'Cancel agency notification',
        licence_variation: 'Licence variation',
      },
      pdfOptions: {
        marginTop: '0.8',
        marginBottom: '0.7',
        marginLeft: '0.55',
        marginRight: '0.35',
      },
    },
  },

  wordFormatForms: ['agency_notification', 'licence_variation'],

  domain: get('DOMAIN', 'http://localhost:3000'),
  port: get('PORT', 3000),
  tagManagerKey: get('TAG_MANAGER_KEY', null),

  notifications: {
    notifyKey: get('NOTIFY_API_KEY', 'dummy-key'),
    dueDateFormat: 'dddd Do MMMM',
    roNewCaseWorkingDays: 10,
    roNewCaseTodayCutOff: 15,
    clearingOfficeEmail: get('CLEARING_OFFICE_EMAIL', 'HDC.ClearingOffice@justice.gov.uk'),
    clearingOfficeEmailEnabled: get('CLEARING_OFFICE_EMAIL_ENABLED', 'YES'),
    activeNotificationTypes: get(
      'NOTIFY_ACTIVE_TEMPLATES',
      'CA_RETURN,CA_DECISION,RO_NEW,RO_TWO_DAYS,RO_DUE,RO_OVERDUE,DM_NEW,DM_TO_CA_RETURN'
    ).split(','),
  },

  pushToNomis: get('PUSH_TO_NOMIS', 'no') === 'yes',
  use2019Conditions: get('NEW_CONDITIONS', 'no') === 'yes',

  jobs: {
    systemUser: get('REMINDERS_SYSTEM_USER', ''),
    autostart: get('SCHEDULED_JOBS_AUTOSTART', 'no') === 'yes',
    overlapTimeout: get('SCHEDULED_JOBS_OVERLAP', 5000),
  },

  links: {
    exitUrl: get('EXIT_LOCATION_URL', '/', { requireInProduction: true }),
    globalSearchUrl: get('GLOBAL_SEARCH_URL', 'http://localhost:3002/global-search'),
    feedbackAndSupportUrl: get(
      'FEEDBACK_SUPPORT_URL',
      'https://support-dev.hmpps.service.justice.gov.uk/feedback-and-support'
    ),
  },
}
