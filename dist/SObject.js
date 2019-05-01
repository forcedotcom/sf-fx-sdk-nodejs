"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class SObject {
    static generateReferenceId(type) {
        return `${type}_` + uuid_1.v4().replace(/-/g, '');
    }
    constructor(sObjectType) {
        this.referenceId = SObject.generateReferenceId(sObjectType);
        this.sObjectType = sObjectType;
        this.uuid = uuid_1.v4();
        this._values = {};
    }
    named(name) {
        this.setValue('Name', name);
        return this;
    }
    setValue(key, value) {
        this._values[key] = value;
    }
    withId(id) {
        this._id = id;
        return this;
    }
    get id() {
        return this._id;
    }
    get values() {
        return this._values;
    }
    get fkId() {
        if (this._id) {
            return this._id;
        }
        else {
            return `@{${this.referenceId}.id}`;
        }
    }
    asMap() {
        return Object.assign({}, { Id: this._id }, this.values);
    }
}
exports.SObject = SObject;
//# sourceMappingURL=SObject.js.map