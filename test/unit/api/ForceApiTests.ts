/* tslint:disable: no-unused-expression */
import { assert, expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
use(chaiAsPromised);
import * as jsforce from 'jsforce';

import { ForceApi, NO_OP_LOGGER, SObject } from '../../../lib';


//   T E S T S

describe('ForceApi Tests', () => {

    let sandbox: sinon.SinonSandbox;
    let mockConnection;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockConnection = sandbox.createStubInstance(jsforce.Connection);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should perform query', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const fakeResult: jsforce.QueryResult<object> = {
            done: true,
            records: [{ Id: 'IDHERE' }],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(soql: string): Promise<jsforce.QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.query('SOQL HERE');
        assert(result.done);
        expect(result.totalSize).to.equal(fakeResult.totalSize);
        expect(result.records).to.equal(fakeResult.records);
    });

    it('should perform queryMore', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const fakeResult: jsforce.QueryResult<object> = {
            done: true,
            records: [{ Id: 'IDHERE' }],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(locator: string): Promise<jsforce.QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.query('SOQL HERE');
        assert(result.done);
        expect(result.totalSize).to.equal(fakeResult.totalSize);
        expect(result.records).to.equal(fakeResult.records);
    });

    it('should perform insert', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct: SObject = new SObject('Account');
        acct.setValue('Name', 'Whatever');
        const fakeResult: jsforce.SuccessResult = {
            id: 'IDHERE',
            success: true
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                insert(record: jsforce.Record<object>): Promise<jsforce.RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.insert(acct);
        assert(result.success);
        if ('id' in result) { // type narrow
            expect(result.id).to.equal(fakeResult.id);
        } else {
            assert(false);
        }
    });

    it('should perform update (SuccessResult)', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct: SObject = new SObject('Account');
        acct.setValue('Id', 'IDHERE');
        acct.setValue('Name', 'Whatever');
        const fakeResult: jsforce.SuccessResult = {
            id: 'IDHERE',
            success: true
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                update(record: jsforce.Record<object>): Promise<jsforce.RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.update(acct);
        assert(result.success);
        if ('id' in result) { // type narrow
            expect(result.id).to.equal(fakeResult.id);
        } else {
            assert(false);
        }
    });

    it('should perform update (ErrorResult)', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct: SObject = new SObject('Account');
        acct.setValue('Id', 'IDHERE');
        acct.setValue('Name', 'Whatever');
        const fakeResult: jsforce.ErrorResult = {
            errors: [ 'WTF?!' ],
            success: false
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                update(record: jsforce.Record<object>): Promise<jsforce.RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.update(acct);
        assert(!result.success);
        if ('errors' in result) { // type narrow
            expect(result.errors).to.equal(fakeResult.errors);
        } else {
            assert(false);
        }
    });

    it('should perform request', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const mockResult = {
            encoding: 'UTF-8',
            maxBatchSize : 200,
            sobjects: [ { } ]
        };
        mockConnection.request.callsFake(async({ }): Promise<object> => {
            return Promise.resolve(mockResult);
        });
        sandbox.stub(forceApi, <any>'connect').returns(mockConnection);

        const result = await forceApi.request('GET', '/services/data/v32.0/sobjects/Account/describe', '', { });
        expect(result['maxBatchSize']).to.equal(mockResult.maxBatchSize);
    });
});
