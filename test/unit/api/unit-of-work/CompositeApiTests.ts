/* eslint-disable @typescript-eslint/no-explicit-any */
/* tslint:disable: no-unused-expression */
import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { HttpCodes } from 'typed-rest-client/HttpClient';
import { Logger } from '@salesforce/core';

const httpCodeCreated = 201;

import {CompositeGraphResponse, ConnectionConfig, Constants, Error as ApiError} from '../../../../src';
import {
    CompositeApi,
    CompositeResponse,
    CompositeSubresponse,
    GraphResponse,
} from '../../../../src/api/unit-of-work/CompositeApi';
import { CompositeRequest } from '../../../../src/api/unit-of-work/CompositeRequest';
import { CompositeSubrequest, InsertCompositeSubrequestBuilder } from '../../../../src/api/unit-of-work/CompositeSubrequest';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});

describe('CompositeApi Tests', () => {

    const instanceUrl = 'http://localhost:3000';
    const apiVersion = Constants.CURRENT_API_VERSION;
    const accessToken = 'accessToken1234';
    const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

    function getSuccessfulGraphResponse(refId: string): any {
        return {
            graphs: [
                {
                    graphId: 'graphId1abc',
                    isSuccessful: true,
                    graphResponse: {
                        compositeResponse: [
                            {
                                body: {id: '001xx000003EG3oAAG', success: true, errors: []},
                                httpHeaders: {Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG`},
                                httpStatusCode: httpCodeCreated,
                                referenceId: refId,
                            },
                        ],
                    }
                }
            ]
        };
    }

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
        expect(capturedCompositeRequest).to.not.have.property('graphId');

        const compositeRequestObj: object = JSON.parse(JSON.stringify(compositeRequest));

        //after removing graphId property, it should deep equal to the body,
        //as the code stringify filtered out graphId for composite api call
        delete compositeRequestObj['graphId'];
        expect(capturedCompositeRequest).to.deep.equal(compositeRequestObj);
    });

    it('Graph Composite Requests are passed through as body', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        let capturedGraphRequest: any;

        nock(instanceUrl)
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/graph/`, function(body: any) {
                capturedGraphRequest = body;
                return true;
            })
            .reply(HttpCodes.OK, {});

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        await compositeApi.invokeGraph([compositeRequest]);

        expect(capturedGraphRequest).to.exist;
        expect(capturedGraphRequest).to.have.property('graphs');

        const capturedCompositeRequests: CompositeRequest[] = capturedGraphRequest.graphs;
        expect(capturedCompositeRequests).to.exist;
        expect(capturedCompositeRequests).lengthOf(1);

        const compositeRequestObj: object = JSON.parse(JSON.stringify(compositeRequest));
        expect(capturedCompositeRequests[0]).to.deep.equal(compositeRequestObj);
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
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

    it('Graph Composite Api passes through session id', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        let capturedAuthorizationHeader: string;

        nock(instanceUrl, {
            reqheaders: {
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                Authorization(headerValue) {
                    capturedAuthorizationHeader = headerValue;
                    return true;
                },
            },
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/graph/`)
            .reply(HttpCodes.OK, {});

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        await compositeApi.invokeGraph([compositeRequest]);

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
                        httpHeaders: { Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG` },
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

    it('Graph Composite Api Correctly Parses response', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/graph/`)
            .reply(HttpCodes.OK, getSuccessfulGraphResponse(compositeSubRequest.referenceId));

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeGraphResponse: CompositeGraphResponse = await compositeApi.invokeGraph([compositeRequest]);

        expect(compositeGraphResponse).to.exist;

        expect(compositeGraphResponse.graphResponses).to.exist;

        expect(compositeGraphResponse.graphResponses).lengthOf(1);

        const graphResponse: GraphResponse = compositeGraphResponse.graphResponses[0];
        expect(graphResponse).to.exist;
        expect(graphResponse.isSuccessful).to.be.true;
        expect(graphResponse.graphId).to.equal('graphId1abc');

        const compositeResponse: CompositeResponse = graphResponse.compositeResponse;
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
                        httpHeaders: { Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG` },
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
        expect(headers.Location).to.equal(`/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG`);
        expect(compositeSubResponse.location).to.exist;
        expect(compositeSubResponse.location).to.equal(`/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG`);
    });

    it('Graph Composite Api Correctly Parses response headers', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/graph/`)
            .reply(HttpCodes.OK, getSuccessfulGraphResponse(compositeSubRequest.referenceId));

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeGraphResponse: CompositeGraphResponse = await compositeApi.invokeGraph([compositeRequest]);

        const compositeResponse: CompositeResponse = compositeGraphResponse.graphResponses[0].compositeResponse;
        const compositeSubResponse: CompositeSubresponse = compositeResponse.getCompositeSubresponse(
            compositeSubRequest,
        );

        // Verify Location as header and helper
        const headers: { [key: string]: string } = compositeSubResponse.httpHeaders;
        expect(headers).to.exist;
        expect(Object.keys(headers)).lengthOf(1);
        expect(headers.Location).to.equal(`/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG`);
        expect(compositeSubResponse.location).to.exist;
        expect(compositeSubResponse.location).to.equal(`/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG`);
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
                        httpHeaders: { Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG` },
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

    it('Graph Composite Api Correctly Parses response body', async () => {
        const compositeRequest: CompositeRequest = new CompositeRequest();
        const compositeSubRequest: CompositeSubrequest = new InsertCompositeSubrequestBuilder()
            .sObjectType('Account')
            .named('MyAccount ' + new Date())
            .build();
        compositeRequest.addSubrequest(compositeSubRequest);

        nock(instanceUrl, {
            reqheaders: {},
        })
            .post(`/services/data/v${connectionConfig.apiVersion}/composite/graph/`)
            .reply(HttpCodes.OK, getSuccessfulGraphResponse(compositeSubRequest.referenceId));

        const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
        const compositeGraphResponse: CompositeGraphResponse = await compositeApi.invokeGraph([compositeRequest]);
        const compositeResponse: CompositeResponse = compositeGraphResponse.graphResponses[0].compositeResponse;
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
                        httpHeaders: { Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG` },
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
        const errors: ReadonlyArray<ApiError> = compositeSubResponse.errors;
        expect(errors).to.exist;
        expect(errors).lengthOf(1);
        const error: ApiError = errors[0];
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
                        httpHeaders: { Location: `/services/data/v${Constants.CURRENT_API_VERSION}/sobjects/Account/001xx000003EG3oAAG` },
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
