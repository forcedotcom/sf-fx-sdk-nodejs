"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const sfxif = require("../Interfaces");
const so = require("../SObject");
const sfcontants = require("../Constants");
class CompositeSubrequest {
    constructor(builder) {
        this.httpHeaders = builder._httpHeaders;
        this.method = builder._method;
        this.referenceId = builder._referenceId;
        this.url = builder._url;
        this.body = builder._values;
        this.sObjectType = builder._sObjectType;
        this.apiVersion = builder._apiVersion;
    }
    toJSON() {
        let result = _.omit(this, ["sObjectType", "apiVersion"]);
        return result;
    }
}
class CompositeSubrequestBuilder {
    constructor(method, values = {}) {
        this._method = method;
        this._apiVersion = sfcontants.CURRENT_API_VERSION;
        this._values = values;
        this._httpHeaders = {};
    }
    id(id) {
        this._id = id;
        return this;
    }
    sObjectType(sObjectType) {
        this._sObjectType = sObjectType;
        return this;
    }
    sObject(sObject) {
        this.sObjectType(sObject.getSObjectType());
        this.id(sObject.getId());
        this.values(sObject.getValues());
        return this;
    }
    value(key, value) {
        this._values[key] = value;
        return this;
    }
    values(values) {
        Object.keys(values).forEach((key) => {
            this.value(key, values[key]);
        });
        return this;
    }
    named(name) {
        this.value('Name', name);
        return this;
    }
    apiVersion(apiVersion) {
        this._apiVersion = apiVersion;
        return this;
    }
    header(key, value) {
        this._httpHeaders[key] = value;
        return this;
    }
    headers(headers) {
        Object.keys(headers).forEach((key) => {
            this.header(key, headers[key]);
        });
        return this;
    }
    build() {
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
    _getBaseUrl() {
        return '/services/data/v' + this._apiVersion + '/sobjects/' + this._sObjectType;
    }
    _getExistingUrl() {
        let url = this._getBaseUrl() + '/';
        if (this._id) {
            url += this._id;
        }
        else if (this._rootReferenceId) {
            url += '@{' + this._rootReferenceId + '.id}';
        }
        else {
            url += '@{' + this._referenceId + '.id}';
        }
        return url;
    }
}
class NoBodyCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(method) {
        super(method, undefined /*This request can't accept any values*/);
    }
    value(key, value) {
        throw new Error("This request doesn't have a body");
    }
    values(values) {
        if (Object.keys(values).length > 0) {
            throw new Error("This request doesn't have a body");
        }
        return this;
    }
}
class InsertCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.POST);
    }
    id(id) {
        if (id) {
            throw new Error("This request doesn't support an id");
        }
        return this;
    }
    sObject(sObject) {
        this._referenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getBaseUrl();
    }
}
class DeleteCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.DELETE);
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
class DescribeCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.GET);
    }
    sObject(sObject) {
        this._referenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getBaseUrl() + "/describe";
    }
}
class HttpGETCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.GET);
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
class PatchCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.PATCH);
    }
    sObject(sObject) {
        this._rootReferenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
class PutCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor() {
        super(sfxif.Method.PUT);
    }
    sObject(sObject) {
        this._rootReferenceId = sObject.getReferenceId();
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
function deleteBuilder() {
    return new DeleteCompositeSubrequestBuilder();
}
exports.deleteBuilder = deleteBuilder;
function describeBuilder() {
    return new DescribeCompositeSubrequestBuilder();
}
exports.describeBuilder = describeBuilder;
function httpGETBuilder() {
    return new HttpGETCompositeSubrequestBuilder();
}
exports.httpGETBuilder = httpGETBuilder;
function insertBuilder() {
    return new InsertCompositeSubrequestBuilder();
}
exports.insertBuilder = insertBuilder;
function patchBuilder() {
    return new PatchCompositeSubrequestBuilder();
}
exports.patchBuilder = patchBuilder;
function putBuilder() {
    return new PutCompositeSubrequestBuilder();
}
exports.putBuilder = putBuilder;
//# sourceMappingURL=CompositeSubrequest.js.map