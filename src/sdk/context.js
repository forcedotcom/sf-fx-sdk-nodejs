import { Org } from "./org";

export class Context {
  readonly id;
  readonly org;

  constructor({id}, contextExt, functionContextExt) {
    this.id = id;
    this.org = this.createOrg(contextExt, functionContextExt);
  }

  private createOrg(contextExt, functionContextExt){
    return new Org(contextExt, functionContextExt, contextExt.userContext);
  }
}
