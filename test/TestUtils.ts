/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { CompositeApi, sdk } from '../lib';
import { ICompositeApi, ICompositeRequest, ICompositeResponse, ICompositeSubrequest, ICompositeSubresponse, IConnectionConfig } from '../lib/Interfaces';

const httpCodeCreated:number = 201;

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(connectionConfig: IConnectionConfig): Promise<IInsertResponse> {
    const accountName: string = `Account ${new Date()}`;
    const compositeApi: ICompositeApi = CompositeApi.newCompositeApi(connectionConfig);
    const compositeRequest: ICompositeRequest = CompositeApi.newCompositeRequest();
    const compositeSubRequest: ICompositeSubrequest =
    CompositeApi.insertBuilder().sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: ICompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: ICompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(httpCodeCreated);

    const accountId: string = compositeSubresponse.id;

    return { id: accountId, name: accountName } as IInsertResponse;
}

export class FakeFunction implements sdk.SfFunction {

    public initParams: any;
    public invokeParams: any;
    public errors: string[];

    constructor(public sandbox: sinon.SinonSandbox) {
        this.errors = [];
    }

    public getName() {
        return this.constructor.name;
    }

    public init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        this.initParams = { config, logger };
        this.sandbox.stub(logger, 'error').callsFake((message: string) => {
            this.errors.push(message);
        });
        return Promise.resolve(null);
    }

    public invoke(context: sdk.Context, event: sdk.SfCloudevent): Promise<any> {
        this.invokeParams = { context, event };
        return Promise.resolve(null);
    }
};