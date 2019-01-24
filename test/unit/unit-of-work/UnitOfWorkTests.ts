import { expect } from 'chai';
import { stub, restore } from 'sinon';
import 'mocha';
import nock = require('nock');
import { v4 as uuid } from 'uuid';

import * as sfxif from '../../../lib/Interfaces';
const index = require('../../../lib')

const instanceUrl: string = 'http://localhost:3000';
const apiVersion: string = '45.0';
const sessionId: string = 'sessionId1234';
const config: sfxif.IConfig = index.config.newConfig(instanceUrl, apiVersion, sessionId);

describe('UnitOfWork Tests', () => {
    afterEach(() => {
        nock.cleanAll();
        restore();
    });

    it('Insert Account', async () => {
        const account: sfxif.ISObject = new index.sObject.SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(index.compositeApi.HttpCodes.OK, {
                "compositeResponse":
                    [{
                        "body": { "id": "001xx000003EG4jAAG", "success": true, "errors": [] },
                        "httpHeaders": { "Location": "/services/data/v45.0/sobjects/Account/001xx000003EG4jAAG" },
                        "httpStatusCode": index.compositeApi.HttpCodes.Created,
                        "referenceId": account.getReferenceId()
                    }]
            });

        const uow: sfxif.IUnitOfWork = index.unitOfWork.newUnitOfWork(config);
        
        uow.registerNew(account);
        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(sfxif.Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.equal('001xx000003EG4jAAG');
    });

    it('Update Existing Account', async () => {
        let account: sfxif.ISObject = new index.sObject.SObject('Account').id("001xx000003EG4jAAG").named("New Account Name");

        let mockedReferenceId: string;

        stub(index.sObject.SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + "_" + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: sfxif.IUnitOfWork = index.unitOfWork.newUnitOfWork(config);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(index.compositeApi.HttpCodes.OK, {
                "compositeResponse": [{
                    "body": null,
                    "httpHeaders": {},
                    "httpStatusCode": index.compositeApi.HttpCodes.NoContent,
                    "referenceId": mockedReferenceId
                }]
            });

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(sfxif.Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = 'MyAccount - uow - integration - ' + new Date();
        const newName = 'Updated ' + originalName;
        const account: sfxif.ISObject = new index.sObject.SObject('Account');
        account.setValue('Name', originalName);

        let mockedReferenceId: string;

        stub(index.sObject.SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + "_" + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: sfxif.IUnitOfWork = index.unitOfWork.newUnitOfWork(config);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(index.compositeApi.HttpCodes.OK, {
                "compositeResponse": [
                    {
                        "body": { "id": "001xx000003EG6oAAG", "success": true, "errors": [] },
                        "httpHeaders": { "Location": "/services/data/v45.0/sobjects/Account/001xx000003EG6oAAG" },
                        "httpStatusCode": index.compositeApi.HttpCodes.Created,
                        "referenceId": account.getReferenceId()
                    },
                    {
                        "body": null,
                        "httpHeaders": {},
                        "httpStatusCode": index.compositeApi.HttpCodes.NoContent,
                        "referenceId": mockedReferenceId
                    }]
            });

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(sfxif.Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: sfxif.IUnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(sfxif.Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        let account: sfxif.ISObject = new index.sObject.SObject('Account').id("001xx000003EG4jAAG").named("New Account Name");

        let mockedReferenceId: string;

        stub(index.sObject.SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + "_" + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: sfxif.IUnitOfWork = index.unitOfWork.newUnitOfWork(config);
        uow.registerDeleted(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(index.compositeApi.HttpCodes.OK, {
                "compositeResponse": [{
                    "body": null,
                    "httpHeaders": {},
                    "httpStatusCode": index.compositeApi.HttpCodes.NoContent,
                    "referenceId": mockedReferenceId
                }]
            }
            );

        uow.registerDeleted(account);

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(sfxif.Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });
});