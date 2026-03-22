'use strict'

/**
 * NEW RELIC MAIN CONFIGURATION
 * Future mein naya project banayein: 
 * 1. Is file ko naye project mein copy karein.
 * 2. Bas 'app_name' (line 12 par) ka naam badal dein.
 */

exports.config = {
  // YEH BADALNA HAI NAYE PROJECT KE LIYE:
  app_name: ['monodesk-app'], 
  
  // YEH HAMESHA SECURE RAHEGA:
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '', 

  
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
