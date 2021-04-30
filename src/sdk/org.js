export class Org {
  constructor({ apiVersion }, { orgId, salesforceBaseUrl, orgDomainUrl }) {
    this.id = orgId;
    this.baseUrl = salesforceBaseUrl;
    this.domainUrl = orgDomainUrl;
    this.apiVersion = apiVersion;
    this.dataApi = new Object();
    this.user = new Object();
  }
}
