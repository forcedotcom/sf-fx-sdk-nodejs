/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { restore, stub } from 'sinon';
import { HttpCodes } from 'typed-rest-client/HttpClient';
import { v4 as uuid } from 'uuid';
import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig,
    Constants,
    Method,
    PlatformEvent,
    SObject,
    UnitOfWork,
    UnitOfWorkResponse,
    UnitOfWorkResult
}
    from '../../../../src';
import { UnitOfWorkError } from '../../../../src/api/unit-of-work/UnitOfWork';
import { fail } from 'assert';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const instanceUrl = 'http://localhost:3000';
const apiVersion = Constants.CURRENT_API_VERSION;
const accessToken = 'accessToken1234';
const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);
const connectionConfig228: ConnectionConfig = new ConnectionConfig(accessToken, APIVersion.V50, instanceUrl);

const httpCodeCreated = 201;
const httpCodeNoContent = 204;

describe('UnitOfWork Tests', () => {
    afterEach(() => {
        nock.cleanAll();
        restore();
    });

    it('Insert Account', async () => {
        const account: SObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse':
                    [{
                        'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG4jAAG` },
                        'httpStatusCode': httpCodeCreated,
                        'referenceId': account.referenceId
                    }]
            });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);

        uow.registerNew(account);
        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.equal('001xx000003EG4jAAG');
    });

    it('Insert Account Err w/Missing Required Property', async () => {
        const nowHex = new Date().getTime().toString(16);
        const a1 = new SObject('Account')
            .withValue('Name', 'MyAccount - uowErr - integration ' + nowHex);
        const a2 = new SObject('Account')
            .withValue('XName', 'MyAccount - uowErr - integration ' + nowHex);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                  "compositeResponse": [{                        // Real response captured from 228 endpoint
                        "body": [{
                            "errorCode": "PROCESSING_HALTED",    // Actually-valid submission gets PROCESSING_HALTED
                            "message": "The transaction was rolled back since another operation in the same transaction failed."
                        }],
                        "httpHeaders": {},
                        "httpStatusCode": 400,
                        "referenceId": a1.referenceId
                      }, {
                        "body": [{
                            "message": "No such column XName on sobject of type Account",
                            "errorCode": "INVALID_FIELD"         // Real error/failure identified w/its own ERROR_CODE
                        }],
                        "httpHeaders": {},
                        "httpStatusCode": 400,
                        "referenceId": a2.referenceId
                      }]
            });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER)
            .registerNew(a1)
            .registerNew(a2);

            const uowErr: UnitOfWorkError = await uow.commit()
            .then(unexpectedSuccess => {
                fail('Got a successfult response, was expecting an error! ' + unexpectedSuccess);
                throw Error('Should never get here');
            })
            .catch(err => {
                return err as UnitOfWorkError;
            });
        expect(uowErr).to.exist;

        expect(uowErr.message).to.exist;
        expect(uowErr.rootCause).to.exist;
        expect(uowErr.httpStatus).to.equal(400);
        expect(uowErr.rootCause.isSuccess).to.be.false;
        expect(uowErr.rootCause.errors).to.exist;
        expect(uowErr.rootCause.errors).lengthOf(1);
        const acctErr = uowErr.rootCause.errors[0];
        expect(acctErr.message).to.equal('No such column XName on sobject of type Account');
        expect(uowErr.rootCause.method).to.equal(Method.POST);
        expect(uowErr.rootCause.id).to.not.exist;                // object *not* inserted so no `id` defined
    });

    it('Graph Insert Account', async () => {
        const account: SObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        // release 228 and above w/API version 50.0+ have /composite/graph support
        const uow: UnitOfWork = new UnitOfWork(connectionConfig228, NO_OP_LOGGER);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig228.apiVersion + '/composite/graph/')
            .reply(HttpCodes.OK, {
                graphs: [
                    {
                        graphId: 'graphId1abc',
                        isSuccessful: true,
                        graphResponse: {
                            compositeResponse:
                                [{
                                    'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                                    'httpHeaders': { 'Location': `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG4jAAG` },
                                    'httpStatusCode': httpCodeCreated,
                                    'referenceId': account.referenceId
                                }]
                        }
                    }
                ]
            });

        uow.registerNew(account);
        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.equal('001xx000003EG4jAAG');
    });

    it('Graph Insert Account Err w/Missing Required Property', async () => {
        const nowHex = new Date().getTime().toString(16);
        const a1 = new SObject('Account')
            .withValue('Name', 'MyAccount - uowErr - integration ' + nowHex);
        const a2 = new SObject('Account')
            .withValue('XName', 'MyAccount - uowErr - integration ' + nowHex);

        // release 228 and above w/API version 50.0+ have /composite/graph support
        const uow: UnitOfWork = new UnitOfWork(connectionConfig228, NO_OP_LOGGER)
            .registerNew(a1)
            .registerNew(a2);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig228.apiVersion + '/composite/graph/')
            .reply(HttpCodes.OK, {
                "graphs": [{
                    "graphId": "2cce375a-a611-47a5-a18d-a35048840d5c",
                    "graphResponse": {
                      "compositeResponse": [{
                          // Unfortunately on current 228 release, we do not get PROCESSING_HALTED error code
                          // like standard composite endpoint so we cannot identify that the *2nd* object 
                          // was the root cause.  In this test we can only identify root cause as first-failed
                          "body": [{
                              "message": "No such column XName on sobject of type Account",
                              "errorCode": "INVALID_FIELD"
                          }],
                          "httpHeaders": {},
                          "httpStatusCode": 400,
                          "referenceId": a1.referenceId
                        }, {
                          "body": [{
                              "message": "No such column XName on sobject of type Account",
                              "errorCode": "INVALID_FIELD"
                            }],
                          "httpHeaders": {},
                          "httpStatusCode": 400,
                          "referenceId": a2.referenceId
                      }]
                    },
                    "isSuccessful": false
                }]
            });

        const uowErr: UnitOfWorkError = await uow.commit()
            .then(unexpectedSuccess => {
                fail('Got a successfult response, was expecting an error! ' + unexpectedSuccess);
                throw Error('Should never get here');
            })
            .catch(err => {
                return err as UnitOfWorkError;
            });
        expect(uowErr).to.exist;

        expect(uowErr.message).to.exist;
        expect(uowErr.rootCause).to.exist;
        expect(uowErr.httpStatus).to.equal(400);
        expect(uowErr.rootCause.isSuccess).to.be.false;
        expect(uowErr.rootCause.errors).to.exist;
        expect(uowErr.rootCause.errors).lengthOf(1);
        const acctErr = uowErr.rootCause.errors[0];
        expect(acctErr.message).to.equal("No such column XName on sobject of type Account");
        expect(acctErr.errorCode).to.equal('INVALID_FIELD');
        expect(uowErr.rootCause.method).to.equal(Method.POST);
        expect(uowErr.rootCause.id).to.not.exist;                // object *not* inserted so no `id` defined
    });

    it('Update Existing Account', async () => {
        const account: SObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': httpCodeNoContent,
                    'referenceId': mockedReferenceId
                }]
            });

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.errors).to.not.exist;
        expect(uowResult.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = 'MyAccount - uow - integration - ' + new Date();
        const newName = 'Updated ' + originalName;
        const account: SObject = new SObject('Account');
        account.setValue('Name', originalName);

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [
                    {
                        'body': { 'id': '001xx000003EG6oAAG', 'success': true, 'errors': [] },
                        'httpHeaders': { 'Location': `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG6oAAG` },
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

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: UnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: UnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        const account: SObject = new SObject('Account').withId('001xx000003EG4jAAG').named('New Account Name');

        let mockedReferenceId: string;

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            mockedReferenceId = type + '_' + uuid().replace(/-/g, '');
            return mockedReferenceId;
        });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);
        uow.registerDeleted(account);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': null,
                    'httpHeaders': {},
                    'httpStatusCode': httpCodeNoContent,
                    'referenceId': mockedReferenceId
                }]
            }
            );

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Unit Insert Account, Contact, and PlatformEvent', async () => {
        const mockedReferenceIds: string[] = [];

        stub(SObject, 'generateReferenceId').callsFake((type: string) => {
            const mockedReferenceId:string = type + '_' + uuid().replace(/-/g, '');
            mockedReferenceIds.push(mockedReferenceId);
            return mockedReferenceId;
        });

        const account: SObject = new SObject('Account');
        account.setValue('Name', `MyAccount - uow - integration - ${new Date()}`);

        const contact: SObject = new SObject('Contact');
        contact.setValue('LastName', `LastName - ${new Date()}`);
        contact.setValue('AccountId', account.fkId);

        const event = new PlatformEvent('SomethingHappened');
        event.setValue('Value', `Value - ${new Date()}`);

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);
        uow.registerNew(account);
        uow.registerNew(contact);
        uow.registerNew(event);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                'compositeResponse': [{
                    'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                    'httpHeaders': { 'Location': `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/003xx000003EG4jAAG` },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[0]
                },
                {
                    'body': { 'id': '003xx000003EG4jAAG', 'success': true, 'errors': [] },
                    'httpHeaders': { 'Location': `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Contact/003xx000003EG4jAAG` },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[1]
                },
                {
                    'body': { 'id': 'e01xx0000000001AAA', 'success': true,
                        'errors': [ {
                            'statusCode': 'OPERATION_ENQUEUED',
                            'message': '85d962fb-f05c-4ccf-9ee1-ac751d0fc07f',
                            'fields': [ ]
                        } ]
                    },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[2]
                  }]
            }
            );

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;

        const accountResults: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(accountResults).to.exist;
        expect(accountResults).lengthOf(1);
        const uowResultAccount: UnitOfWorkResult = accountResults[0];
        expect(uowResultAccount.isSuccess).to.be.true;
        expect(uowResultAccount.method).to.equal(Method.POST);
        expect(uowResultAccount.id).to.exist;
        expect(uowResultAccount.id).to.match(/^001[A-Za-z0-9]{15}/);

        const contactResults: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(contact);
        expect(contactResults).to.exist;
        expect(contactResults).lengthOf(1);
        const uowResultContact: UnitOfWorkResult = contactResults[0];
        expect(uowResultContact.isSuccess).to.be.true;
        expect(uowResultContact.method).to.equal(Method.POST);
        expect(uowResultContact.id).to.exist;
        expect(uowResultContact.id).to.match(/^003[A-Za-z0-9]{15}/);

        const eventResults: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(event);
        expect(eventResults).to.exist;
        expect(eventResults).lengthOf(1);
        const uowResultEvent: UnitOfWorkResult = eventResults[0];
        expect(uowResultEvent.isSuccess).to.be.true;
        expect(uowResultEvent.method).to.equal(Method.POST);
        expect(uowResultEvent.id).to.exist;
        expect(uowResultEvent.id).to.match(/^e01[A-Za-z0-9]{15}/);
    });
});
