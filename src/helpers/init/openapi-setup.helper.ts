import { join, relative } from 'path';
import * as OpenAPI from 'express-openapi';
import * as swaggerUI from 'swagger-tools/middleware/swagger-ui';

import { apiDoc } from '../../api-doc';
import { addAuthorization } from '../auth.helper';
import { glob } from '../glob.helper';
import { logger } from '../logger.helper';

const buildApiFolder = process.cwd() + '/build/api/1.0';

export async function init(app: any): Promise<any> {
  const buildApiFolderGlob = join(buildApiFolder, '**', '*.js');
  const files = await glob(buildApiFolderGlob);
  let openApiPaths = files
    .filter(file => !file.match(/\.spec\.js/))
    .map(file => file.replace(/\.js$/, ''))
    .map(file => ({
        path: '/' + relative(buildApiFolder, file).replace(/\\/g, '/'),
        module: require(file)
      })
    );
  openApiPaths = addAuthorization(openApiPaths);  // Add the Authorization header to every doc

  const openapi = OpenAPI.initialize({
    paths: openApiPaths,
    app,
    apiDoc
  });
  const openApiSpec = openapi.apiDoc;
  app.use(swaggerUI(openApiSpec));

  logger.info('OpenAPI route initialized');
}
