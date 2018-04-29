/**
 * <services/filesHelper.helper>
 * This module is to manage files
 * It have function to extract file content
 * or to validate the data from a csv
 */
import * as csv from 'csv';
import * as promisify from 'es6-promisify';
import * as mzfs from 'mz/fs';
import { InvalidFileError } from '../models/errors/InvalidFileError';
import { MissingFileError } from '../models/errors/MissingFileError';
// tslint:disable-next-line:prefer-const
let fs = mzfs;

export const filesHelper = {

  /**
   * Function that get a path of file
   * then return this file (using nodejs 'fs' module)
   *
   * @param {Object} fileInfo information on the file (including it's buffer)
   *
   * @return {Promise<any>} content of the file
   */
  async getFile(fileInfo: { buffer: Buffer }): Promise<any> {
    if (!fileInfo || !fileInfo.buffer) {
      const customError = new Error('No file information');
      throw new MissingFileError(customError);
    } else {
      return fileInfo.buffer;
    }
  },

  /**
   * Function that check if a file mimetype respects a condition
   *
   * @param {Object} fileInfo information on the file (including its buffer)
   *
   * @param types allowed mime types
   * @return {Promise<void>}
   */
  async checkMimeTypes(fileInfo: any, types: string[]): Promise<void> {
    if (types.indexOf(fileInfo.mimetype) === -1) {
      const customError = new Error('Invalid file type. ' +
        'It (' + fileInfo.mimetype + ') should match these types : ' + types.join(', '));
      throw new InvalidFileError(customError);
    }
    return;
  },

  /**
   * Function that check if a file extension respects a condition
   *
   * @param {Object} fileInfo information on the file (including its buffer)
   *
   * @param extensions allowed extensions
   * @return {Promise<void>}
   */
  checkExtension(fileInfo: any, extensions: string[]): void {
    if (!fileInfo
      || !extensions
      || typeof fileInfo !== 'object'
      || !Array.isArray(extensions)
      || extensions.length === 0
      || !fileInfo.hasOwnProperty('originalname')) {
      const customError = new Error('Invalid file infos');
      throw new InvalidFileError(customError);
    }
    const splittedFile = fileInfo.originalname.split('.');
    const fileExtension = splittedFile[splittedFile.length - 1];
    if (extensions.indexOf(fileExtension) === -1) {
      const customError = new Error('Invalid file type. ' +
        'It (' + fileExtension + ') should match these types : ' + extensions.join(', '));
      throw new InvalidFileError(customError);
    }
    return;
  },

  /**
   * Function that format the raw file into a csv
   * The return value is an array of object
   * The object have the keys from the csv first row
   * and the value of each row
   *
   * @param {Object} file information on the file (including it's path)
   * @param {String} delimiter delimiter of the csv file (default ';')
   *
   * @return {Promise<object>} content of the file
   */
  async parseCsv(file: any, delimiter: string = ';'): Promise<any> {
    const parse = promisify(csv.parse);
    try {
      const output = await parse(file, {delimiter});

      const formatedOutput: object[] = [];
      // We need to loop through the rows (except the first)
      // to then format the data to rows of object with key/value
      // (where 'key' is the csv first row)
      // tslint:disable-next-line:one-variable-per-declaration
      for (let i = 1, iLen = output.length; i < iLen; i++) {
        const row: any = {};
        // tslint:disable-next-line:one-variable-per-declaration
        for (let j = 0, jLen = output[0].length; j < jLen; j++) {
          row[output[0][j]] = output[i][j];
        }
        formatedOutput.push(row); // pushing the row to the main object
      }

      return formatedOutput;
    } catch (error) {
      error.message = 'Erreur lors du traitement du fichier';
      throw new InvalidFileError(error);
    }


    // return new Promise(function(resolve: any, reject: any): void {
    //   csv.parse(file, {delimiter}, function(error: any, output: any): void {
    //     if (error) {
    //       error.name = 'csvParsingError';
    //       reject(error);
    //     } else {
    //       const formatedOutput: object[] = [];
    //       // We need to loop through the rows (except the first)
    //       // to then format the data to rows of object with key/value
    //       // (where 'key' is the csv first row)
    //       // tslint:disable-next-line:one-variable-per-declaration
    //       for (let i = 1, iLen = output.length; i < iLen; i++) {
    //         const row: any = {};
    //         // tslint:disable-next-line:one-variable-per-declaration
    //         for (let j = 0, jLen = output[0].length; j < jLen; j++) {
    //           row[output[0][j]] = output[i][j];
    //         }
    //         formatedOutput.push(row); // pushing the row to the main object
    //       }
    //
    //       resolve(formatedOutput);
    //     }
    //   });
    // });
  },

  /**
   * Function that format the raw file into a csv
   * The return value is an array of object
   * The object have the keys from the csv first row
   * and the value of each row
   * We check that each 'neddedValues' is present in the first object of the data
   *
   * @param {Object} data Array of rows from a CSV file
   * @param {String} neddedValues Value needed in the data
   *
   * @return {boolean} Is the format valid or not
   */
  checkCsvFormat(data: object[], neddedValues: string[]): boolean {
    let validformat = true;
    if (!data || !Array.isArray(data) || !data[0] || typeof data[0] !== 'object') {
      return false;
    }
    if (!neddedValues || !Array.isArray(neddedValues)) {
      return true;
    }

    for (const value of neddedValues) {
      if (!data[0][value]) {
        validformat = false;
      }
    }

    return validformat;
  },

  /**
   * Function that build a dir and is parent if necessary
   * at the root level of the app.
   */
  async mkdirp(path: string): Promise<any> {
    const dirList = path.split('/').filter(subDir => subDir !== '');
    let dir = '';
    for (const d of dirList) {
      dir = dir + '/' + d;
      try {
        await fs.stat(process.cwd() +  dir);
      } catch (e) {
        try {
          await fs.mkdir(process.cwd() + dir);
        } catch (err) {
          err.message = 'Error while creating directory ' + d;
          throw new InvalidFileError(err);
        }
      }
    }
  },

  /**
   * Function that write a file in specific folder
   * if the name of the file already exist we add (i) before the extension
   * i being incremental
   */
  async writeFile(image: any, directory: string): Promise<any> {
    let isNotWrote: boolean = true;
    let imageName = image.originalname;
    const imageData = await this.getFile(image);
    // we loop until the file is writed
    while (isNotWrote) {
      try {
        // We try if the file dont exist
        await fs.stat(process.cwd() + directory + '/' + imageName);
        // The file already exist
        // We check if it already contain the increment (i)
        const res = imageName.match(/(\([0-9]+\))\./);
        if (res) {
          // We increment the (i)
          const incrementString = imageName.slice(res.index, imageName.lastIndexOf('.')); // extract the increment (i)
          const incrementNumber = incrementString.slice(incrementString.indexOf('(') + 1,
            incrementString.indexOf(')')); // extract the number i
          const incrementParsed = parseInt(incrementNumber, 10) + 1; // increment the number i
          imageName = imageName.replace(incrementString,
            '(' + incrementParsed + ')'); // replace increment (i) with (i+1)
        } else {
          // We add the increment (1)
          const extension = imageName.slice(imageName.lastIndexOf('.'), imageName.length);
          imageName = imageName.replace(extension, '(1)' + extension);
        }
      } catch (e) {
        try {
          // if it dont exist we write it
          await fs.writeFile(process.cwd() + directory + '/' + imageName, imageData);
          // we stop looping
          isNotWrote = false;
        } catch (err) {
          err.message = 'error while writing file ' + imageName;
          throw new InvalidFileError(err);
        }
      }
    }
    return Promise.resolve(imageName);
  }
};
