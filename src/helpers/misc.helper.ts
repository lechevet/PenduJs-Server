export const miscHelper = {

  getArrayDuplicates(array: any[]): any {
    // First, remove any duplicates
    const flattenedArray = Array.from(new Set(array));
    if (!flattenedArray || !array || flattenedArray.length === array.length) {
      // And return no error if there is no duplicate
      return false;
    }

    // Then, build the array containing every duplicate by checking the difference between the first & last occurence
    const duplicates = array
      .filter(name => (array.indexOf(name) !== array.lastIndexOf(name))).sort();

    // In the end, return a string array containing every duplicate with its occurence count
    return Array.from(new Set(duplicates
      .map(item => (item + ' (' + (duplicates.lastIndexOf(item) - duplicates.indexOf(item) + 1) + ' times)'))));
  },

  // Function that check if an object has a nested property (Like 'node1.node2.node3.property')
  hasOwnSubProperty(obj: any, key: string): boolean {
    if (!key || !obj) {
      return false;
    }
    if (key.split('.').length === 1) {
      return obj.hasOwnProperty(key);
    }
    return miscHelper.hasOwnSubProperty(obj[key.split('.')[0]], key.split('.').slice(1).join('.'));
  }
};
