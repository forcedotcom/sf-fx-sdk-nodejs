"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const index_1 = require("../index");
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
        const results = [];
        const referenceIds = this._uuidToReferenceIds[sObject.uuid];
        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses = this._compositeResponse.compositeSubresponses;
            if (compositeSubresponses) {
                // Use some so that it can short circuit after finding all relevant elements
                compositeSubresponses.some((compositeSubresponse) => {
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
                        return (results.length === referenceIds.size);
                    }
                });
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
    constructor(config, logger) {
        this._config = config;
        this._compositeRequest = __1.CompositeApi.newCompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
        this.logger = logger;
    }
    registerNew(sObject) {
        const insertBuilder = __1.CompositeApi.insertBuilder();
        const compositeSubrequest = insertBuilder.sObject(sObject).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    registerModified(sObject) {
        const patchBuilder = __1.CompositeApi.patchBuilder();
        const compositeSubrequest = patchBuilder.sObject(sObject).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    registerDeleted(sObject) {
        const id = sObject.id;
        if (!id) {
            throw new Error('Id not provided');
        }
        const deleteBuilder = __1.CompositeApi.deleteBuilder();
        const compositeSubrequest = deleteBuilder.sObjectType(sObject.sObjectType).id(id).build();
        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }
    async commit() {
        const compositeApi = __1.CompositeApi.newCompositeApi(this._config, this.logger);
        const compositeResponse = await compositeApi.invoke(this._compositeRequest);
        return new UnitOfWorkResponse(this._uuidToReferenceIds, this._referenceIdToCompositeSubrequests, compositeResponse);
    }
    addCompositeSubrequest(sObject, compositeSubrequest) {
        const referenceId = compositeSubrequest.referenceId;
        const uuid = sObject.uuid;
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
function newUnitOfWork(connectionConfig, logger) {
    return new UnitOfWork(connectionConfig, logger || index_1.sdk.logInit(false));
}
exports.newUnitOfWork = newUnitOfWork;
//# sourceMappingURL=UnitOfWork.js.map