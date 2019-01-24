"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CompositeRequest {
    constructor() {
        this.allOrNone = true;
        this.compositeRequest = [];
    }
    setAllOrNone(allOrNone) {
        this.allOrNone = allOrNone;
    }
    get isAllOrNone() {
        return this.allOrNone;
    }
    addSubrequest(compositeSubrequest) {
        this.compositeRequest.push(compositeSubrequest);
    }
    get subrequests() {
        let ro = this.compositeRequest;
        return ro;
    }
    getSubrequest(referenceId) {
        for (let compositeSubrequest of this.compositeRequest) {
            if (compositeSubrequest.referenceId === referenceId) {
                return compositeSubrequest;
            }
        }
        throw new Error('Unknown referenceId: ' + referenceId);
    }
}
function newCompositeRequest() {
    return new CompositeRequest();
}
exports.newCompositeRequest = newCompositeRequest;
//# sourceMappingURL=CompositeRequest.js.map