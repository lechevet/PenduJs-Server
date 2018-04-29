import * as filter from 'json-schema-filter';
import { config } from '../config';
import { OpenApiValidationError } from '../models/errors/OpenApiValidationError';

// tslint:disable-next-line:prefer-const no-var-requires
let apiDoc = require('../api-doc');

export const getDocFromRef: any = (ref: string) => {
  if (!ref) {
    const error = new Error ('The referenced APIDoc is not defined');
    throw new OpenApiValidationError(error);
  }
  if (typeof ref !== 'string' || ref.charAt(0) !== '#' || ref.split('/').length < 2) {
    const error = new Error ('The referenced APIDoc path is invalid');
    throw new OpenApiValidationError(error);
  }
  const refId = ref.split('/')[ref.split('/').length - 1];
  if (!apiDoc.apiDoc.definitions) {
    const error = new Error ('No definition is set in the APIDoc');
    throw new OpenApiValidationError(error);
  }
  const definition = apiDoc.apiDoc.definitions[refId];
  if (!definition) {
    const error = new Error ('The referenced APIDoc doesn\'t exist');
    throw new OpenApiValidationError(error);
  }
  return getSubDocsFromDoc(definition);
};

// updates a documentation to fill every "$ref" with their correct reference
export const getSubDocsFromDoc: any = (doc: any): any => {
  if (doc.hasOwnProperty('properties')) {
    for (const key of Object.keys(doc.properties)) {
      if (doc.properties[key].hasOwnProperty('$ref')) {
        doc.properties[key] = getDocFromRef(doc.properties[key].$ref);
      }
      doc.properties[key] = getSubDocsFromDoc(doc.properties[key]);
    }
  }
  if (doc.hasOwnProperty('items') && doc.items.hasOwnProperty('$ref')) {
    doc.items = getDocFromRef(doc.items.$ref);
  }
  return doc;
};

export const checkBodyValidity: any = (req, _res, next) => {
  try {
    // separate URL parameters (/api/customer/agents/:Id/state/:state)
    const pointRegex = /(:\w*[\/.])/g;

    // use the request route to build the ".js" file path
    let path: any = req.route.path.replace(config.application.api.basePath, '../../build/api/1.0') + '.js';

    // replace the ":param" to "{param}"
    path = path.split(pointRegex)
      .map(substr => {
        if (substr.match(pointRegex)) {
          return '{' + substr.slice(1, substr.length - 1) + '}' + substr.charAt(substr.length - 1);
        }
        return substr;
      }).join('');

    // OpenAPI specs use these HTTP method names, related to these methods
    const openApiMethodAliases = {
      DELETE: 'del',
      GET: 'get',
      HEAD: 'head',
      OPTIONS: 'options',
      PATCH: 'patch',
      POST: 'post',
      PUT: 'put'
    };

    // For example, if the user did "DELETE" this path, the according operation will be located in "del"
    const method = openApiMethodAliases[req.method];
    const operation = require(path);

    // Check if the operation is valid, if this method is allowed and if an APIDoc is specified
    if (!operation) {
      throw new Error('Selected operation does not exist');
    } else if (!operation[method]) {
      throw new Error('Unauthorized method');
    } else if (!operation[method].apiDoc) {
      throw new Error('Unspecified Api Doc');
    }

    // Get the specified apiDoc
    const operationApiDoc = operation[method].apiDoc;

    // Get the global endpoint apiDoc parameters if the specified operation doesn't have any
    const parameters = operationApiDoc.parameters ? operationApiDoc.parameters : operation.parameters;

    // If no parameter should be specified, still clean the request body
    if (!parameters) {
      req.body = {};
      return next();
    }

    let invalidParameters: string[] = [];
    // Read each parameter
    parameters.forEach(param => {
      // Only check the validity of the "body" parameters
      if (param.in === 'body') {
        let doc: any = null;

        // Some definition can refer to other via the "$ref" attribute, and other can be defined directly.
        if (param.schema && param.schema.$ref) {
          doc = getDocFromRef(param.schema.$ref);
        } else {
          doc = param.schema;
        }

        // Use json-schema-filter to remove parameters which aren't in the ApiDoc
        const filteredBody = filter(doc, req.body);

        // And check if the "filtered" body is the same as the sent body.
        const invalidParams = checkUnknownBodyParams(req.body, filteredBody);
        if (invalidParams) {
          invalidParameters = invalidParameters.concat(invalidParams);
        }
      }
    });
    if (invalidParameters.length > 0) {
      const error: any = new Error('Some specified parameters aren\'t specified in the API Doc');
      error.invalidParameters = invalidParameters;
      throw error;
    }
    return next();
  } catch (e) {
    if (e.statusCode) {
      throw e;
    }
    throw new OpenApiValidationError(e);
  }
};

export const checkUnknownBodyParams =
  (body: any, filteredBody: any, path ?: string, invalidParams: string[] = []): string[] => {

    // Read each body parameters
    Object.keys(body).forEach(key => {

      // If the filtered body doesn't have the actual parameter, throw an error
      if (filteredBody.hasOwnProperty(key)) {

        // To differenciate object from arrays, check that the "length" is undefined
        if (typeof filteredBody[key] === 'object' && filteredBody[key].length === undefined) {

          // If the current property is linked to an object,
          // build the path (for the error) and check that object validity
          checkUnknownBodyParams(body[key], filteredBody[key], path ? path + '.' + key : key, invalidParams);
          return;
        }
        if (typeof filteredBody[key] === 'object'
          && filteredBody[key].length !== undefined
          && filteredBody[key].filter(a => (Object.keys(a).length > 0)).length > 0) {
          let index = 0;
          // Then, some properties might be arrays. Check their validity too
          for (const filteredBodyElmt of filteredBody[key]) {
            checkUnknownBodyParams(body[key][index], filteredBodyElmt,
              path ? path + '.' + key + '[' + index + ']' : key + '[' + index + ']', invalidParams);
            index ++;
          }
        }

        // If everything went right, return.
        return;
      } else {

        // Build the error if the parameter is invalid
        invalidParams.push(path ? path + '.' + key : key);
      }
    });
    return invalidParams;
  };
