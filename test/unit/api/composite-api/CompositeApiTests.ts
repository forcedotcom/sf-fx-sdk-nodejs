/* tslint:disable: no-unused-expression */
import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { HttpCodes } from 'typed-rest-client/HttpClient';

const httpCodeCreated: number = 201;

import {
    CompositeApi,
    CompositeRequest,
    CompositeResponse,
    CompositeSubrequest,
    CompositeSubresponse,
    ConnectionConfig,
    Error,
    InsertCompositeSubrequestBuilder,
    NO_OP_LOGGER }
from '../../../../lib';

describe('CompositeApi Tests', () => {

    const instanceUrl: string = 'http://localhost:3000';
    const apiVersion: string = '45.0';
    const accessToken: string = 'accessToken1234';
    const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

    afterEach(() => {
        nock.cleanAll();
    });

    it('CompositeApi construction', () => {
        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);

        expect(compositeApi).to.exist;
    });

    it('Composite Request is passed through as body', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        let capturedCompositeRequest: CompositeRequest;

        nock(instanceUrl)
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`, function(body: any) {
                capturedCompositeRequest = body;
                return true;
            })
            .reply(HttpCodes.OK, {});

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        await compositeApi.invoke(compositeRequest);

        expect(capturedCompositeRequest).to.exist;
        const compositeRequestObj: object = JSON.parse(JSON.stringify(compositeRequest));
        expect(capturedCompositeRequest).to.deep.equal(compositeRequestObj);
    });

    it('Composite Api passes through session id', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        let capturedAuthorizationHeader: string;

        nock(instanceUrl, {
            reqheaders: {
                Authorization(headerValue) {
                    capturedAuthorizationHeader = headerValue;
                    return true;
                },
            },
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {});

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        await compositeApi.invoke(compositeRequest);

        expect(capturedAuthorizationHeader).to.exist;
        expect(capturedAuthorizationHeader).to.equal('Bearer ' + accessToken);
    });

    it('Composite Api Correctly Parses response', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: { id: '001xx000003EG3oAAG', success: true, errors: [] },
                        httpHeaders: { Location: '/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG' },
                        httpStatusCode: httpCodeCreated,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);

        expect(compositeResponse).to.exist;
        expect(compositeResponse.compositeSubresponses).to.exist;
        expect(compositeResponse.compositeSubresponses).lengthOf(1);

        const compositeSubResponseFromIndex: CompositeSubresponse = compositeResponse.compositeSubresponses[0];
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );
        expect(compositeSubResponseFromIndex).to.exist;
        expect(compositeSubResponse).to.exist;

        expect(compositeSubResponseFromIndex).to.deep.equal(compositeSubResponse);

        expect(compositeSubResponse.referenceId).to.equal(compositeSubRequest.referenceId);
        expect(compositeSubResponse.httpStatusCode).to.equal(httpCodeCreated);
    });

    it('Composite Api Correctly Parses response headers', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: { id: '001xx000003EG3oAAG', success: true, errors: [] },
                        httpHeaders: { Location: '/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG' },
                        httpStatusCode: httpCodeCreated,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        // Verify Location as header and helper
        const headers: { [key: string]: string } = compositeSubResponse.httpHeaders;
        expect(headers).to.exist;
        expect(Object.keys(headers)).lengthOf(1);
        expect(headers.Location).to.equal('/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG');
        expect(compositeSubResponse.location).to.exist;
        expect(compositeSubResponse.location).to.equal('/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG');
    });

    it('Composite Api Correctly Parses response body', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: { id: '001xx000003EG3oAAG', success: true, errors: [] },
                        httpHeaders: { Location: '/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG' },
                        httpStatusCode: httpCodeCreated,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        // Verify the body directly
        const body: { [key: string]: any } = compositeSubResponse.body;
        expect(body).to.exist;
        expect(body.id).to.equal('001xx000003EG3oAAG');
        expect(body.success).to.be.true;
        expect(body.errors).lengthOf(0);

        // Verify the helper methods
        expect(compositeSubResponse.id).to.equal('001xx000003EG3oAAG');
        expect(compositeSubResponse.isSuccess).to.be.true;
    });

    it('Composite Api throws exception if errors accessed on success', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: { id: '001xx000003EG3oAAG', success: true, errors: [] },
                        httpHeaders: { Location: '/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG' },
                        httpStatusCode: httpCodeCreated,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        try {
            compositeSubResponse.errors;
            fail('errors accessor should have thrown');
        } catch (e) {
            expect(e.message).to.equal(`Errors is not valid when there hasn't been an error. Call #errors installed.`);
        }
    });

    it('Composite Api Correctly Parses response body errors', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: [
                            {
                                message: 'Required fields are missing: [Name]',
                                errorCode: 'REQUIRED_FIELD_MISSING',
                                fields: ['Name'],
                            },
                        ],
                        httpHeaders: {},
                        httpStatusCode: HttpCodes.BadRequest,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        // Verify the body directly
        const errors: ReadonlyArray<Error> = compositeSubResponse.errors;
        expect(errors).to.exist;
        expect(errors).lengthOf(1);
        const error: Error = errors[0];
        expect(error).to.exist;
        expect(error.message).to.equal('Required fields are missing: [Name]');
        expect(error.errorCode).to.equal('REQUIRED_FIELD_MISSING');
        expect(error.fields).lengthOf(1);
        expect(error.fields[0]).to.equal('Name');
        expect(compositeSubResponse.isSuccess).to.be.false;
    });

    it('Composite Api throws exception if body accessed on errors', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: [
                            {
                                message: 'Required fields are missing: [Name]',
                                errorCode: 'REQUIRED_FIELD_MISSING',
                                fields: ['Name'],
                            },
                        ],
                        httpHeaders: {},
                        httpStatusCode: HttpCodes.BadRequest,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        expect(compositeSubResponse.body).to.not.exist;
    });

    it('Composite Response throws error if request id is not found', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/`)
            .reply(HttpCodes.OK, {
                compositeResponse: [
                    {
                        body: { id: '001xx000003EG3oAAG', success: true, errors: [] },
                        httpHeaders: { Location: '/services/data/v45.0/sobjects/Account/001xx000003EG3oAAG' },
                        httpStatusCode: httpCodeCreated,
                        referenceId: compositeSubRequest.referenceId,
                    },
                ],
            });

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);

        expect(compositeResponse).to.exist;

        const nonExistentCompositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        expect(
            compositeResponse.getCompositeSubresponse.bind(compositeResponse, nonExistentCompositeSubRequest),
        ).throws('Unknown referenceId: ' + nonExistentCompositeSubRequest.referenceId);
    });
});
