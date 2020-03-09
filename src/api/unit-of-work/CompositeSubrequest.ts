/* eslint-disable @typescript-eslint/no-explicit-any */
import * as _ from 'lodash';
import { Constants, Method, SObject } from '../..';

export class CompositeSubrequest {
    public readonly httpHeaders: { [key: string]: string };
    public readonly method: Method;
    public readonly referenceId: string;
    public readonly url: string;
    public readonly body: { [key: string]: any };
    public readonly sObjectType: string;
    public readonly apiVersion: string;

    public constructor(builder: CompositeSubrequestBuilder) {
        this.httpHeaders = builder.httpHeaders;
        this.method = builder.method;
        this.body = builder.values;
        this.apiVersion = builder.getApiVersion();
        this.referenceId = builder.getReferenceId();
        this.sObjectType = builder.getSObjectType();
        this.url = builder.getUrl();
    }

    public toJSON(): object {
        const result: object = _.omit(this, ['sObjectType', 'apiVersion']);
        return result;
    }
}

export abstract class CompositeSubrequestBuilder {
    public readonly method: Method;
    public readonly httpHeaders: { [key: string]: string };
    public readonly values: { [key: string]: any };
    protected _referenceId: string;
    protected _rootReferenceId: string;
    private _apiVersion: string;
    private _id: string;
    private _sObjectType: string;
    private _url: string;

    protected constructor(method: Method, values: { [key: string]: any } = {}) {
        this._apiVersion = Constants.CURRENT_API_VERSION;
        this.httpHeaders = {};
        this.method = method;
        this.values = values;
    }

    public getApiVersion(): string {
        return this._apiVersion;
    }

    public getId(): string {
        return this._id;
    }

    public getReferenceId(): string {
        return this._referenceId;
    }

    public getSObjectType(): string {
        return this._sObjectType;
    }

    public getUrl(): string {
        return this._url;
    }

    public id(id: string): CompositeSubrequestBuilder {
        this._id = id;
        return this;
    }

    public sObjectType(sObjectType: string): CompositeSubrequestBuilder {
        this._sObjectType = sObjectType;
        return this;
    }

    public sObject(sObject: SObject): CompositeSubrequestBuilder {
        this.sObjectType(sObject.sObjectType);
        this.id(sObject.id);
        this.addValues(sObject.values);
        return this;
    }

    public addValue(key: string, value: any): CompositeSubrequestBuilder {
        this.values[key] = value;
        return this;
    }

    public addValues(values: { [key: string]: any }): CompositeSubrequestBuilder {
        Object.keys(values).forEach(key => {
            this.addValue(key, values[key]);
        });
        return this;
    }

    public named(name: string): CompositeSubrequestBuilder {
        this.addValue('Name', name);
        return this;
    }

    public apiVersion(apiVersion: string): CompositeSubrequestBuilder {
        this._apiVersion = apiVersion;
        return this;
    }

    public header(key: string, value: string): CompositeSubrequestBuilder {
        this.httpHeaders[key] = value;
        return this;
    }

    public headers(headers: { [key: string]: string }): CompositeSubrequestBuilder {
        Object.keys(headers).forEach(key => {
            this.header(key, headers[key]);
        });
        return this;
    }

    public build(): CompositeSubrequest {
        if (!this._sObjectType) {
            throw new Error('Type is required');
        }

        // TODO: What is the preferred way to check for null
        if (!this._referenceId) {
            this._referenceId = SObject.generateReferenceId(this._sObjectType);
        }

        this._url = this._internalGetUrl();

        return new CompositeSubrequest(this);
    }

    protected _getBaseUrl(): string {
        return `/services/data/v${this._apiVersion}/sobjects/${this._sObjectType}`;
    }

    protected _getExistingUrl(): string {
        let url: string = this._getBaseUrl() + '/';
        if (this._id) {
            url += this._id;
        } else if (this._rootReferenceId) {
            url += '@{' + this._rootReferenceId + '.id}';
        } else {
            url += '@{' + this._referenceId + '.id}';
        }
        return url;
    }

    protected abstract _internalGetUrl(): string;
}

abstract class NoBodyCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(method: Method) {
        super(method, undefined /*This request can't accept any values*/);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public addValue(key: string, value: any): CompositeSubrequestBuilder {
        throw new Error(`This request doesn't have a body`);
    }

    public addValues(values: { [key: string]: any }): CompositeSubrequestBuilder {
        if (Object.keys(values).length > 0) {
            throw new Error(`This request doesn't have a body`);
        }
        return this;
    }
}

export class DeleteCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(Method.DELETE);
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

export class DescribeCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(Method.GET);
    }

    public sObject(sObject: SObject): CompositeSubrequestBuilder {
        this._referenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return `${this._getBaseUrl()}/describe`;
    }
}

export class HttpGETCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(Method.GET);
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

export class InsertCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(Method.POST);
    }

    public id(id: string): CompositeSubrequestBuilder {
        if (id) {
            throw new Error(`This request doesn't support an id`);
        }
        return this;
    }

    public sObject(sObject: SObject): CompositeSubrequestBuilder {
        this._referenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getBaseUrl();
    }
}

export class PatchCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(Method.PATCH);
    }

    public sObject(sObject: SObject): CompositeSubrequestBuilder {
        this._rootReferenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

export class PutCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(Method.PUT);
    }

    public sObject(sObject: SObject): CompositeSubrequestBuilder {
        this._rootReferenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}