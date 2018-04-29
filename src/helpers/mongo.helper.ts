/**
 * <helpers/mongo.helper>
 * This module is use to abstract the communication with the mongo database
 * It allows us to have a single point for the database communication
 * It will also help to add specifics to some mongoDB actions
 */

import { MongoError } from '../models/errors/MongoError';
import { DB } from './init/mongo-init.helper';
import * as moment from 'moment';


export interface MongoHelperInterface {
  createIndex(collection: string, keys: any, options?: any): Promise<any>;
  indexes(collection: string): Promise<any[]>;
  stats(collection: string, options?: any): Promise<any>;
  insertOne(collection: string, doc: any, options?: any): Promise<any>;
  insertMany(collection: string, docs: any[], options?: any): Promise<any>;
  insertManyRecurrence(collection: string, docs: any[], options?: any): Promise<any>;
  findOneAndUpdate(collection: string, filter?: any, update?: any, options?: any): Promise<any>;
  updateOne(collection: string, filter?: any, update?: any, options?: any): Promise<any>;
  updateMany(collection: string, filter: any, update?: any, options?: any): Promise<any>;
  findOne(collection: string, filter?: any, options?: any): Promise<any>;
  find(collection: string, filter?: any, params?: any): Promise<any>;
  geoNear(collection: string, xValue: number, yValue: number, options?: any): Promise<any>;
  geoHaystackSearch(collection: string, xValue: number, yValue: number, options?: any): Promise<any>;
  bulkWrite(collection: string, operations: any[], options?: any): Promise<any>;
  upsertMany(collection: string, upsertFields: string[], data: any[], setOnInsertOptions?: any,
             bulkOptions?: any, idToDelete?: any[]): Promise<any>;
  count(collection: string, query?: any, options?: any): Promise<number>;
  distinct(collection: string, field: any, query?: any, options?: any): Promise<any[]>;
  aggregate(collection: string, pipeline?: any[], options?: any): Promise<any>;
  deleteOne(collection: string, filter?: any, options?: any): Promise<any>;
  deleteMany(collection: string, filter: any, options?: any): Promise<any>;
  findOneAndDelete(collection: string, filter: any, options?: any): Promise<any>;
  findSubElement(collection: string, subElementName: string, filter: {
    limit?: number,
    offset?: number,
    order?: number,
    sort?: string,
    fields?: string[],
  }): Promise<any[]>;
  findSubElementArray(collection: string, subElementName: string, filter: {}): Promise<any[]>;
}

