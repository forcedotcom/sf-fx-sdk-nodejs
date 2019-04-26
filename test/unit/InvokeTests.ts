import * as Promise from 'bluebird';
import { assert, expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { invoke, sdk } from '../../lib';

const sandbox = sinon.createSandbox();

const fakeFx: sdk.SfFunction = {

    getName() {
        return 'fakeFx';
    },

    init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        return Promise.resolve(null);
    },

    invoke(context: sdk.Context, event: sdk.Cloudevent): Promise<any> {
        return Promise.resolve({ context, event });
    }
};

describe('Invoke Function Tests', () => {

    afterEach(() => {
        sandbox.restore();
    });

    it('should export invoke', () => expect(invoke).to.not.be.undefined);

    it('should export sdk', () => expect(sdk).to.not.be.undefined);

    it('should invoke function', () => async function (): Promise<void> {
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
                'url':'https://sffx-dev-ed.localhost.internal.salesforce.com/apex/MyPage'
            }
        };
        const cloudEvent: sdk.Cloudevent = new sdk.Cloudevent(sdk.Cloudevent.specs['0.2']);
        cloudEvent
            .type('com.github.pull.create')
            .source('urn:event:from:myapi/resourse/123')
            .data(payload);
        process.env.SF_FX_PAYLOAD = cloudEvent.toString();
        console.log(process.env.SF_FX_PAYLOAD);

        const initStub = sandbox.stub(fakeFx, 'init');
        const params: any = await invoke(fakeFx);

        sinon.assert.calledOnce(initStub);
        assert(params != null && params.context && params.event);
        expect(payload.context.functionInvocationId).to.strictEqual(params.context.functionInvocationId);
        expect(payload.context.userContext.orgId).to.strictEqual(params.context.userContext.orgId);
        expect(cloudEvent.getSource()).to.strictEqual(params.event.getSource());
        expect(cloudEvent.getData().url).to.strictEqual(payload.payload.url);
    });
});