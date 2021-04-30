export class InvocationEvent {
  constructor({
    id,
    type,
    source,
    data,
    datacontenttype,
    schemaurl,
    time
  }) {
    this.id = id;
    this.type = type;
    this.source = source;
    this.data = data;
    this.dataContentType = datacontenttype;
    this.dataSchema = schemaurl;
    this.time = time;
  }
}
