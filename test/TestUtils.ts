/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import * as sdk from '../lib';

const httpCodeCreated:number = 201;

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(connectionConfig: sdk.IConnectionConfig): Promise<IInsertResponse> {
    const accountName: string = `Account ${new Date()}`;
    const compositeApi: sdk.ICompositeApi = sdk.CompositeApi.newCompositeApi(connectionConfig);
    const compositeRequest: sdk.ICompositeRequest = sdk.CompositeApi.newCompositeRequest();
    const compositeSubRequest: sdk.ICompositeSubrequest =
    sdk.CompositeApi.insertBuilder().sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: sdk.ICompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: sdk.ICompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(httpCodeCreated);

    const accountId: string = compositeSubresponse.id;

    return { id: accountId, name: accountName } as IInsertResponse;
}

export class FakeFunction {

    public initParams: any;
    public invokeParams: any;
    public errors: string[];

    constructor(public sandbox: sinon.SinonSandbox, private doFxInvocation: boolean = false) {
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

        if (this.doFxInvocation) {
            context.fxInvocation.response = '{}';
            context.fxInvocation.save();
        }

        return Promise.resolve(null);
    }
};
