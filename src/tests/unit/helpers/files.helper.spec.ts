import { expect } from 'chai';
import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import * as rewire from 'rewire';
import * as sinon from 'sinon';
import { config } from '../../../config';
import * as path from 'path' ;

const filesHelper = rewire('../../../helpers/files.helper');

const filesHelperFunctions = filesHelper.filesHelper;

describe('files service', function (): void {
  describe('#getFile', function (): void {
    it('should reject if there is no file information', async function (): Promise<void> {
      try {
        await filesHelperFunctions.getFile(null);
      } catch (error) {
        expect(error.errorCode).to.equal(40001);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No file information');
      }
    });

    it('should read the file', async function (): Promise<void> {
      const readFile = promisify(fs.readFile);
      const fileInfos = await readFile(path.join(process.cwd(), '/src/tests/test_assets/text_test_file.txt'));
      const file = await filesHelperFunctions.getFile({
        buffer: fileInfos
      });
      expect(
        /This is a test file\./.test(file.toString())
      ).to.equal(true);
      expect(true).to.equal(true);
    });

  });

  /* describe('#parseCsv', function (): void {
    it('should reject if there is a problem parsing csv', async function (): Promise<void> {
      try {
        await filesHelperFunctions.parseCsv({message: 'not correct csvfile'});
      } catch (error) {
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Erreur lors du traitement du fichier');
      }
    });

    it('should return the file formated into an array of objects', async function (): Promise<void> {
      const readFile = promisify(fs.readFile);
      const fileInfos = await readFile(process.cwd() + '/test_assets/Sectors/sectors_create_fixture.csv');
      const file = await filesHelperFunctions.getFile({
        buffer: fileInfos,
      });
      const parsedCsv = await filesHelperFunctions.parseCsv(file);
      expect(parsedCsv).to.deep.equal([
        {id: '1', name: 'secteur1', team_id: '1'},
        {id: '2', name: 'secteur2', team_id: '2'},
      ]);
    });

  });

  describe('#checkCsvFormat', function (): void {
    it('should return false if there is no data', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat();
      expect(result).to.equal(false);
      done();
    });

    it('should return false if data is not an array', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat('not an aray');
      expect(result).to.equal(false);
      done();
    });

    it('should return false if there is no data', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat([]);
      expect(result).to.equal(false);
      done();
    });

    it('should return true if there is no neededValues rules', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat(
        [{foo: 'bar'}],
      );
      expect(result).to.equal(true);
      done();
    });

    it('should return false if a key is not present from the rules', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat(
        [{foo: 'bar'}],
        ['foo', 'other'],
      );
      expect(result).to.equal(false);
      done();
    });

    it('should return true if the schema is correct', function (done: any): void {
      const result = filesHelperFunctions.checkCsvFormat(
        [{
          foo: 'bar',
          other: 5,
        }],
        ['foo', 'other'],
      );
      expect(result).to.equal(true);
      done();
    });

  }); */

  describe('#checkExtension', function (): void {
    it('should return an error if there is no data', function (done: any): void {
      try {
        filesHelperFunctions.checkExtension();
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Invalid file infos');
        done();
      }
    });

    it('should return an error if data is not an array', function (done: any): void {
      try {
        filesHelperFunctions.checkExtension('Not a file', 'not an array');
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Invalid file infos');
        done();
      }
    });

    it('should return an error if a file type is invalid', function (done: any): void {
      try {
        filesHelperFunctions.checkExtension({originalname: 'not_a_csv.txt.pdf'}, ['csv', 'txt']);
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Invalid file type. ' +
          'It (pdf) should match these types : csv, txt');
        done();
      }
    });

    it('should return an error if there is no file type', function (done: any): void {
      try {
        filesHelperFunctions.checkExtension({originalname: 'not_a_csv.txt.pdf'}, []);
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Invalid file infos');
        done();
      }
    });

    it('should return an error if the file is invalid', function (done: any): void {
      try {
        filesHelperFunctions.checkExtension(
          [{notTheOriginalName: 'bar'}],
          ['foo', 'other']
        );
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40003);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Invalid file infos');
        done();
      }
    });

    it('should return void if the validation is valid', function (done: any): void {
      try {
        const result = filesHelperFunctions.checkExtension(
          {
            originalname: 'something.csv'
          },
          ['csv', 'txt', 'pdf']
        );
        expect(result).to.equal(undefined);
        done();
      } catch (error) {
        expect(false).to.equal(true);
      }
    });

  });

  describe('#mkdirp', function (): void {
    it('should create dir recursivly', async function (): Promise<void> {
      const spyStatPath = sinon.spy();
      const spyMkdirPath = sinon.spy();
      const revertFS = filesHelper.__set__('fs', {
        async stat(aPath: string): Promise<void> {
          spyStatPath(aPath);
          throw new Error();
        },
        async mkdir(aPath: string): Promise<void> {
          spyMkdirPath(aPath);
        }
      });
      await filesHelperFunctions.mkdirp(path.join(config.application.img.dir, '/tasks/12345678912345678900123')) ;
      expect(spyStatPath.getCall(0).args[0]).to.equal(process.cwd() + config.application.img.dir);
      expect(spyStatPath.getCall(1).args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/tasks'));
      expect(spyStatPath.getCall(2).args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/tasks/12345678912345678900123'));
      expect(spyMkdirPath.getCall(0).args[0]).to.equal(process.cwd() + config.application.img.dir);
      expect(spyMkdirPath.getCall(1).args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/tasks'));
      expect(spyMkdirPath.getCall(2).args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/tasks/12345678912345678900123'));
      await revertFS();
    });
  });

  describe('#writeFile', function (): void {
    it('should create file if it doesn\'t exist', async function (): Promise<void> {
      const spyStatPath = sinon.spy();
      const spyWriteFilePath = sinon.spy();
      const spyData = sinon.spy();
      const revertFS = filesHelper.__set__('fs', {
        async stat(aPath: string): Promise<void> {
          spyStatPath(aPath);
          throw new Error();
        },
        async writeFile(aPath: string, data: any): Promise<void> {
          spyWriteFilePath(aPath);
          spyData(data);
        }
      });
      await filesHelperFunctions.writeFile({buffer: [80, 90], originalname: 'testfile.txt'}, path.join(config.application.img.dir, '/path/to/img'));
      expect(spyStatPath.firstCall.args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile.txt'));
      expect(spyWriteFilePath.firstCall.args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile.txt')) ;
      expect(spyData.firstCall.args[0]).to.deep.equal([80, 90]);
      await revertFS();
    });

    it('should create file(1) if it already exist', async function (): Promise<void> {
      const spyStatPath = sinon.spy();
      const spyWriteFilePath = sinon.spy();
      const spyData = sinon.spy();
      const revertFS = filesHelper.__set__('fs', {
        async stat(aPath: string): Promise<void> {
          spyStatPath(aPath);
          if (aPath !== process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile.txt')) {
            throw new Error();
          }
        },
        async writeFile(aPpath: string, data: any): Promise<void> {
          spyWriteFilePath(aPpath);
          spyData(data);
        }
      });
      await filesHelperFunctions.writeFile({buffer: [80, 90], originalname: 'testfile.txt'},
        config.application.img.dir + '/path/to/img');
      expect(spyStatPath.firstCall.args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile.txt')) ;
      expect(spyStatPath.getCall(1).args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile(1).txt')) ;
      expect(spyWriteFilePath.firstCall.args[0]).to.equal(process.cwd() + path.join(config.application.img.dir, '/path/to/img/testfile(1).txt')) ;
      expect(spyData.firstCall.args[0]).to.deep.equal([80, 90]);
      await revertFS();
    });
  });

});
