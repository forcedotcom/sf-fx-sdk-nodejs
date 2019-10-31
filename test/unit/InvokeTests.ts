/* tslint:disable: no-unused-expression */
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import * as request from 'request-promise-native';

chai.use(chaiAsPromised);

import * as sdk from '../../lib';
import * as testUtils from '../TestUtils';

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

const generateData = (setAccessToken: boolean): any => {
    const userContext: sdk.UserContext = {
        orgDomainUrl:'http://sffx-dev-ed.localhost.internal.salesforce.com:6109',
        orgId:'00Dxx0000006GoF',
        salesforceBaseUrl:'http://sffx-dev-ed.localhost.internal.salesforce.com:6109',
        userId:'005xx000001X7dl',
        username:'chris@sffx.org'
    }

    if (setAccessToken) {
        userContext.accessToken = `${userContext.orgId}!sdfssfdss`;
    } else {
        userContext.c2cJWT = 'JWTHERE';
    }

    return {
        context:{
            apiVersion:'46.0',
            functionInvocationId:'9mdxx00000000Mb',
            userContext
        },
        functionName:'salesforce.pdf_creator_function_invoke__e',
        id:'00Dxx0000006GoF-0cXxx000000000H',
        payload:{
            html:null,
            isLightning:false,
            url:'https://sffx-dev-ed.localhost.internal.salesforce.com/apex/MyPdfPage'
        },
        payloadVersion:'224.9'
    };
}

const dataWithAccessToken = generateData(true);
const dataWithJWT = generateData(false);

const cloudeventJson = {
    comexampleextension1 : 'value',
    comexampleextension2 : {
        othervalue: 5
    },
    contenttype : 'application/json',
    data : dataWithAccessToken,
    id : 'A234-1234-1234',
    source : 'https://github.com/cloudevents/spec/pull',
    specversion : '0.2',
    subject : '123',
    time : '2018-04-05T17:31:00Z',
    type : 'com.github.pull.create',
};

const cloudEvent: sdk.SfCloudevent = new sdk.SfCloudevent();
        cloudEvent
            .type('com.salesforce.functions.pdf.create')
            .source(`urn:event:from:salesforce/functionevent/${dataWithAccessToken.context.userContext.orgId}/${dataWithAccessToken.payloadVersion}`)
            .data(dataWithAccessToken);
cloudEvent.check();

//   T E S T S

