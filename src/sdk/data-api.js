import {
  Connection,
  AuthInfo
} from '@salesforce/core';
// import { ReferenceId } from "./types/reference-id";
import {
  RecordCreate,
  RecordModification,
  RecordDelete,
  RecordResult,
  RecordCreateResult,
  RecordQueryResult,
  RecordModificationResult,
  RecordDeleteResult
} from "./records";

export class DataApi {
  private baseUrl;
  private apiVersion;
  readonly accessToken;
  private conn;

  constructor(baseUrl, apiVersion, accessToken) {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.accessToken = accessToken;
  }

  private async connect() {
    if (!this.conn) {
      const authInfo = await AuthInfo.create({ this.accessToken });
      this.conn = await Connection.create({ authInfo });
    }

    return this.conn;
  }

  private async promisifyRequests(callback) {
    let conn = new Connection();
    let result = new RecordResult();

    try {
      conn = await this.connect();
      result = callback(conn);
    } catch(e) {
      Promise.reject(e);
    }

    return Promise.resolve(result);
  }

  /**
   * Creates a record, based on the given {@link RecordCreate}.
   * @param recordCreate.
   */
  async create(recordInsert) {
    return this.promisifyRequests(async (conn) => {
      // TODO: shape response to return id
      const response: any = await conn.insert(recordInsert.type, recordInsert);
      const result = new RecordCreateResult(response.id);

      return result;
    });
  }

  /**
   * Queries for records with a given SOQL string.
   * @param soql The SOQL string.
   */
  async query(soql) {
    return this.promisifyRequests(async (conn) => {
      const response = await conn.autoFetchQuery(soql);
      const recordQueryResult = new RecordQueryResult(response.done, response.totalSize, response.nextRecordsUrl, response.records);

      return recordQueryResult;
    });
  }

  /**
   * Queries for more records, based on the given {@link RecordQueryResult}.
   * @param queryResult
   */
  async queryMore(queryResult) {
    return this.promisifyRequests(async (conn) => {
      const response = await conn.autoFetchQuery(queryResult.nextRecordsUrl);
      const recordQueryResult = new RecordQueryResult(response.done, response.totalSize, response.nextRecordsUrl, response.records);

      return recordQueryResult;
    });
  }

  /**
   * Updates an existing record described by the given {@link RecordUpdate}.
   * @param recordUpdate The record update description.
   */
  async update(recordUpdate) {
    return this.promisifyRequests(async (conn) => {
      const response: any = await conn.update(recordUpdate.type, recordUpdate);
      const result = new RecordModificationResult(response.id);

      return result;
    });
  }

  /**
  * Deletes a record, based on the given {@link RecordDelete}.
  * @param recordDelete
  */
  async delete(recordDelete) {
    return this.promisifyRequests(async (conn) => {
      const response: any = await conn.delete(recordDelete.type, recordDelete.id);
      const result = new RecordDeleteResult(response.id);

      return result;
    });
  }

  /**
   * Creates a new and empty {@link UnitOfWork}.
   */
  // newUnitOfWork(): UnitOfWork {
  //   throw "Not yet implemented!";
  // }

  /**
   * Commits a {@link UnitOfWork}, executing all operations registered with it. If any of these
   * operations fail, the whole unit is rolled back. To examine results for a single operation,
   * inspect the returned map (which is keyed with {@link ReferenceId} returned from
   * {@link UnitOfWork#insert} and {@link UnitOfWork#update}).
   * @param unitOfWork The {@link UnitOfWork} to commit.
   */
  // commitUnitOfWork(
  //   unitOfWork: UnitOfWork
  // ): Promise<Map<ReferenceId, RecordModificationResult>> {
  //   return Promise.reject("Not yet implemented!");
  // }
}
