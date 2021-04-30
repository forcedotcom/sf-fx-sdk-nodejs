export class DataApi {
  constructor(baseUrl, apiVersion, accessToken) {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.accessToken = accessToken;
  }

  /**
   * Creates a record, based on the given {@link RecordCreate}.
   * @param recordCreate.
   */
  async create() {
    return Promise.resolve(new Object());
  }

  /**
   * Queries for records with a given SOQL string.
   * @param soql The SOQL string.
   */
  async query(soql) {
    return Promise.resolve([]);
  }

  /**
   * Queries for more records, based on the given {@link RecordQueryResult}.
   * @param queryResult
   */
  async queryMore(queryResult) {
    return Promise.resolve([]);
  }

  /**
   * Updates an existing record described by the given {@link RecordUpdate}.
   * @param recordUpdate The record update description.
   */
  async update(recordUpdate) {
    return Promise.resolve(new Object());
  }

  /**
  * Deletes a record, based on the given {@link RecordDelete}.
  * @param recordDelete
  */
  async delete(recordDelete) {
    return Promise.resolve(new Object());
  }

  /**
   * Commits a {@link UnitOfWork}, executing all operations registered with it. If any of these
   * operations fail, the whole unit is rolled back. To examine results for a single operation,
   * inspect the returned map (which is keyed with {@link ReferenceId} returned from
   * {@link UnitOfWork#insert} and {@link UnitOfWork#update}).
   * @param unitOfWork The {@link UnitOfWork} to commit.
   */
  commitUnitOfWork(unitOfWork) {
    return Promise.resolve(new Object());
  }
}
