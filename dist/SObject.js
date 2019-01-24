"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class SObject {
    constructor(sObjectType) {
        this._sObjectType = sObjectType;
        this._uuid = uuid_1.v4();
        this._values = {};
        this._referenceId = SObject.generateReferenceId(sObjectType);
    }
    getSObjectType() {
        return this._sObjectType;
    }
    getUuid() {
        return this._uuid;
    }
    id(id) {
        this._id = id;
        return this;
    }
    getId() {
        return this._id;
    }
    getValues() {
        // TODO: ReadOnly
        return this._values;
    }
    setValue(key, value) {
        this._values[key] = value;
    }
    named(name) {
        this.setValue('Name', name);
        return this;
    }
    getReferenceId() {
        return this._referenceId;
    }
    getFkId() {
        if (this.getId()) {
            return this.getId();
        }
        else {
            return '@{' + this.getReferenceId() + '.id}';
        }
    }
    static generateReferenceId(type) {
        return type + "_" + uuid_1.v4().replace(/-/g, '');
    }
}
exports.SObject = SObject;
//# sourceMappingURL=SObject.js.map