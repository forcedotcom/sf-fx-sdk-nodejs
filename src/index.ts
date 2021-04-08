/**
 * An InvocationEvent is representative of the data associated with the occurrence of an event,
 * and supporting metadata about the source of that occurrence.
 *
 * @interface InvocationEvent
 * @property id The platform event occurrence id for event invocation.
 * @property type A value describing the type of invocation. The format of this is producer defined
 * and might include information such as the version of the type.
 * @property source An URI which Identifies the context in which an event happened. Often this will
 * include information such as the type of the event source, the organization publishing the event
 * or the process that produced the event.
 * @property data The payload of the event
 * @property dataContentType The media type of the event payload that is accessible in data
 * @property dataSchema The schema that the event payload adheres to.
 * @property time The timestamp of when the occurrence happened. If the time of the occurrence
 * cannot be determined then this attribute may be set to some other time
 * (such as the current time), however all producers for the same source must be consistent in this
 * respect. In other words, either they all use the actual time of the occurrence or they all use
 * the same algorithm to determine the value used.
 */
interface InvocationEvent<T> {
  readonly id: string,
  readonly type: string,
  readonly source: string,
  readonly data: T,
  readonly dataContentType?: string,
  readonly dataSchema?: string,
  readonly time?: Date
}

/**
 * Represents the connection to the the execution environment and the Customer 360 instance that
 * the function is associated with.
 */
interface Context {
  readonly id: string,
  readonly org?: Org
}

/**
 * Holds information about the invoking Salesforce organization and user in Customer 360.
 *
 * @property id The Salesforce organization ID.
 * @property baseUrl The base URL of the Salesforce organization.
 * @property domainUrl The domain URL of the Salesforce organization.
 * @property apiVersion The API version the Salesforce organization is currently using.
 * @property dataApi
 * @property user
 */
interface Org {
  readonly id: string,
  readonly baseUrl: string,
  readonly domainUrl: string,
  readonly apiVersion: string,
  readonly dataApi: DataApi,
  readonly user: User
}

/**
 * Holds information about the invoking Salesforce user in Customer 360.
 *
 * @interface User
 * @property id The user's ID.
 * @property username The name of the user.
 * @property onBehalfOfUserId
 */
interface User {
  readonly id: string,
  readonly username: string,
  readonly onBehalfOfUserId?: string
}

type ReferenceId = string;

/**
 * @interface DataApi
 * @property accessToken The access token used by this API client. Can be used to initialize a
 * third-party API client or to perform custom API calls with a HTTP library.
 */
interface DataApi {
  readonly accessToken: string,

  /**
   * Queries for records with a given SOQL string.
   * @param soql The SOQL string.
   */
  query(soql: string): Promise<RecordQueryResult>,

  /**
   * Queries for more records, based on the given {@link RecordQueryResult}.
   * @param queryResult
   */
  queryMore(queryResult: RecordQueryResult): Promise<RecordQueryResult>

  /**
   * Inserts a new record described by the given {@link RecordInsert}.
   * @param recordInsert The record insert description.
   */
  insert(recordInsert: RecordInsert): Promise<RecordModificationResult>

  /**
   * Updates an existing record described by the given {@link RecordUpdate}.
   * @param recordUpdate The record update description.
   */
  update(recordUpdate: RecordUpdate): Promise<RecordModificationResult>

  /**
   * Creates a new and empty {@link UnitOfWork}.
   */
  newUnitOfWork(): UnitOfWork

  /**
   * Commits a {@link UnitOfWork}, executing all operations registered with it. If any of these
   * operations fail, the whole unit is rolled back. To examine results for a single operation,
   * inspect the returned map (which is keyed with {@link ReferenceId} returned from
   * {@link UnitOfWork#insert} and {@link UnitOfWork#update}).
   * @param unitOfWork The {@link UnitOfWork} to commit.
   */
  commitUnitOfWork(unitOfWork: UnitOfWork): Promise<Map<ReferenceId, RecordModificationResult>>
}

/**
 * @interface UnitOfWork
 */
interface UnitOfWork {
  /**
   * Registers a record insert with this UnitOfWork.
   * @param recordInsert
   */
  insert(recordInsert: RecordInsert): ReferenceId

  /**
   * Registers a record update with this UnitOfWork.
   * @param recordUpdate
   */
  update(recordUpdate: RecordUpdate): ReferenceId
}

interface SalesforceRecord {
  type: string,
  [key: string]: string | number | boolean | Date
}

interface RecordInsert {
  type: string,
  [key: string]: string | number | boolean | Date | ReferenceId
}

interface RecordUpdate extends RecordInsert {
  id: string,
}

interface RecordQueryResult {
  readonly done: boolean,
  readonly totalSize: number,
  readonly records: [SalesforceRecord]
}

interface RecordModificationResult {
  readonly id: string
}
