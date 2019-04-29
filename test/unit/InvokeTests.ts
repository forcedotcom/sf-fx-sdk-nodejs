/* tslint:disable: no-unused-expression */
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';

chai.use(chaiAsPromised);

import { invoke, sdk } from '../../lib';
import * as testUtils from '../TestUtils';

const sandbox = sinon.createSandbox();


describe('Invoke Function Tests', () => {

    afterEach(() => {
        sandbox.restore();
    });

    it('should export invoke', () => {
        chai.expect(invoke).to.not.be.undefined;
    });

    it('should export sdk', () => {
        chai.expect(sdk).to.not.be.undefined;
    });

    it('should invoke function', async () => {
        const payload = {
            'context':{
                'apiVersion':'46.0',
                'functionInvocationId':'9mdxx00000000Mb',
                'userContext':{
                    'orgDomainUrl':'http://sffx-dev-ed.localhost.internal.salesforce.com:6109',
                    'orgId':'00Dxx0000006GoF',
                    'salesforceBaseUrl':'http://sffx-dev-ed.localhost.internal.salesforce.com:6109',
                    'sessionId':'00Dxx0000006GoF!SESSION_ID',
                    'userId':'005xx000001X7dl',
                    'username':'chris@sffx.org'
                }

            },
            'functionName':'salesforce.pdf_creator_function_invoke__e',
            'id':'00Dxx0000006GoF-0cXxx000000000H',
            'payload':{
                'html':null,
                'isLightning':false,
                'url':'https://sffx-dev-ed.localhost.internal.salesforce.com/apex/MyPdfPage'
            }
        };
        const cloudEvent: sdk.Cloudevent = new sdk.Cloudevent(sdk.Cloudevent.specs['0.2']);
        cloudEvent
            .type('com.salesforce.functions.pdf.create')
            .source('urn:event:from:salesforce/visualforce/00D/005/mypdfpage')
            .data(payload);
        process.env.SF_FX_PAYLOAD = cloudEvent.toString();
        console.log(process.env.SF_FX_PAYLOAD);

        const fakeFx: testUtils.FakeFunction = new testUtils.FakeFunction();
        const initStub = sandbox.stub(fakeFx, 'init');
        await invoke(fakeFx);

        sinon.assert.calledOnce(initStub);
        chai.assert(fakeFx.invokeParams != null && fakeFx.invokeParams.context && fakeFx.invokeParams.event);
        chai.expect(payload.context.functionInvocationId).to.equal(fakeFx.invokeParams.context.fxInvocation.id);
        chai.expect(payload.context.userContext.orgId).to.equal(fakeFx.invokeParams.context.userContext.orgId);
        chai.expect(cloudEvent.getType()).to.equal(fakeFx.invokeParams.event.getType());
        chai.expect(cloudEvent.getSource()).to.equal(fakeFx.invokeParams.event.getSource());
        chai.expect(cloudEvent.getData().payload.url).to.equal(payload.payload.url);

        return Promise.resolve(null);
    });
});