describe('Invoke Function Tests', () => {

    // Function params
    let config: sdk.Config;
    let logger: sdk.Logger;
    let context: sdk.Context;

    let sandbox: sinon.SinonSandbox;
    let mockRequestPost;

    const newFakeFx = (doFxInvocation: boolean = false): testUtils.FakeFunction => {
        return new testUtils.FakeFunction(sandbox, doFxInvocation);
    };

    const postInvokeAsserts = (fakeFx: testUtils.FakeFunction): void => {
        chai.assert(fakeFx.errors.length === 0, fakeFx.errors.join());
        chai.assert(fakeFx.initParams != null && fakeFx.initParams.config != null
            && fakeFx.initParams.logger != null);
        chai.assert(fakeFx.initParams.config instanceof sdk.Config);
        chai.assert(fakeFx.invokeParams != null && fakeFx.invokeParams.context
            && fakeFx.invokeParams.event);
        chai.assert(fakeFx.invokeParams.context instanceof sdk.Context);
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Function params
        config = new sdk.Config();
        logger = sdk.Logger.create(false);
        context = sdk.Context.create(cloudEvent.getData(), logger);

        // Request
        mockRequestPost = sandbox.stub(request, 'post');
        mockRequestPost.resolves(Promise.resolve({}));
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should invoke function', async () => {
        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.init(config, logger);
        await fakeFx.invoke(context, cloudEvent);

        // Validate
        postInvokeAsserts(fakeFx);
        const paramContext: sdk.Context = fakeFx.invokeParams.context;
        chai.expect(dataWithAccessToken.context.functionInvocationId).to.equal(paramContext.fxInvocation.id);
        const userContext: sdk.UserContext = fakeFx.invokeParams.context.userContext;
        chai.expect(dataWithAccessToken.context.userContext.orgId).to.equal(userContext.orgId);
        return Promise.resolve(null);
    });

    it('should create Cloudevent', async () => {
        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.init(config, logger);
        await fakeFx.invoke(context, cloudEvent);

        // Validate
        postInvokeAsserts(fakeFx);
        // Validate Cloudevent instance was created and passed to function
        chai.expect(cloudEvent.getData().payload).to.equal(dataWithAccessToken.payload);
        chai.expect(cloudEvent.getData().payloadVersion).to.equal(dataWithAccessToken.payloadVersion);
        chai.assert(fakeFx.invokeParams.event instanceof sdk.SfCloudevent);
        const sfEvent: sdk.SfCloudevent = fakeFx.invokeParams.event;
        chai.expect(cloudEvent.getType()).to.equal(sfEvent.getType());
        chai.expect(cloudEvent.getSource()).to.equal(sfEvent.getSource());
        chai.expect(sfEvent.getExtensions()).to.be.empty;
        chai.expect(sfEvent.getId()).to.not.be.null;
        chai.expect(sfEvent.getSpecversion()).to.be.equal('0.2');
        chai.expect(sfEvent.getPayloadVersion()).to.be.equal(dataWithAccessToken.payloadVersion);
        return Promise.resolve(null);
    });

    it('should create Cloudevent (JSON)', async () => {
        // Create and invoke function
        const cloudEvent: sdk.SfCloudevent = new sdk.SfCloudevent(cloudeventJson);
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.init(config, logger);
        await fakeFx.invoke(context, cloudEvent);

        // Validate Cloudevent instance was created with JSON and passed to function
        postInvokeAsserts(fakeFx);
        chai.assert(fakeFx.invokeParams.event instanceof sdk.SfCloudevent);
        const sfEvent: sdk.SfCloudevent = fakeFx.invokeParams.event;
        chai.expect(cloudeventJson.type).to.equal(sfEvent.getType());
        chai.expect(cloudeventJson.source).to.equal(sfEvent.getSource());
        chai.expect(cloudeventJson.time).to.equal(sfEvent.getTime());
        chai.expect(cloudeventJson.specversion).to.equal(sfEvent.getSpecversion());
        chai.expect(cloudeventJson.contenttype).to.equal(sfEvent.getContenttype());
        chai.expect(sfEvent.getExtensions()).to.be.empty;
        return Promise.resolve(null);
    });

    it('should FAIL to create Cloudevent', async () => {
        // Setup fx and invoke
        // Required type not provided
        const noDataCloudeventJson = {
            comexampleextension1 : 'value',
            comexampleextension2 : {
                othervalue: 5
            },
            contenttype : 'application/json',
            data : {},
            id : 'A234-1234-1234',
            source : 'https://github.com/cloudevents/spec/pull',
            specversion : '0.2',
            subject : '123',
            time : '2018-04-05T17:31:00Z'
        };
        const cloudEvent: sdk.SfCloudevent = new sdk.SfCloudevent(noDataCloudeventJson);
        try {
            cloudEvent.check();
            chai.expect.fail();
        } catch (err) {
            chai.expect(err.message).to.eq('invalid payload');
        }

        return Promise.resolve(null);
    });

    it('should have payload', async () => {
        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx();
        await fakeFx.init(config, logger);
        await fakeFx.invoke(context, cloudEvent);

        // Validate
        postInvokeAsserts(fakeFx);
        // Validate Cloudevent instance payload
        const sfEvent: sdk.SfCloudevent = fakeFx.invokeParams.event;
        const pdfPayload: PdfEvent = sfEvent.getPayload();
        chai.expect(dataWithAccessToken.payload.url).to.equal(pdfPayload.url);

        return Promise.resolve(null);
    });

    it('should FAIL to create sdk.Context', async () => {
        // Setup fx and invoke
        // Data is empty; should have data.context
        const noDataCloudeventJson = {
            comexampleextension1 : 'value',
            comexampleextension2 : {
                othervalue: 5
            },
            contenttype : 'application/json',
            data : {},
            id : 'A234-1234-1234',
            source : 'https://github.com/cloudevents/spec/pull',
            specversion : '0.2',
            subject : '123',
            time : '2018-04-05T17:31:00Z',
            type : 'com.github.pull.create',
        };
        const cloudEvent: sdk.SfCloudevent = new sdk.SfCloudevent(noDataCloudeventJson);
        try {
            sdk.Context.create(cloudEvent.getData(), logger)
            chai.expect.fail();
        } catch (err) {
            chai.expect(err.message).to.contain('Context not provided');
        }

        return Promise.resolve(null);
    });

    it('should handle FunctionInvocation with acccessToken', async () => {
        const updateStub = sandbox.stub(context.forceApi, 'update');
        updateStub.callsFake((): Promise<any> => {
            return Promise.resolve({ success: true });
        });

        const queryStub = sandbox.stub(context.forceApi, 'query');

        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx(true);
        await fakeFx.init(config, logger);
        await fakeFx.invoke(context, cloudEvent);

        sandbox.assert.calledOnce(queryStub);
        sandbox.assert.calledOnce(updateStub);
        const updatedFunctionInvocationRequest = updateStub.getCall(0).args[0];
        chai.expect(updatedFunctionInvocationRequest).to.be.not.undefined;
        chai.expect(updatedFunctionInvocationRequest).to.be.not.null;
        chai.expect(updatedFunctionInvocationRequest).has.property('referenceId');
        chai.expect(updatedFunctionInvocationRequest).has.property('sObjectType');
        chai.expect(updatedFunctionInvocationRequest.sObjectType).to.eql('FunctionInvocationRequest');
        chai.expect(updatedFunctionInvocationRequest).has.property('values');
        const values = updatedFunctionInvocationRequest.values;
        chai.expect(values).to.be.not.undefined;
        chai.expect(values).to.be.not.null;
        chai.expect(values.ResponseBody).to.be.not.undefined;
        chai.expect(values.ResponseBody).to.be.not.null;

        return Promise.resolve(null);
    });

    it('should handle FunctionInvocation with JWT', async () => {
        // Setup fx w/ JWT payload and invoke
        const cloudEventWithJWT: sdk.SfCloudevent = new sdk.SfCloudevent();
        cloudEventWithJWT
            .type('com.salesforce.functions.pdf.create')
            .source(`urn:event:from:salesforce/functionevent/${dataWithJWT.context.userContext.orgId}/${dataWithJWT.payloadVersion}`)
            .data(dataWithJWT);
        cloudEventWithJWT.check();
        const contextWithJWT = sdk.Context.create(cloudEventWithJWT.getData(), logger);

        const postStub = sandbox.stub(sdk.FunctionInvocationRequest.prototype, 'post');

        // Create and invoke function
        const fakeFx: testUtils.FakeFunction = newFakeFx(true);
        await fakeFx.init(config, logger);
        await fakeFx.invoke(contextWithJWT, cloudEventWithJWT);

        sandbox.assert.calledOnce(postStub);
        const postedFunctionInvocationRequest = postStub.getCall(0).args[0];
        chai.expect(postedFunctionInvocationRequest).to.be.not.undefined;
        chai.expect(postedFunctionInvocationRequest).to.be.not.null;
        chai.expect(postedFunctionInvocationRequest).has.property('form');
        const form = postedFunctionInvocationRequest.form;
        chai.expect(form).has.property('userContext');
        chai.expect(form.userContext).to.be.not.undefined;
        chai.expect(form.userContext).to.be.not.null;

        return Promise.resolve(null);
    });
});