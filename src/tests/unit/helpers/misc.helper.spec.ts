import { expect } from 'chai';
import * as rewire from 'rewire';

const miscHelper = rewire( '../../../helpers/misc.helper');

const miscHelperFunctions = miscHelper.miscHelper;

describe('misc service', function(): void {
  describe('#hasOwnSubProperty', function(): void {
    it('should return false if the key isn\'t set', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({foo: 'bar'});
      expect(result).to.equal(false);
    });

    it('should return false if the key is an empty string', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({foo: 'bar'}, '');
      expect(result).to.equal(false);
    });

    it('should return false if the object is a string', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty('That\'s a string!', 'T');
      expect(result).to.equal(false);
    });

    it('should return false if the key is a \'.val\'', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({bar: 'foo'}, '.bar');
      expect(result).to.equal(false);
    });

    it('should return false if the key is a \'val.\'', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({bar: 'foo'}, 'bar.');
      expect(result).to.equal(false);
    });

    it('should return true if the key is at the object root', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({bar: 'foo'}, 'bar');
      expect(result).to.equal(true);
    });

    it('should return false if the key is not at the object root', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({
        that: {
          is: {
            a: {
              long: {
                object: {
                  definition: {
                    with: {
                      a: {
                        lot: {
                          of: 'items'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }, 'of');
      expect(result).to.equal(false);
    });

    it('should return true if the key describes the complete path', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({
        that: {
          is: {
            a: {
              long: {
                object: {
                  definition: {
                    with: {
                      a: {
                        lot: {
                          of: 'items'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }, 'that.is.a.long.object.definition.with.a.lot.of');
      expect(result).to.equal(true);
    });

    it('should return false if the key contains two dots one next to another', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({
        that: {
          is: {
            an: 'object'
          }
        }
      }, '..');
      expect(result).to.equal(false);
    });

    it('should return false if the key is null', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({
        null: true
      }, null);
      expect(result).to.equal(false);
    });

    it('should return true if the key exist but isn\'t a "tree leaf"', async function (): Promise<void> {
      const result = miscHelperFunctions.hasOwnSubProperty({
        that: {
          is: {
            a: {
              long: {
                object: {
                  definition: {
                    with: {
                      a: {
                        lot: {
                          of: 'items'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }, 'that.is.a.long.object');
      expect(result).to.equal(true);
    });
  });

  describe('#getArrayDuplicates', function(): void {
    it('should return false if nothing is sent', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates();
      expect(result).to.equal(false);
    });

    it('should return false if the array is empty', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates([]);
      expect(result).to.equal(false);
    });

    it('should return a string array representing the duplications', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates([1, 1, 1]);
      expect(result).to.deep.equal([
        '1 (3 times)'
      ]);
    });

    it('should handle multiple duplications', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates([1, 1, 1, 2, 2, 2, 2]);
      expect(result).to.deep.equal([
        '1 (3 times)',
        '2 (4 times)'
      ]);
    });

    it('should ignore types', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates([1, 1, 1, 2, 2, 2, 2, 3, '3']);
      expect(result).to.deep.equal([
        '1 (3 times)',
        '2 (4 times)'
      ]);
    });

    it('should ignore number/boolean type confusion', async function (): Promise<void> {
      const result = miscHelperFunctions.getArrayDuplicates([1, 0, true, false]);
      expect(result).to.equal(false);
    });

    it('should handle scrambled data', async function (): Promise<void> {
      // Sample scrambled array
      const scrambledArray = [1, 5, 8, 3, 4, 9, 2, 7, 4, 1, 5, 6, 8, 1, 8, 7, 1, 0, 5, 8];

      // Avoid recalculating the length at each iteration
      const arrayLength = scrambledArray.length;

      // This test will take the scrambled array, and loop through every possibility
      // The first time, it will be equal to "1, 5, 8, ..., 5, 8",
      // the next time "8, 1, 5, 8, ..., 0, 5", then "5, 8, 1, 5, 8, ..., 1, 0"
      for (let i = 0; i < arrayLength; i++) {

        // Take the last element of the array, remove it, and add it at its beginning
        scrambledArray.unshift(scrambledArray.pop() || 0);
        const result = miscHelperFunctions.getArrayDuplicates(scrambledArray);

        // And expect every iteration to return the same thing
        expect(result).to.deep.equal([
          '1 (4 times)',
          '4 (2 times)',
          '5 (3 times)',
          '7 (2 times)',
          '8 (4 times)'
        ]);
      }
    });

  });
});
