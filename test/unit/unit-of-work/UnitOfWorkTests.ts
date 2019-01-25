import { expect } from 'chai';
import { stub, restore } from 'sinon';
import 'mocha';
import nock = require('nock');
import { v4 as uuid } from 'uuid';

import { IConfig, ISObject, IUnitOfWork, IUnitOfWorkResponse, IUnitOfWorkResult, Method } from '../../../lib/Interfaces';
import { CompositeApi, Config, SObject, UnitOfWork } from '../../../lib';

const instanceUrl: string = 'http://localhost:3000';
const apiVersion: string = '45.0';
const sessionId: string = 'sessionId1234';
const myConfig: IConfig = new Config(instanceUrl, apiVersion, sessionId);

describe('UnitOfWork Tests', () => {
    afterEach(() => {
        nock.cleanAll();
        restore();
    });

    it('Insert Account', async () => {
        const account: ISObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        nock(instanceUrl)
            .post('/services/data/v' + myConfig.apiVersion + '/composite/')
            .reply(CompositeApi.HttpCodes.OK, {
                'compositeResponse':
                    [{
                        'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Account/001xx000003EG4jAAG' },
                        'httpStatusCode': CompositeApi.HttpCodes.Created,
                        'referenceId': account.referenceId
                    }]
            });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(myConfig);
        
        uow.registerNew(account);
        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.equal('001xx000003EG4jAAG');
    });

    it('Update Existing Account', async () => {
        let account: ISObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(myConfig);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + myConfig.apiVersion + '/composite/')
            .reply(CompositeApi.HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': CompositeApi.HttpCodes.NoContent,
                    'referenceId': mockedReferenceId
                }]
            });

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = 'MyAccount - uow - integration - ' + new Date();
        const newName = 'Updated ' + originalName;
        const account: ISObject = new SObject('Account');
        account.setValue('Name', originalName);

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(myConfig);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + myConfig.apiVersion + '/composite/')
            .reply(CompositeApi.HttpCodes.OK, {
                'compositeResponse': [
                    {
                        'body': { 'id': '001xx000003EG6oAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Account/001xx000003EG6oAAG' },
                        'httpStatusCode': CompositeApi.HttpCodes.Created,
                        'referenceId': account.referenceId
                    },
                    {
                        'body': null,
                        'httpHeaders': {},
                        'httpStatusCode': CompositeApi.HttpCodes.NoContent,
                        'referenceId': mockedReferenceId
                    }]
            });

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: IUnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: IUnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        let account: ISObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');;
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(myConfig);
        uow.registerDeleted(account);

        nock(instanceUrl)
            .post('/services/data/v' + myConfig.apiVersion + '/composite/')
            .reply(CompositeApi.HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': CompositeApi.HttpCodes.NoContent,
                    'referenceId': mockedReferenceId
                }]
            }
            );

        uow.registerDeleted(account);

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });
});