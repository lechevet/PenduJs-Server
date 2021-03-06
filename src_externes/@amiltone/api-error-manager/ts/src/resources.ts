export default {
  internalError: {
    code: 1000,
    message: 'An unexpected internal error has occured'
  },
  forbiddenError: {
    code: 1010,
    message: 'Forbidden request'
  },
  missingField: {
    code: 1020,
    message: 'Missing field'
  },
  tooLongURI: {
    code: 1030,
    message: 'Too long URI'
  },
  notFound: {
    code: 1040,
    message: 'Not found resource'
  },
  jwt: {
    code: 1050,
    message: 'JWT Error',
    sub_errors: {
      malformed: {
        code: 1,
        message: 'Malformed JWT'
      },
      missingSignature: {
        code: 2,
        message: 'Missing signature'
      },
      invalidSignature: {
        code: 3,
          message: 'Invalid signature'
      },
      missingToken: {
        code: 4,
        message: 'Missing token'
      },
      unknown: {
        code: -1,
        message: 'An undefined JWT error has occured'
      }
    }
  }
}
