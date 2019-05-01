// https://github.com/cloudevents/sdk-javascript/issues/9
// https://platformcloud.slack.com/archives/C4LRY7WQ1/p1556242806009100
declare module 'cloudevents-sdk' {
    type SpecPayload = {
        [key: string]: any;
    };

    class Spec01 {
        public payload: SpecPayload & {
            cloudEventsVersion: '0.1';
            eventID: string;
        };

        public check(): void;

        public type(type: string): Spec01;
        public getType(): string | undefined;

        public getSpecversion(): string;

        public eventTypeVersion(eventTypeVersion: string): Spec01;
        public getEventTypeVersion(): string | undefined;

        public source(source: string): Spec01;
        public getSource(): string | undefined;

        public id(id: string): Spec01;
        public getId(): string | undefined;

        public schemaurl(schemaurl: string): Spec01;
        public getSchemaurl(): string | undefined;

        public contenttype(contenttype: string): Spec01;
        public getContenttype(): string | undefined;

        public data(data: any): Spec01;
        public getData(): any;

        public time(time: Date): Spec01;
        public getTime(): string | undefined;

        public addExtension(key: string, value: any): Spec01;
    }

    class Spec02 {
        public payload: SpecPayload & {
            specversion: '0.2';
            id: string;
        };

        public check(): void;

        public type(type: string): Spec02;
        public getType(): string | undefined;

        public getSpecversion(): string;

        public eventTypeVersion(eventTypeVersion: string): Spec02;
        public getEventTypeVersion(): string | undefined;

        public source(source: string): Spec02;
        // FIXME: following changes needs to be published to npm, so using
        // repo directly in package.json until then
        // https://github.com/cloudevents/sdk-javascript/pull/8
        public getSource(): string | undefined;

        public id(id: string): Spec02;
        public getId(): string | undefined;

        public time(time: Date): Spec02;
        public getTime(): string | undefined;

        public schemaurl(schemaurl: string): Spec02;
        public getSchemaurl(): string | undefined;

        public contenttype(contenttype: string): Spec02;
        public getContenttype(): string | undefined;

        public data(data: any): Spec02;
        public getData(): any;

        public addExtension(key: string, value: any): Spec02;
    }

    type Extensions = {
        [key: string]: any;
    };

    class JSONFormatter01 {
        public format(payload: SpecPayload): SpecPayload;
        public toString(payload: SpecPayload): string;
    }

    class Cloudevent {
        public static specs: {
            0.1: Spec01;
            0.2: Spec02;
        };

        public static formats: {
            json: JSONFormatter01;
            'json0.1': JSONFormatter01;
        };

        public static bindings: {
            'http-structured': any;
            'http-structured0.1': any;
            'http-structured0.2': any;
            'http-binary0.1': any;
            'http-binary0.2': any;
        };

        public spec: Spec01 | Spec02;

        public constructor(spec?: Spec01 | Spec02, formatter?: JSONFormatter01);

        public format(): SpecPayload;
        public toString(): string;

        public type(type: string): Cloudevent;
        public getType(): string | undefined;

        public getSpecversion(): string;

        public source(type: string): Cloudevent;
        public getSource(): string | undefined;

        public id(id: string | number): Cloudevent;
        public getId(): string | undefined;

        public time(type: Date): Cloudevent;
        public getTime(): string | undefined;

        public schemaurl(schemaurl: string): Cloudevent;
        public getSchemaurl(): string | undefined;

        public contenttype(contenttype: string): Cloudevent;
        public getContenttype(): string | undefined;

        public data(data: any): Cloudevent;
        public getData(): any;

        public addExtension(key: string, value: any): Cloudevent;
        public getExtensions(): Extensions;
    }

    export = Cloudevent;
}
