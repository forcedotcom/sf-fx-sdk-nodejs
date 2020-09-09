/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import { Logger } from '@salesforce/core';

import { APIVersion, ConnectionConfig } from '../src';
import { CompositeRequest } from '../src/api/unit-of-work/CompositeRequest';
import { CompositeSubrequest, InsertCompositeSubrequestBuilder } from '../src/api/unit-of-work/CompositeSubrequest';
import { CompositeApi, CompositeResponse, CompositeSubresponse } from '../src/api/unit-of-work/CompositeApi';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});

const apiVersion = APIVersion.V50.toString();
const httpCodeCreated = 201;

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(connectionConfig: ConnectionConfig): Promise<IInsertResponse> {
    const accountName = `Account ${new Date()}`;
    const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
    const compositeRequest: CompositeRequest = new CompositeRequest();
    const compositeSubRequest: CompositeSubrequest =
    (new InsertCompositeSubrequestBuilder(apiVersion)).sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: CompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(httpCodeCreated);

    const accountId: string = compositeSubresponse.id;

    return { id: accountId, name: accountName } as IInsertResponse;
}

