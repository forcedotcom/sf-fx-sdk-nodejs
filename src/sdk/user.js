export class User {
  constructor(id, username, onBehalfOfUserId) {
    this.id = id;
    this.username = username;
    this.onBehalfOfUserId = onBehalfOfUserId;
  }
}
