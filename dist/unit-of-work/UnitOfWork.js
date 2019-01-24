"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index = require('../index.ts');
;
;
class UnitOfWorkResult {
    constructor(method, id, isSuccess, errors) {
        this.method = method;
        this.id = id;
        this.isSuccess = isSuccess;
        this.errors = errors;
    }
}
class UnitOfWorkResponse {
    constructor(uuidToReferenceIds, referenceIdToCompositeSubrequests, compositeResponse) {
        this._uuidToReferenceIds = uuidToReferenceIds;
        this._referenceIdToCompositeSubrequests = referenceIdToCompositeSubrequests;
        this._compositeResponse = compositeResponse;
    }
    getResults(sObject) {
        const results = new Array();
        const referenceIds = this._uuidToReferenceIds[sObject.getUuid()];
        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses = this._compositeResponse.compositeSubresponses;
            if (compositeSubresponses && compositeSubresponses.length > 0) {
                for (let i = 0; i < compositeSubresponses.length; i++) {
                    const compositeSubresponse = compositeSubresponses[i];
                    const referenceId = compositeSubresponse.referenceId;
                    if (referenceIds.has(referenceId)) {
                        const compositeSubrequest = this._referenceIdToCompositeSubrequests[referenceId];
                        if (!compositeSubrequest) {
                            throw new Error('Unable to find CompositeSubrequest with referenceId=' + referenceId);
                        }
                        const method = compositeSubrequest.method;
                        const id = compositeSubresponse.id;
                        const success = compositeSubresponse.isSuccess;
                        let errors;
                        if (!success) {
                            errors = compositeSubresponse.errors;
                        }
                        results.push(new UnitOfWorkResult(method, id, success, errors));
                        // 1:1 relationship. Exit if we have found everything
                        if (results.length === referenceIds.size) {
                            break;
                        }
                    }
                }
            }
        }
        return results;
    }
    getId(sObject) {
        const results = this.getResults(sObject);
        if (results && results.length > 0) {
            return results[0].id;
        }
    }
}
class UnitOfWork {
    constructor(config) {
        this._config = config;
        this._compositeRequest = index.compositeApi.newCompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
    }
    registerNew(sObject) {
        const insertBuilder = index.compositeApi.insertBuilder();
        const compositeSubrequest = insertBuilder.sObject(sObject).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    registerModified(sObject) {
        const patchBuilder = index.compositeApi.patchBuilder();
        const compositeSubrequest = patchBuilder.sObject(sObject).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    registerDeleted(sObject) {
        const id = sObject.getId();
        if (!id) {
            throw new Error('Id not provided');
        }
        const deleteBuilder = index.compositeApi.deleteBuilder();
        const compositeSubrequest = deleteBuilder.sObjectType(sObject.getSObjectType()).id(id).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    async commit() {
        const compositeApi = index.compositeApi.newCompositeApi(this._config);
        const compositeResponse = await compositeApi.invoke(this._compositeRequest);
        return new UnitOfWorkResponse(this._uuidToReferenceIds, this._referenceIdToCompositeSubrequests, compositeResponse);
    }
    addCompositeSubrequest(sObject, compositeSubrequest) {
        const referenceId = compositeSubrequest.referenceId;
        const uuid = sObject.getUuid();
        let referenceIds = this._uuidToReferenceIds[uuid];
        if (!referenceIds) {
            referenceIds = new Set();
            this._uuidToReferenceIds[uuid] = referenceIds;
        }
        referenceIds.add(referenceId);
        this._compositeRequest.addSubrequest(compositeSubrequest);
        this._referenceIdToCompositeSubrequests[referenceId] = compositeSubrequest;
    }
}
function newUnitOfWork(config) {
    return new UnitOfWork(config);
}
exports.newUnitOfWork = newUnitOfWork;
//# sourceMappingURL=UnitOfWork.js.map