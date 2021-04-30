export class Logger {
  constructor({id}) {
    this.id = id;
  }

  // TODO: Mimic a popular logging library? Mimic console.log?
  info(message) {
    console.log(`[INFO ] [ID: ${this.id}] ${message}`);
  }

  // TODO: Mimic a popular logging library? Mimic console.log?
  debug(message) {
    console.log(`[DEBUG] [ID: ${this.id}] ${message}`);
  }

  // TODO: Mimic a popular logging library? Mimic console.log?
  error(message) {
    console.log(`[ERROR] [ID: ${this.id}] ${message}`);
  }
}
