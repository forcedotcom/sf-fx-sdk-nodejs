import { DataApi } from "./data-api";
import { User } from "./user";

export class Org {
  readonly id;
  readonly baseUrl;
  readonly domainUrl;
  readonly apiVersion;
  readonly dataApi;
  readonly user;

  constructor({apiVersion}, {accessToken}, {orgId, salesforceBaseUrl, orgDomainUrl, userId, username, onBehalfOfUserId}) {
    this.id = orgId;
    this.baseUrl = salesforceBaseUrl;
    this.domainUrl = orgDomainUrl;
    this.apiVersion = apiVersion;

    this.dataApi = new DataApi(this.baseUrl, this.apiVersion, accessToken);
    this.user = new User(userId, username, onBehalfOfUserId);
  }
}
