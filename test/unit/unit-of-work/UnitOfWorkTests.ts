/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { restore, stub } from 'sinon';
import { HttpCodes } from 'typed-rest-client/HttpClient';
import { v4 as uuid } from 'uuid';

import { Config, SObject, UnitOfWork } from '../../../lib';
import { IConfig, ISObject, IUnitOfWork, IUnitOfWorkResponse, IUnitOfWorkResult, Method } from '../../../lib/Interfaces';

const instanceUrl: string = 'http://localhost:3000';
const apiVersion: string = '45.0';
const sessionId: string = 'sessionId1234';
const config: IConfig = new Config(instanceUrl, apiVersion, sessionId);

const httpCodeCreated:number = 201;
const httpCodeNoContent:number = 204;

describe('UnitOfWork Tests', () => {
    afterEach(() => {
        nock.cleanAll();
        restore();
    });

    it('Insert Account', async () => {
        const account: ISObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse':
                    [{
                        'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Account/001xx000003EG4jAAG' },
                        'httpStatusCode': httpCodeCreated,
                        'referenceId': account.referenceId
                    }]
            });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        
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
        const account: ISObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': httpCodeNoContent,
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
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [
                    {
                        'body': { 'id': '001xx000003EG6oAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Account/001xx000003EG6oAAG' },
                        'httpStatusCode': httpCodeCreated,
                        'referenceId': account.referenceId
                    },
                    {
                        'body': null,
                        'httpHeaders': {},
                        'httpStatusCode': httpCodeNoContent,
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
        const account: ISObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        uow.registerDeleted(account);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': httpCodeNoContent,
                    'referenceId': mockedReferenceId
                }]
            }
            );

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

    it('Unit Insert Account and Contact', async () => {
        let mockedReferenceIds: string[] = [];

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            const mockedReferenceId:string = type + '_' + uuid().replace(/-/g, '');
            mockedReferenceIds.push(mockedReferenceId)
            return mockedReferenceId;
        });

        const account: ISObject = new SObject('Account');
        account.setValue('Name', `MyAccount - uow - integration - ${new Date()}`);

        const contact: ISObject = new SObject('Contact');
        contact.setValue('LastName', `LastName - ${new Date()}`);
        contact.setValue('AccountId', account.fkId);

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        uow.registerNew(account);
        uow.registerNew(contact);

        nock(instanceUrl)
            .post('/services/data/v' + config.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                    'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Account/003xx000003EG4jAAG' },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[0]
                },
                {
                    'body': { 'id': '003xx000003EG4jAAG', 'success': true, 'errors': [] },
                    'httpHeaders': { 'Location': '/services/data/v45.0/sobjects/Contact/003xx000003EG4jAAG' },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[1]
                }]
            }
            );

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;

        const accountResults: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(accountResults).to.exist;
        expect(accountResults).lengthOf(1);
        const uowResultAccount: IUnitOfWorkResult = accountResults[0];
        expect(uowResultAccount.isSuccess).to.be.true;
        expect(uowResultAccount.method).to.equal(Method.POST);
        expect(uowResultAccount.id).to.exist;
        expect(uowResultAccount.id).to.match(/^001[A-Za-z0-9]{15}/);

        const contactResults: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(contact);
        expect(contactResults).to.exist;
        expect(contactResults).lengthOf(1);
        const uowResultContact: IUnitOfWorkResult = contactResults[0];
        expect(uowResultContact.isSuccess).to.be.true;
        expect(uowResultContact.method).to.equal(Method.POST);
        expect(uowResultContact.id).to.exist;
        expect(uowResultContact.id).to.match(/^003[A-Za-z0-9]{15}/);
    });   
});