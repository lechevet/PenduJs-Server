/**
 * <helpers/glob.helper>
 * This module helps matching the correct files (e.g. for our openAPI set up)
 */

import * as Glob from 'glob';

export async function glob(pattern: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    Glob(pattern, (err: any, result: string[]) => ( err ? reject(err) : resolve(result)));
  });
}
