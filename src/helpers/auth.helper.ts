/**
 * <helpers/authorization.helper>
 * This module adds the Authorization parameter to every request for SwaggerUI display reasons
 */

import { config } from '../config';
import { AuthorizationParameters, authorizedPath } from './jwt.helper';

/**
 * This function updates the apiDoc of every request to add the "Authorization"
 * parameter if necessary.
 * @param apiDoc
 */
export const addAuthorization = (apiDoc: any): any => (
  // Using ES6 shorthand. This function actually returns what's next
  apiDoc
    .map(doc => {

      // Before appending the Authorization param, check if the request isn't one of the "Authorization-less" ones
      for (const regex of authorizedPath) {

        // In order to do this, check for every allowed path if the current path respects the format.
        if (regex instanceof RegExp && (config.application.api.basePath + doc.path).search(regex) !== -1) {

          // If the format is one of the authorized paths, skip this route
          return doc;
        }
      }

      // Variable that will be used to handle empty properties
      let done = false;

      // the parameters are specified in the apiDoc
      for (const operation in doc.module) {
        // For each operation check if it isn't one of the "Authorization-less" ones
        let skip = false;
        for (const regex of authorizedPath) {
          // In order to do this, check for every allowed methods if the current operation is indicated.
          if ((regex.hasOwnProperty('url') &&
              regex.hasOwnProperty('methods')) &&
            (regex['methods'] === operation.toUpperCase() &&
              (config.application.api.basePath + doc.path).search(regex['url']) !== -1)) {
            // If the format is one of the authorized paths, skip this route
            skip = true;
          }
        }
        if (!skip) {
          // Check for invalidityD
          if (!doc.module[operation] || !doc.module[operation].apiDoc) {
            throw new Error(`Invalid OpenAPI declaration`);
          }
          // If no parameters are specified for this apiDoc, we add the Authorization.
          if (!doc.module[operation].apiDoc.parameters) {
            doc.module[operation].apiDoc.parameters = [AuthorizationParameters];
            done = true;
          }

          // If there are parameters, check for Authorization existence and add it if necessary
          if (doc.module[operation].apiDoc.parameters.indexOf(AuthorizationParameters) === -1) {
            doc.module[operation].apiDoc.parameters.push(AuthorizationParameters);
            done = true;
          }
          // Finally, if the authorization wasn't added for this operation, add it globally to the module.
          if (!done) {
            doc.module.parameters = [AuthorizationParameters];
          }
        }
      }
      return doc;
    })
);
