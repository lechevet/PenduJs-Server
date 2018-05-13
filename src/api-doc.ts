import { checkBodyValidity } from './helpers/api-doc.helper';
import { config } from './config';

export const apiDoc = {
  'x-express-openapi-additional-middleware': [ checkBodyValidity ],
  swagger: '2.0',
  basePath: config.application.api.basePath,
  info: {
    title: config.application.name,
    version: config.application.version
  },
  definitions: {
    Error: {
      type: 'object',
      properties: {
        status: {
          type: 'number'
        },
        message: {
          type: 'string'
        },
        trace: {
          type: 'string'
        },
        stackTrace: {
          type: 'string'
        }
      },
      required: [ 'status' ]
    },
    User: {
      type: 'object',
      properties: {
        userName: {
          type: 'string'
        },
        email_address: {
          type: 'string'
        },
        role: {
          type: 'string',
          enum: [
            'Administrator',
            'SimpleUser'
          ]
        }
      },
      required: [ 'userName', 'email_address', 'role' ]
    },
  },
  paths: {
  }
};
