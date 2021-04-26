export class InvocationEvent {
  id;
  type;
  source
  data;
  dataContentType;
  dataSchema;
  time;

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
