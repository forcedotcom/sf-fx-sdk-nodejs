import * as _ from 'lodash';

import * as sfxif from '../Interfaces';
import * as so from '../SObject';
import * as sfcontants from '../Constants';

class CompositeSubrequest implements sfxif.ICompositeSubrequest {
    readonly httpHeaders: { [key: string]: string };
    readonly method: sfxif.Method;
    readonly referenceId: string;
    readonly url: string;
    readonly body: { [key: string]: any };
    readonly sObjectType: string;
    readonly apiVersion: string;

    public constructor(builder: CompositeSubrequestBuilder) {
        this.httpHeaders = builder._httpHeaders;
        this.method = builder._method;
        this.referenceId = builder._referenceId;
        this.url = builder._url;
        this.body = builder._values;
        this.sObjectType = builder._sObjectType;
        this.apiVersion = builder._apiVersion;
    }

    public toJSON(): object {
        let result: object = _.omit(this, ["sObjectType", "apiVersion"]);
        return result;
    }
}

abstract class CompositeSubrequestBuilder implements sfxif.ICompositeSubrequestBuilder {
    readonly _method: sfxif.Method;
    readonly _httpHeaders: { [key: string]: string };
    readonly _values: { [key: string]: any };
    _referenceId: string;
    _apiVersion: string;
    _url: string;
    _id: string;
    _sObjectType: string;
    _rootReferenceId: string;

    protected constructor(method: sfxif.Method, values: { [key: string]: any } = {}) {
        this._method = method;
        this._apiVersion = sfcontants.CURRENT_API_VERSION;
        this._values = values;
        this._httpHeaders = {};
    }

    public id(id: string): sfxif.ICompositeSubrequestBuilder {
        this._id = id;
        return this;
    }

    public sObjectType(sObjectType: string): sfxif.ICompositeSubrequestBuilder {
        this._sObjectType = sObjectType;
        return this;
    }

    public sObject(sObject: sfxif.ISObject): sfxif.ICompositeSubrequestBuilder {
        this.sObjectType(sObject.getSObjectType());
        this.id(sObject.getId());
        this.values(sObject.getValues());
        return this;
    }

    public value(key: string, value: any): sfxif.ICompositeSubrequestBuilder {
        this._values[key] = value;
        return this;
    }

    public values(values: { [key: string]: any; }): sfxif.ICompositeSubrequestBuilder {
        Object.keys(values).forEach((key) => {
            this.value(key, values[key]);
        });
        return this;
    }

    public named(name: string): sfxif.ICompositeSubrequestBuilder {
        this.value('Name', name);
        return this;
    }

    public apiVersion(apiVersion: string): sfxif.ICompositeSubrequestBuilder {
        this._apiVersion = apiVersion;
        return this;
    }

    public header(key: string, value: string): sfxif.ICompositeSubrequestBuilder {
        this._httpHeaders[key] = value;
        return this;
    }

    public headers(headers: { [key: string]: string; }): sfxif.ICompositeSubrequestBuilder {
        Object.keys(headers).forEach((key) => {
            this.header(key, headers[key]);
        });
        return this;
    }

    public build(): sfxif.ICompositeSubrequest {
        if (!this._sObjectType) {
            throw new Error("Type is required");
        }

        // TODO: What is the preferred way to check for null
        if (!this._referenceId) {
            this._referenceId = so.SObject.generateReferenceId(this._sObjectType);
        }

        this._url = this._internalGetUrl();

        return new CompositeSubrequest(this);
    }

    protected _getBaseUrl(): string {
        return '/services/data/v' + this._apiVersion + '/sobjects/' + this._sObjectType;
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
    constructor(method: sfxif.Method) {
        super(method, undefined/*This request can't accept any values*/);
    }

    public value(key: string, value: any): sfxif.ICompositeSubrequestBuilder {
        throw new Error("This request doesn't have a body");
    }

    public values(values: { [key: string]: any; }): sfxif.ICompositeSubrequestBuilder {
        if (Object.keys(values).length > 0) {
            throw new Error("This request doesn't have a body");
        }
        return this;
    }
}

class InsertCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.POST);
    }

    public id(id: string): sfxif.ICompositeSubrequestBuilder {
        if (id) {
            throw new Error("This request doesn't support an id");
        }
        return this;
    }

    public sObject(sObject: sfxif.ISObject): sfxif.ICompositeSubrequestBuilder {
        this._referenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getBaseUrl();
    }
}

class DeleteCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.DELETE);
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

class DescribeCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.GET);
    }

    public sObject(sObject: sfxif.ISObject): sfxif.ICompositeSubrequestBuilder {
        this._referenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getBaseUrl() + "/describe";
    }
}

class HttpGETCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.GET);
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

class PatchCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.PATCH);
    }

    public sObject(sObject: sfxif.ISObject): sfxif.ICompositeSubrequestBuilder {
        this._rootReferenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

class PutCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    public constructor() {
        super(sfxif.Method.PUT);
    }

    public sObject(sObject: sfxif.ISObject): sfxif.ICompositeSubrequestBuilder {
        this._rootReferenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }

    protected _internalGetUrl(): string {
        return this._getExistingUrl();
    }
}

export function deleteBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new DeleteCompositeSubrequestBuilder();
}

export function describeBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new DescribeCompositeSubrequestBuilder();
}

export function httpGETBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new HttpGETCompositeSubrequestBuilder();
}

export function insertBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new InsertCompositeSubrequestBuilder();
}

export function patchBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new PatchCompositeSubrequestBuilder();
}

export function putBuilder(): sfxif.ICompositeSubrequestBuilder {
    return new PutCompositeSubrequestBuilder();
}