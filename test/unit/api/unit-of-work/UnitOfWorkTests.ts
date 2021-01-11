/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { assert, restore, stub } from 'sinon';
import { HttpCodes } from 'typed-rest-client/HttpClient';
import { v4 as uuid } from 'uuid';
import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig,
    Method,
    PlatformEvent,
    SObject,
    UnitOfWork,
    UnitOfWorkResponse,
    UnitOfWorkSuccessResponse,
    UnitOfWorkErrorResponse,
    UnitOfWorkResult
}
    from '../../../../src';
import { fail } from 'assert';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const instanceUrl = 'http://localhost:3000';
const apiVersion = '48.0';
const accessToken = 'accessToken1234';
const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);
const connectionConfigV50: ConnectionConfig = new ConnectionConfig(accessToken, APIVersion.V50, instanceUrl);

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
                        'httpHeaders': { 'Location': `/services/data/v${apiVersion}/sobjects/Account/001xx000003EG4jAAG` },
                        'httpStatusCode': httpCodeCreated,
                        'referenceId': account.referenceId
                    }]
            });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER);

        uow.registerNew(account);
        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;
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

    it('Insert Account Err Missing Required Property', async () => {
        const nowHex = new Date().getTime().toString(16);
        const a1 = new SObject('Account')
            .withValue('Name', 'MyAccount - uowErr - integration ' + nowHex);
        const a2 = new SObject('Account')
            .withValue('XName', 'MyAccount - uowErr - integration ' + nowHex);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfig.apiVersion + '/composite/')
            .reply(HttpCodes.OK, {
                  "compositeResponse": [{                        // Real response captured from v50.0 endpoint
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
                            "errorCode": "INVALID_FIELD"         // Real error/failure identified w/ its own ERROR_CODE
                        }],
                        "httpHeaders": {},
                        "httpStatusCode": 400,
                        "referenceId": a2.referenceId
                      }]
            });

        const uow: UnitOfWork = new UnitOfWork(connectionConfig, NO_OP_LOGGER)
            .registerNew(a1)
            .registerNew(a2);

        const uowResponse = await uow.commit();
        expect(uowResponse).to.exist;
        expect(uowResponse.success).to.be.false;

        // Type guard avoids need for explicit cast
        if (uowResponse instanceof UnitOfWorkErrorResponse) {
            const rootCause: UnitOfWorkResult = uowResponse.rootCause;
            expect(rootCause).to.exist;
            expect(rootCause.isSuccess).to.be.false;
            expect(rootCause.errors).to.exist;
            expect(rootCause.errors).lengthOf(1);
            const acctErr = rootCause.errors[0];
            expect(acctErr.message).to.equal('No such column XName on sobject of type Account');
            expect(acctErr.errorCode).to.equal('INVALID_FIELD');
            expect(rootCause.method).to.equal(Method.POST);
            expect(rootCause.id).to.not.exist;                       // object *not* inserted so no `id` defined

            const a1Result = uowResponse.getResults(a1);
            expect(Array.isArray(a1Result)).to.be.true;
            expect(a1Result).lengthOf(1);
            expect(rootCause).to.not.deep.equal(a1Result[0]);        // first result is *not* root cause
            expect(a1Result[0].isSuccess).to.be.false;
            expect(a1Result[0].errors).lengthOf(1);
            expect(a1Result[0].errors[0].message).to.equal("The transaction was rolled back since another operation in the same transaction failed.");
            expect(a1Result[0].errors[0].errorCode).to.equal('PROCESSING_HALTED');

            const a2Result = uowResponse.getResults(a2);
            expect(Array.isArray(a2Result)).to.be.true;
            expect(a2Result).lengthOf(1);
            expect(rootCause).to.deep.equal(a2Result[0]);            // 2nd result *is* root cause, props checked above
        } else {
            fail(`Unexpected UoW response type, expected UnitOfWorkErrorResponse, got: ${uowResponse.constructor.name}`);
        }
    });

    it('Graph Insert Account', async () => {
        const account: SObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        // release w/ API version 50.0+ have /composite/graph support
        const uow: UnitOfWork = new UnitOfWork(connectionConfigV50, NO_OP_LOGGER);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfigV50.apiVersion + '/composite/graph/')
            .reply(HttpCodes.OK, {
                graphs: [
                    {
                        graphId: 'graphId1abc',
                        isSuccessful: true,
                        graphResponse: {
                            compositeResponse:
                                [{
                                    'body': { 'id': '001xx000003EG4jAAG', 'success': true, 'errors': [] },
                                    'httpHeaders': { 'Location': `/services/data/v${apiVersion}/sobjects/Account/001xx000003EG4jAAG` },
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
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;
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

    it('Graph Insert Account Err Missing Required Property', async () => {
        const nowHex = new Date().getTime().toString(16);
        const a1 = new SObject('Account')
            .withValue('Name', 'MyAccount - uowErr - integration ' + nowHex);
        const a2 = new SObject('Account')
            .withValue('XName', 'MyAccount - uowErr - integration ' + nowHex);

        // release w/ API version 50.0+ have /composite/graph support
        const uow: UnitOfWork = new UnitOfWork(connectionConfigV50, NO_OP_LOGGER)
            .registerNew(a1)
            .registerNew(a2);

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfigV50.apiVersion + '/composite/graph/')
            .reply(HttpCodes.OK, {
                "graphs": [{
                    "graphId": "2cce375a-a611-47a5-a18d-a35048840d5c",
                    "graphResponse": {
                      "compositeResponse": [{
                          // Unfortunately on current v50.0 release, we do not get PROCESSING_HALTED error code
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

        const uowResponse = await uow.commit();
        expect(uowResponse).to.exist;
        expect(uowResponse.success).to.be.false;

        if (uowResponse instanceof UnitOfWorkErrorResponse) {
            const rootCause: UnitOfWorkResult = uowResponse.rootCause;
            expect(rootCause).to.exist;
            expect(rootCause.isSuccess).to.be.false;
            expect(rootCause.errors).to.exist;
            expect(rootCause.errors).lengthOf(1);
            const acctErr = rootCause.errors[0];
            expect(acctErr.message).to.equal("No such column XName on sobject of type Account");
            expect(acctErr.errorCode).to.equal('INVALID_FIELD');
            expect(rootCause.method).to.equal(Method.POST);
            expect(rootCause.id).to.not.exist;                     // object *not* inserted so no `id` defined

            const a1Result = uowResponse.getResults(a1);
            expect(Array.isArray(a1Result)).to.be.true;
            expect(a1Result).lengthOf(1);
            expect(rootCause).to.deep.equal(a1Result[0]);          // first result *is* root cause on graph endpoint

            const a2Result = uowResponse.getResults(a2);
            expect(Array.isArray(a2Result)).to.be.true;
            expect(a2Result).lengthOf(1);
            expect(a2Result[0].isSuccess).to.be.false;
            expect(a2Result[0].errors).lengthOf(1);
            expect(a2Result[0].errors[0].message).to.equal("No such column XName on sobject of type Account");
            expect(a2Result[0].errors[0].errorCode).to.equal('INVALID_FIELD');
        } else {
            fail(`Unexpected UoW response type, expected UnitOfWorkErrorResponse, got: ${uowResponse.constructor.name}`);
        }
    });

    it('Graph Exceeding Graph 500 Nodes imit', async () => {
        const nowHex = new Date().getTime().toString(16);
        const a1 = new SObject('Account')
            .withValue('Name', 'MyAccount - uowErr - integration ' + nowHex);
        const a2 = new SObject('Account')
            .withValue('XName', 'MyAccount - uowErr - integration ' + nowHex);

        // release w/ API version 50.0+ have /composite/graph support
        const uow: UnitOfWork = new UnitOfWork(connectionConfigV50, NO_OP_LOGGER)
                                    .registerNew(a1)
                                    .registerNew(a2);
        // for

        nock(instanceUrl)
            .post('/services/data/v' + connectionConfigV50.apiVersion + '/composite/graph/')
            .reply(HttpCodes.OK, {
                    "graphs": [{
                        "graphId": "_default",
                        "graphResponse": {
                          "compositeResponse": [{
                              "body": [
                                {
                                  "errorCode": "LIMIT_EXCEEDED",
                                  "message": "Limit of 500 reached for number of Nodes in the Graph"
                                }
                              ],
                              "httpHeaders": {},
                              "httpStatusCode": 400,
                              "referenceId": null
                            }]
                        },
                        "isSuccessful": false
                      }]
                  });

        const uowResponse = await uow.commit();
        expect(uowResponse).to.exist;
        expect(uowResponse.success).to.be.false;

        if (uowResponse instanceof UnitOfWorkErrorResponse) {
            const rootCause: UnitOfWorkResult = uowResponse.rootCause;
            expect(rootCause).to.exist;
            expect(rootCause.isSuccess).to.be.false;
            expect(rootCause.errors).to.exist;
            expect(rootCause.errors).lengthOf(1);
            const acctErr = rootCause.errors[0];
            expect(acctErr.message).to.equal("Limit of 500 reached for number of Nodes in the Graph");
            expect(acctErr.errorCode).to.equal('LIMIT_EXCEEDED');
            expect(rootCause.method).to.not.exist;
            expect(rootCause.id).to.not.exist;                     // object *not* inserted so no `id` defined

            const a1Result = uowResponse.getResults(a1);
            expect(Array.isArray(a1Result)).to.be.true;
            expect(a1Result).lengthOf(1);
            expect(rootCause).to.deep.equal(a1Result[0]);          // every sobject result *is* root cause on graph endpoint
            expect(a1Result[0].isSuccess).to.be.false;
            expect(a1Result[0].errors).lengthOf(1);   
            expect(a1Result[0].errors[0].message).to.equal("Limit of 500 reached for number of Nodes in the Graph");
            expect(a1Result[0].errors[0].errorCode).to.equal('LIMIT_EXCEEDED');
            expect(a1Result[0].method).to.not.exist;
            expect(a1Result[0].id).to.not.exist;

            try {
                uowResponse.getId(a1);
                assert.fail('It should have thrown Error indicating getId is not avaialbe');
            } catch (err) {
                expect(err.message).to.contain('No Id is availalbe because of rootCause');
                expect(err.message).to.contain('Limit of 500 reached for number of Nodes in the Graph');
            }

            const a2Result = uowResponse.getResults(a2);
            expect(Array.isArray(a2Result)).to.be.true;
            expect(a2Result).lengthOf(1);
            expect(rootCause).to.deep.equal(a2Result[0]);
            expect(a2Result[0].isSuccess).to.be.false;
            expect(a2Result[0].errors).lengthOf(1);
            expect(a2Result[0].errors[0].message).to.equal("Limit of 500 reached for number of Nodes in the Graph");
            expect(a2Result[0].errors[0].errorCode).to.equal('LIMIT_EXCEEDED');
            expect(a2Result[0].method).to.not.exist;
            expect(a2Result[0].id).to.not.exist;

            try {
                uowResponse.getId(a2);
                assert.fail('It should have thrown Error indicating getId is not avaialbe');
            } catch (err) {
                expect(err.message).to.contain('No Id is availalbe because of rootCause');
                expect(err.message).to.contain('Limit of 500 reached for number of Nodes in the Graph');
            }            
        } else {
            fail(`Unexpected UoW response type, expected UnitOfWorkErrorResponse, got: ${uowResponse.constructor.name}`);
        }
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
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;
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
                        'httpHeaders': { 'Location': `/services/data/v${apiVersion}/sobjects/Account/001xx000003EG6oAAG` },
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
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;
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
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;
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
                    'httpHeaders': { 'Location': `/services/data/v${apiVersion}/sobjects/Account/003xx000003EG4jAAG` },
                    'httpStatusCode': httpCodeCreated,
                    'referenceId': mockedReferenceIds[0]
                },
                {
                    'body': { 'id': '003xx000003EG4jAAG', 'success': true, 'errors': [] },
                    'httpHeaders': { 'Location': `/services/data/v${apiVersion}/sobjects/Contact/003xx000003EG4jAAG` },
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
        expect(uowResponse.success).to.be.true;
        expect(uowResponse instanceof UnitOfWorkSuccessResponse).to.be.true;

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
