// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Current test environment assumed as local deployment
// if testing locally, replace https://test-nsync.services.il2000.com/nsync with http://localhost:8080/nsync
// if testing rates locally, replace 'https://spa.services.il2000.com/rates' with 'http://172.16.3.100:8080/webservice/rater'

export const environment = {
  production: false,
  cookie_domain: 'localhost',
  cookie_expiration: 365,
  cookie_secure: false,
  user_pool_id: 'us-east-1_6y8BSwFHY',
  app_client_id: '2qrspvn49vf9nt8cp318br7ai3',
  ENV_NSYNC_BASE_URL: 'https://test-nsync.services.il2000.com/nsync',
  ENV_ICARUS_BASE_URL: 'https://test-icarus.apps.il2000.com/icarus',
  ENV_TIBER_BASE_URL: 'https://test-tiber.apps.il2000.com/Tiber',
  ENV_LAMBDA_API_BASE_URL: 'https://testinutils.services.il2000.com/webservice',
  ENV_LAMBDA_TRACKING_API_BASE_URL: 'https://fr3tx7ufke.execute-api.us-east-1.amazonaws.com/test',
  ENV_LAMBDA_TL_TRACKING_API_BASE_URL: 'https://dkk5q0fs5f.execute-api.us-east-1.amazonaws.com/Stage/tracking',
  ENV_LAMBDA_RECORDS_API_BASE_URL: 'https://2hpblratld.execute-api.us-east-1.amazonaws.com/test', // use /prod for prod
  ENV_USER_CREDENTIAL_API_BASE_URL: 'https://rlh9vck6x7.execute-api.us-east-1.amazonaws.com/Stage',
  // RATER_URL: 'http://172.16.3.100:8080/webservice/rater', // TEST
  RATER_URL: 'http://test-rater-bal-1438988023.us-east-1.elb.amazonaws.com:8080/webservice/rater', // TEST
  API_TOKEN: 'ILToken NDJkMmJmNWMzYzNjYjRmNTgzZmEyZmRmM2M1YmI3NDA4YzAyYTNlYzE2OWRhY2M1', // TODO: Secure this upon switch to prod
  SHIPMENT_HISTORY_URL: 'https://9cl3xx6eq2.execute-api.us-east-1.amazonaws.com/Stage',
  REPORT_ANALYSIS_URL: 'https://lud0alhsqi.execute-api.us-east-1.amazonaws.com/Stage',
  CLIENT_FIELDS_URL: 'https://26l8vd6o0l.execute-api.us-east-1.amazonaws.com/Stage',
  VOLUME_RATES_URL: 'https://p3wllrw57j.execute-api.us-east-1.amazonaws.com/Stage',
  MILEAGE_URL: 'http://172.16.3.178:8080/addressService/mileage',
  DAT_INTEGRATION_URL: 'https://e1r5cdqzfc.execute-api.us-east-1.amazonaws.com/Stage',
  CARRIER_PROFILING_URL: 'https://ey8y5hb7lg.execute-api.us-east-1.amazonaws.com/Stage',
  NOTES_PROFILING_URL: 'https://hqit14n6ra.execute-api.us-east-1.amazonaws.com/Stage',
  LOAD_TRACK_URL: 'https://4ltu0o8hs2.execute-api.us-east-1.amazonaws.com/Stage',
  AWS_CLAIM_URL: 'https://ra3x68yl9l.execute-api.us-east-1.amazonaws.com/Stage',
  AWS_CLAIM_API_KEY: 'AsMGw6NZU01aOERpcBu0o7Y91Mh6iDYW838j7VmO',
  FAST_FOREX_URL: 'https://api.fastforex.io/',
  FAST_FOREX_API_KEY: 'c0ded72b24-ebbdb9361f-s6bznm',
  TRUCKER_TOOLS_API_ACTIVE: false,
  MACROPOINT_API_ACTIVE: true,
  DAT_API_ACTIVE: true,
  MACROPOINT_API_URL: 'https://52lzvlxma5.execute-api.us-east-1.amazonaws.com/Prod',
  CARRIER_SOURCE: 'MCLEOD'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
