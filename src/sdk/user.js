export class User {
  readonly id;
  readonly username;
  readonly onBehalfOfUserId;

  constructor(id, username, onBehalfOfUserId) {
    this.id = id;
    this.username = username;
    this.onBehalfOfUserId = onBehalfOfUserId;
  }
}
