/* tslint:disable: no-unused-expression */
import { assert, expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import * as request from 'request-promise-native';

use(chaiAsPromised);

import { Context, applySfFxMiddleware, UserContext } from '../../../lib';
import * as testUtils from '../../TestUtils';
import { generateData } from './functionUtils';

interface PdfEvent {
    html?: string,
    url?:  string,
    isLightning?: boolean,
    pdf?: {
        printBackground?: boolean
        displayHeaderFooter?: boolean
    },
    browser?: {
        headless?: boolean, /* allow for testing purposes */
    }
}

const generateCloudevent = (data: any): any => {
    return {
        id: '00Dxx0000006GY7-4SROyqmXwNJ3M40_wnZB1k',
        contentType: 'application/json',
        type: 'com.salesforce.function.invoke',
        schemaURL: null,
        source: 'urn:event:from:salesforce/xx/224.0/00Dxx0000006GY7/InvokeFunctionController/9mdxx00000004ov',
        time: '2019-11-14T18:13:45.627813Z',
        specVersion: '0.2',
        data
      }
}

//   T E S T S

describe('Invoke Function Tests', () => {

    // Function params
    let data: any;
    let cloudevent: any;

    let sandbox: sinon.SinonSandbox;
    let mockRequestPost;

    const newFakeFx = (doFxInvocation: boolean = false): testUtils.FakeFunction => {
        return new testUtils.FakeFunction(sandbox, doFxInvocation);
    };

    const postInvokeAsserts = (fakeFx: testUtils.FakeFunction): void => {
        assert(fakeFx.errors.length === 0, fakeFx.errors.join());
        assert(fakeFx.invokeParams.context && fakeFx.invokeParams.event);
        assert(fakeFx.invokeParams.context instanceof Context);
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        data = generateData(true);
        cloudevent = generateCloudevent(data);

        // Request
        mockRequestPost = sandbox.stub(request, 'post');
        mockRequestPost.resolves(Promise.resolve({}));
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('middleware should setup event and context objects', async () => {
        // data generated above
        expect(data.context).to.exist;
        expect(data.payload).to.exist;
        expect(data.sfContext).to.exist;

        // cloudevent generated above
        const transformedParams = applySfFxMiddleware(cloudevent, {});
        expect(transformedParams).to.exist;

        const event = transformedParams.event;
        expect(event).to.exist;
        expect(event.url).to.exist;
        expect(event.sfContext).to.not.exist;

        const context = transformedParams.context;
        expect(context).to.exist;
        expect(context.userContext).to.exist;
        expect(context.payloadVersion).to.exist;
        expect(context.logger).to.exist;
        expect(context.forceApi).to.exist;
        expect(context.unitOfWork).to.exist;
        expect(context.fxInvocation).to.exist;
    });

    it('should invoke function', async () => {
        const transformedParams = applySfFxMiddleware(cloudevent, {});
        const event = transformedParams.event;
        const context = transformedParams.context;

        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.invoke(event, context);

        // Validate
        postInvokeAsserts(fakeFx);
        const paramContext: Context = fakeFx.invokeParams.context;

        expect(context.fxInvocation.id).to.equal(paramContext.fxInvocation.id);
        const userContext: UserContext = fakeFx.invokeParams.context.userContext;
        expect(context.userContext.orgId).to.equal(userContext.orgId);
        return Promise.resolve(null);
    });

    it('should have payload', async () => {
        const transformedParams = applySfFxMiddleware(cloudevent, {});
        const event = transformedParams.event;
        const context = transformedParams.context;

        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.invoke(event, context);

        // Validate
        postInvokeAsserts(fakeFx);
        // Validate Cloudevent instance payload;
        const pdfPayload: PdfEvent = fakeFx.invokeParams.event;
        expect(event.url).to.equal(pdfPayload.url);

        return Promise.resolve(null);
    });

    it('should handle FunctionInvocation', async () => {
        const transformedParams = applySfFxMiddleware(cloudevent, {});
        const event = transformedParams.event;
        const context = transformedParams.context;

        const updateStub = sandbox.stub(context.forceApi, 'update');
        updateStub.callsFake((): Promise<any> => {
            return Promise.resolve({ success: true });
        });

        const queryStub = sandbox.stub(context.forceApi, 'query');

        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx(true);
        await fakeFx.invoke(event, context);

        sandbox.assert.calledOnce(queryStub);
        sandbox.assert.calledOnce(updateStub);
        const updatedFunctionInvocationRequest = updateStub.getCall(0).args[0];
        expect(updatedFunctionInvocationRequest).to.be.not.undefined;
        expect(updatedFunctionInvocationRequest).to.be.not.null;
        expect(updatedFunctionInvocationRequest).has.property('referenceId');
        expect(updatedFunctionInvocationRequest).has.property('sObjectType');
        expect(updatedFunctionInvocationRequest.sObjectType).to.eql('FunctionInvocationRequest');
        expect(updatedFunctionInvocationRequest).has.property('values');
        const values = updatedFunctionInvocationRequest.values;
        expect(values).to.be.not.undefined;
        expect(values).to.be.not.null;
        expect(values.ResponseBody).to.be.not.undefined;
        expect(values.ResponseBody).to.be.not.null;

        return Promise.resolve(null);
    });
});