export class MongoHelper implements MongoHelperInterface {
  ////////////////////////
  // MANAGEMENT ACTIONS
  /**
   * Creating indexes for a collection
   *
   * @param {String} collection name of the collection
   * @param {any} keys any with the rules for the index creation
   * @param {any} options option for the action
   *
   * @return {Promise} result from the action
   */
  async createIndex(collection: string, keys: any, options: any = {}): Promise<any> {
    try {
      return await DB.collection(collection).createIndex(keys, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Return a list of indexes for a collection
   *
   * @param {String} collection name of the collection
   *
   * @return {Promise} list of present indexes
   */
  async indexes(collection: string): Promise<any[]> {
    try {
      return await DB.collection(collection).indexes();
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Return statistic about the collection
   *
   * @param {String} collection name of the collection
   * @param {any} options option for the action
   *
   * @return {Promise} list of present indexes
   */
  async stats(collection: string, options: any = {}): Promise<any> {
    try {
      return await DB.collection(collection).stats(options);
    } catch (error) {
      throw new MongoError(error);
    }
  }


  ////////////////////////
  // INSERTION ACTIONS
  /**
   * Inserting a single document to the database
   *
   * @param {String} collection name of the collection
   * @param {any} doc document to insert in the database
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async insertOne(collection: string, doc: any, options: any = {}): Promise<any> {
    try {
      doc.created_at = moment().toISOString();
      doc.updated_at = doc.created_at;
      return await DB.collection(collection).insertOne(doc, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Inserting multiple documents to the database
   *
   * @param {String} collection name of the collection
   * @param {any} docs array of documents to insert in the database
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async insertMany(collection: string, docs: any[], options: any = {}): Promise<any> {
    try {
      const insertDate = moment().toISOString();
      docs = docs.map(doc => {
        doc.created_at = insertDate;
        doc.updated_at = insertDate;
        return doc;
      });
      return await DB.collection(collection).insertMany(docs, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Inserting task with recurrence link by first occurence _id
   *
   * @param {String} collection name of the collection
   * @param {any} docs array of documents to insert in the database
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async insertManyRecurrence(collection: string, docs: any[], options: any = {}): Promise<any> {
    try {
      const insertDate = moment().toISOString();
      docs = docs.map(doc => {
        doc.created_at = insertDate;
        doc.updated_at = insertDate;
        return doc;
      });
      // Set parent to this for the first occurence
      docs[0].parent = 'this';
      // Insert the first occurence of the recurrent task
      const cursor = await DB.collection(collection).insertOne(docs[0]);
      // remove the first occurence from the list
      docs.shift();
      // map the first occurence _id to the parent attribut of the other occurences
      docs.map(doc => {
        doc.parent = cursor.insertedId;
        return doc;
      });
      // insert all the others occurences
      const statistic =  await DB.collection(collection).insertMany(docs, options);
      statistic.insertedIds.unshift(cursor.insertedId);
      return statistic;
    } catch (error) {
      throw new MongoError(error);
    }
  }


  ////////////////////////
  // UPDATE ACTIONS
  /**
   * Updating a single document from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rules to select the document to update
   * @param {any} update values to update on the document
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async findOneAndUpdate(collection: string,
                         filter: any = {},
                         update: any = {},
                         options: any = {}): Promise<any> {
    try {
      update.updated_at = moment().toISOString();
      return await DB.collection(collection).findOneAndUpdate(filter, update, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Updating a single document from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rules to select the document to update
   * @param {any} update values to update on the document
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async updateOne(collection: string,
                  filter: any = {},
                  update: any = {},
                  options: any = {}): Promise<any> {
    try {
      if (!update.hasOwnProperty('$set')) {
        update.$set = {};
      }
      update.$set.updated_at = moment().toISOString();
      return await DB.collection(collection).updateOne(filter, update, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Updating multiple documents from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rules to select the documents to update
   * @param {any} update values to update on ALL documents
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async updateMany(collection: string, filter: any, update: any = {}, options: any = {}): Promise<any> {
    if (!update.hasOwnProperty('$set')) {
      update.$set = {};
    }
    update.$set.updated_at = moment().toISOString();
    if (!filter || (typeof filter === 'object' && Object.keys(filter).length === 0)) {
      // Security to prevent updating all the documents (aka empty filter)
      const error = new Error('Can\'t update documents without filter');
      throw new MongoError(error);
    } else {
      try {
        return await DB.collection(collection).updateMany(filter, update, options);
      } catch (error) {
        throw new MongoError(error);
      }
    }
  }


  ////////////////////////
  // FIND ACTIONS
  /**
   * Find a single document based on rules
   *
   * @param {String} collection name of the collection
   * @param {any} filter rules to select the document
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async findOne(collection: string, filter: any = {}, options: any = {}): Promise<any> {
    if (!filter.hasOwnProperty('deleted_at')) {
      filter.deleted_at = {
        $exists: false
      };
    }
    try {
      return await DB.collection(collection).findOne(filter, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Find multiple documents based on rules
   *
   * @param {String} collection name of the collection
   * @param {any} filter rules to select the document
   *
   * @return {Cursor} for success, we return a mongoDB cursor where we can do action on
   */
  async find(collection: string, filter: any = {}, params: any = {}): Promise<any> {
    // If the search is succeffull we return a mongoDB cursor
    // It is with this cursor that we ill be able to :
    // skip, limit, max,  ..
    // or return the data
    if (!filter.hasOwnProperty('deleted_at')) {
      filter.deleted_at = {
        $exists: false
      };
    }
    try {
      const skipValue = params.offset ? params.offset : 0;
      let limitValue ;
      if (params.limit === 0) {
        limitValue = 0;
      }else {
        limitValue = params.limit ? params.limit : 50;
      }
      const fields = {};
      const sortValue: any = {};
      if (params.sort) {
        sortValue[params.sort] = params.order || 1;
      }
      /* if (params.fields) {
        params.fields.map(f => (fields[f] = 1));
        if (!fields.hasOwnProperty('_id')) {
          fields['_id'] = false;
        }
      }
      if (!fields.hasOwnProperty('_id')) {
        fields['_id'] = false;
      } */
      return await DB.collection(collection).find(filter)
        .sort(sortValue)
        .skip(skipValue)
        .limit(limitValue)
        .project(fields);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Find documents based on their geographic position
   *
   * @param {String} collection name of the collection
   * @param {Number} xValue Point to search on the x axis,
   * @param {Number} yValue Point to search on the y axis,
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async geoNear(collection: string, xValue: number, yValue: number, options: any = {}): Promise<any> {
    if (!xValue || !yValue || typeof xValue !== 'number' || typeof yValue !== 'number') {
      // We can't search if the geo data are null
      const error = new Error('No value to search geographically');
      throw new MongoError(error);
    } else {
      try {
        return await DB.collection(collection).geoNear(xValue, yValue, options);
      } catch (error) {
        throw new MongoError(error);
      }
    }
  }

  /**
   * Find documents based on their geographic position
   *
   * @param {String} collection name of the collection
   * @param {Number} xValue Point to search on the x axis,
   * @param {Number} yValue Point to search on the y axis,
   * @param {any} options options for the action
   *
   * @return {Promise} result from the action
   */
  async geoHaystackSearch(collection: string,
                          xValue: number,
                          yValue: number,
                          options: any = {}): Promise<any> {
    if (!xValue || !yValue || typeof xValue !== 'number' || typeof yValue !== 'number') {
      // We can't search if the geo data are null
      const error = new Error('No value to search geographically');
      throw new MongoError(error);
    } else {
      try {
        return await DB.collection(collection).geoHaystackSearch(xValue, yValue, options);
      } catch (error) {
        throw new MongoError(error);
      }
    }
  }


  ////////////////////////
  // BULK ACTIONS
  /**
   * Do bulk action to the database
   * The value passed should be an array of action, with there parameters
   *
   * @param {String} collection name of the collection
   * @param {any} operations Array of operation to do on the collection
   * @param {any} options options for the action
   *
   * @return {Promise} Result from the bulk action
   */
  async bulkWrite(collection: string, operations: any[], options: any = {}): Promise<any> {
    try {
      return DB.collection(collection).bulkWrite(operations, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * upsertMany, is looping throught the data,
   * and building an updateOne request for each of them (and put it in an array)
   * After that, we call "bulkAction" to create it in the database
   *
   * @param {String} collection name of the collection
   * @param {any} upsertFields ield to single out for the upsert
   * @param {any} data List of data to upsert
   * @param {any} setOnInsertOptions field to set if we do a creation instead of update
   * @param {any} bulkOptions options for the bulkWrite action
   *
   * @param idToDelete
   * @return {Promise} Result from the bulk action
   */
  async upsertMany(collection: string,
                   upsertFields: string[],
                   data: any[],
                   setOnInsertOptions: any = {},
                   bulkOptions: any = {},
                   idToDelete: any[] = []): Promise<any> {
    const calledDate = moment().toISOString(); // Just to have 'created_at' and 'updated_at' exactly equal
    setOnInsertOptions.created_at = calledDate;
    if (!upsertFields || !Array.isArray(upsertFields) || upsertFields.length === 0) {
      // We can't make an upsert, if we don't have specific field to filter by
      const error = new Error('No upsertFields to search particular data');
      throw new MongoError(error);
    } else {
      const buildRequest: any = [];
      // looping throutgh the data
      for (const row of data) {
        const filterany: any = {};
        let updateany: any = {};

        // looping throught the upsertField
        for (const field of upsertFields) {
          // If the field is not found on ANY data, we trow an error
          if (field === '' || !row[field]) {
            const customError = new Error('Upsert field missing on data object');
            throw new MongoError(customError);
          }
          filterany[field] = row[field];
        }

        row.updated_at = calledDate;

        updateany = {
          $set: row,
          $setOnInsert: setOnInsertOptions
        };

        buildRequest.push({
          updateOne: {
            filter: filterany,
            update: updateany,
            upsert: true
          }
        });
      }
      if (idToDelete.length > 0) {
        for (const deleteId of idToDelete) {
          buildRequest.push({
            updateOne: {
              filter: {id: deleteId},
              update: {
                $set : {
                  deleted_at : moment().toISOString()
                }
              }
            }
          });
        }
      }

      try {
        return await this.bulkWrite(collection, buildRequest, bulkOptions);
      } catch (error) {
        throw new MongoError(error);
      }
    }
  }


  ////////////////////////
  // DIVERSE ACTIONS
  /**
   * Count the number of matching documents
   *
   * @param {String} collection name of the collection
   * @param {any} query rules that will match the documents
   * @param {any} options options for the action
   *
   * @return {Promise} number of documents matching the query
   */
  async count(collection: string, query: any = {}, options: any = {}): Promise<number> {
    if (!query.hasOwnProperty('deleted_at')) {
      query.deleted_at = {
        $exists: false
      };
    }
    try {
      return await DB.collection(collection)
        .count(query, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Return the distinct value of a specific field
   *
   * @param {String} collection name of the collection
   * @param {String} field field to get the distinct value from
   * @param {any} query rules that will match the documents
   * @param {any} options options for the action
   *
   * @return {Promise} Array of distinct value
   */
  async distinct(collection: string, field: any, query: any = {}, options: any = {}): Promise<any[]> {
    if (!query.hasOwnProperty('deleted_at')) {
      query.deleted_at = {
        $exists: false
      };
    }
    if (!field || field === '' || typeof field !== 'string') {
      // We can't return distinct value if we don't have the field
      const error = new Error('No field to return distinct values');
      throw new MongoError(error);
    } else {
      try {
        return await DB.collection(collection)
          .distinct(field, query, options);
      } catch (error) {
        throw new MongoError(error);
      }
    }
  }

  /**
   * Return an aggragation of the data from the database
   *
   * @param {String} collection name of the collection
   * @param {any} pipeline rules for the pipeline of the aggragation
   * @param {any} options options for the action
   *
   * @return {Cursor} for success, we return a mongoDB aggregator cursor where we can do action on
   */
  async aggregate(collection: string, pipeline: any[] = [], options: any = {}): Promise<any> {
    // If the aggraegation is succeffull we return a mongoDB cursor
    // It is with this cursor that we will be able to :
    // skip, limit, max,  ..
    // or return the data
    return await DB.collection(collection).aggregate(pipeline, options);
  }


  ////////////////////////
  // DELETION ACTIONS
  /**
   * Calling mongodb to remove one document from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rule for selecting the document to remove
   * @param {any} options options for the action
   * @param silent If set to true, will only set "deleted_at", else it will delete the document
   *
   * @return {Promise} result from the action
   */
  async deleteOne(collection: string, filter: any = {}, options: any = {}, silent: boolean = true): Promise<any> {
    try {
      if (silent) {
        return await DB.collection(collection)
          .updateOne(filter, {$set : {deleted_at: moment().toISOString()}}, options);
      } else {
        return await DB.collection(collection).deleteOne(filter, options);
      }
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Calling mongodb to remove multiple documents from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rule that will delete all document matching it
   * @param {any} options options for the action
   * @param silent If set to true, will only set "deleted_at", else it will delete the document
   * @return {Promise} result from the action
   */
  async deleteMany(collection: string, filter: any, options: any = {}, silent: boolean = true): Promise<any> {
    try {
      if (silent) {
        return await DB.collection(collection).updateMany(filter, {
          $set: {
            deleted_at: moment().toISOString()
          }
        }, options);
      } else {
        return await DB.collection(collection).deleteMany(filter, options);
      }
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * Calling mongodb to find and remove one document from the database
   *
   * @param {String} collection name of the collection
   * @param {any} filter rule that will delete all document matching it
   * @param {any} options option for the action
   *
   * @return {Promise} result from the action
   */
  async findOneAndDelete(collection: string, filter: any, options: any = {}): Promise<any> {
    try {
      return await DB.collection(collection)
        .findOneAndUpdate(filter, {deleted_at: moment().toISOString()}, options);
    } catch (error) {
      throw new MongoError(error);
    }
  }

  /**
   * This helper does a query on a document list's sub-documents. For example, in the user
   * collection, each user has its 'team' sub-document. This helper will help to fetch all
   * of the teams, by grouping them and doing queries on them.
   * @param {string} collection
   * @param {string} subElementName
   * @param filter
   * @return {Promise<any[]>}
   */
  async findSubElement(collection: string, subElementName: string, filter: {
    limit?: number,
    offset?: number,
    order?: number,
    sort?: string,
    fields?: string[],
  }): Promise<any[]> {
    try {
      let fields: any = {};
      // If the user specified fields, build the 'fields' object in a Mongo way
      if (filter.fields && filter.fields.length > 0) {
        filter.fields.forEach(field => {
          fields['_id.' + field] = 1;
        });
      } else {

        // If the user didn't specify any field, use a default value
        fields = {_id: 1};
      }

      const agg = await this.aggregate(
        collection,
        [
          // First, group by the sub element (which will be stored in the "_id" key)
          {
            $group: {
              _id: '$' + subElementName,
              created_at: {
                $max: '$created_at'
              }
            }
          },
          // Then, filter by the fields
          {
            $project: fields
          },
          // Then, sort by the specified column and order
          {
            $sort: {
              [filter.sort ? '_id.' + filter.sort : '_id.created_at'] : filter.order || 1
            }
          },
          // Then, use the offset
          {
            $skip: filter.offset || 0
          },
          // And the limit
          {
            $limit: filter.limit || 20
          }
        ]
      );
      const result = await agg.toArray();
      // As every sub-element is stored in the '_id' key, remove it before the return

      return result.map(elmt => elmt._id).filter(a => a);
    } catch (error) {
      throw new MongoError(error);
    }
  }

   /**
   * This helper does a query on a document list's sub-documents. For example, in the user
   * collection, each user has its 'team' sub-document. This helper will help to fetch all
   * of the teams, by grouping them and doing queries on them.
   * @param {string} collection
   * @param {string} subElementName
   * @param filter
   * @return {Promise<any[]>}
   */
  async findSubElementArray(collection: string, subElementName: string, filter: {
    offset?: number,
    limit?: number,
    order?: number,
    sort?: string,
    fields?: string[],
  }): Promise<any[]> {
    try {
      const aggregatePipeline: any = [];
      const subElementArray = subElementName.split('.');
      let incrementalSubName = '';

      // handle a multiple level sub-document like lane subDoc of location subDoc of sector.
      // unwind will return one document per subDocument
      // ex: {$unwind: '$locations'},{$unwind: '$locations.toll_lanes'}
      subElementArray.forEach(subName => {
        aggregatePipeline.push(
          {
            $unwind: '$' + incrementalSubName + '' + subName
          }
        );
        incrementalSubName += subName + '.';
      });

      if (filter.sort) {
        filter.sort = subElementName + '.' + filter.sort;
      }

      // then we can apply filter on these documents
      aggregatePipeline.push(
        {
          $sort: {
            [filter.sort ? filter.sort : subElementName + '.created_at']: filter.order || 1
          }
        },
        // Then, use the offset
        {
          $skip: filter.offset || 0
        },
        // And the limit
        {
          $limit: filter.limit || 20
        }
      );


      const fields: any = {};
      // If the user specified fields, build the 'fields' object in a Mongo way
      if (filter.fields && filter.fields.length > 0) {
        filter.fields.forEach(field => {
          fields[field] = '$' + subElementName + '.' + field;
        });
      } else {
        // If the user didn't specify any field, use a default value
        fields[subElementName] = 1;
      }
      fields['_id'] = false;

      // finally we "project" only the fields of our wanted subDocuments.
      aggregatePipeline.push({
        $project: fields
      });


      const agg = await this.aggregate(
        collection,
        aggregatePipeline
      );
      const result = await agg.toArray();

      return result.filter(a => a);
    } catch (error) {
      throw error;
    }
  }
}
