/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { CompositeApi, CompositeRequest, CompositeSubrequest, InsertCompositeSubrequestBuilder, PatchCompositeSubrequestBuilder, SObject } from '../../../../lib';

describe('CompositeRequest Tests', () => {
    let compositeRequest:CompositeRequest = null;

    beforeEach(() => {
        compositeRequest = new CompositeRequest();
    });

    it('AllOrNone default is true', () => {
        expect(compositeRequest.isAllOrNone).to.be.true;
    });

    it('AllOrNone set false', () => {
        compositeRequest.setAllOrNone(false);

        expect(compositeRequest.isAllOrNone).to.be.false;
    });

    it('AllOrNone set true', () => {
        compositeRequest.setAllOrNone(false);
        compositeRequest.setAllOrNone(true);

        expect(compositeRequest.isAllOrNone).to.be.true;
    });

    it('addSubrequest/getSubrequests with sObjectType', () => {
        const compositeSubRequest1:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        const compositeSubRequest2:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        compositeRequest.addSubrequest(compositeSubRequest1);
        compositeRequest.addSubrequest(compositeSubRequest2);

        const compositeSubrequests:ReadonlyArray<CompositeSubrequest> = compositeRequest.subrequests;
        expect(compositeSubrequests).to.exist;
        expect(compositeSubrequests).lengthOf(2);
        expect(compositeSubrequests[0]).to.equal(compositeSubRequest1);
        expect(compositeSubrequests[1]).to.equal(compositeSubRequest2);
    });

    it('addSubrequest/getSubrequests with sObject', () => {
        const account:SObject = new SObject('Account');
        const compositeSubRequest1:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObject(account).build();
        const compositeSubRequest2:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObject(account).build();
        compositeRequest.addSubrequest(compositeSubRequest1);
        compositeRequest.addSubrequest(compositeSubRequest2);

        const compositeSubrequests:ReadonlyArray<CompositeSubrequest> = compositeRequest.subrequests;
        expect(compositeSubrequests).to.exist;
        expect(compositeSubrequests).lengthOf(2);
        expect(compositeSubrequests[0]).to.equal(compositeSubRequest1);
        expect(compositeSubrequests[1]).to.equal(compositeSubRequest2);
    });

    it('addSubrequest/getSubrequest by reference id', () => {
        const compositeSubRequest1:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        const compositeSubRequest2:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        compositeRequest.addSubrequest(compositeSubRequest1);
        compositeRequest.addSubrequest(compositeSubRequest2);

        const foundSubrequest1:CompositeSubrequest = compositeRequest.getSubrequest(compositeSubRequest1.referenceId);
        expect(foundSubrequest1).to.exist;
        expect(foundSubrequest1).to.equal(compositeSubRequest1);

        const foundSubrequest2:CompositeSubrequest = compositeRequest.getSubrequest(compositeSubRequest2.referenceId);
        expect(foundSubrequest2).to.exist;
        expect(foundSubrequest2).to.equal(compositeSubRequest2);
    });

    it('getSubrequest throws for non-existent referenceId', () => {
        expect(compositeRequest.getSubrequest.bind(compositeRequest, 'non-existent')).to.throw('Unknown referenceId: non-existent');
    });

    it('Insert and Patch have different reference ids', () => {
        const account: SObject = new SObject('Account');

        const compositeSubRequestInsert:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObject(account).build();
        const compositeSubRequestPatch:CompositeSubrequest = new PatchCompositeSubrequestBuilder().sObject(account).build();

        expect(compositeSubRequestInsert.referenceId).to.not.equal(compositeSubRequestPatch.referenceId);
    });

    it('Insert and Put have different reference ids', () => {
        const account: SObject = new SObject('Account');

        const compositeSubRequestInsert:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObject(account).build();
        const compositeSubRequestPut:CompositeSubrequest = new PatchCompositeSubrequestBuilder().sObject(account).build();

        expect(compositeSubRequestInsert.referenceId).to.not.equal(compositeSubRequestPut.referenceId);
    });

    it('JSON Serialization', () => {
        const compositeSubRequest1:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        const compositeSubRequest2:CompositeSubrequest = new InsertCompositeSubrequestBuilder().sObjectType('Account').build();
        compositeRequest.addSubrequest(compositeSubRequest1);
        compositeRequest.addSubrequest(compositeSubRequest2);

        const compositeRequestFromJson:object = JSON.parse(JSON.stringify(compositeRequest));
        expect(compositeRequestFromJson['allOrNone']).to.be.true;

        // Make sure the subRequests have been correctly serialized
        expect(compositeRequestFromJson['compositeRequest']).to.exist;
        expect(compositeRequestFromJson['compositeRequest']).lengthOf(2);
        compositeRequestFromJson['compositeRequest'].forEach((compositeSubRequest) => {
            Object.keys(compositeSubRequest).forEach((key) => {
                expect(key).to.be.oneOf(['httpHeaders', 'method', 'referenceId', 'url', 'body']);
            });
        });
    });
});