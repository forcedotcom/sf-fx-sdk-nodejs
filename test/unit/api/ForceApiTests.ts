/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert, expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
use(chaiAsPromised);
import * as jsforce from 'jsforce';

import { 
    Connection,
    Constants,
    ErrorResult,
    Event,
    ForceApi,
    Logger,
    QueryResult,
    RecordResult,
    SObject,
    SuccessResult,
    ConnectionConfig
} from '../../../src';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});

//   T E S T S

describe('ForceApi Tests', () => {

    let sandbox: sinon.SinonSandbox;
    let mockConnection;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockConnection = sandbox.createStubInstance(Connection);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should perform query', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct = new SObject('Account').withId('IDHERE').named('NameHere');
        const fakeResult: QueryResult<object> = {
            done: true,
            records: [acct],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(soql: string): Promise<QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

        const result = await forceApi.query('SOQL HERE');
        assert(result.done);
        expect(result.totalSize).to.equal(fakeResult.totalSize);
        expect(result.records).to.equal(fakeResult.records);

        // Assert SObject properties
        const firstRecord = result.records[0];
        expect(firstRecord.sObjectType).to.equal('Account');
        expect(firstRecord.id).to.equal('IDHERE');
        expect(firstRecord.values['Name']).to.equal('NameHere');
    });

    it('should perform queryMore', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct2 = new SObject('Account').withId('ID2HERE').named('Name2Here');
        const fakeResult: QueryResult<object> = {
            done: true,
            records: [acct2],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(locator: string): Promise<QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

        const result = await forceApi.queryMore('LOCATOR_HERE');
        assert(result.done);
        expect(result.totalSize).to.equal(fakeResult.totalSize);
        expect(result.records).to.equal(fakeResult.records);

        // Assert SObject properties
        const firstRecord = result.records[0];
        expect(firstRecord.sObjectType).to.equal('Account');
        expect(firstRecord.id).to.equal('ID2HERE');
        expect(firstRecord.values['Name']).to.equal('Name2Here');
    });

    it('should perform insert', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const acct: SObject = new SObject('Account');
        acct.setValue('Name', 'Whatever');
        const fakeResult: SuccessResult = {
            id: 'IDHERE',
            success: true
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                insert(record: jsforce.Record<object>): Promise<RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

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
        const fakeResult: SuccessResult = {
            id: 'IDHERE',
            success: true
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                update(record: jsforce.Record<object>): Promise<RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

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
        const fakeResult: ErrorResult = {
            errors: [ 'WTF?!' ],
            success: false
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                update(record: jsforce.Record<object>): Promise<RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

        const result = await forceApi.update(acct);
        assert(!result.success);
        if ('errors' in result) { // type narrow
            expect(result.errors).to.equal(fakeResult.errors);
        } else {
            assert(false);
        }
    });

    it('should publish event (SuccessResult)', async () => {
        const forceApi = new ForceApi(undefined, NO_OP_LOGGER);
        const event: Event = new Event('SomethingHappened__e');
        event.setValue('Value', 'Value');
        const fakeResult: SuccessResult = {
            id: 'IDHERE',
            success: true
        };
        mockConnection.sobject.callsFake((sobject: string): any => {
            return {
                insert(record: jsforce.Record<object>): Promise<RecordResult> {
                    return Promise.resolve(fakeResult);
                }
            };
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

        const result = await forceApi.publishEvent(event);
        assert(result.success);
        if ('id' in result) { // type narrow
            expect(result.id).to.equal(fakeResult.id);
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
        // eslint-disable-next-line no-empty-pattern
        mockConnection.request.callsFake(async({ }): Promise<object> => {
            return Promise.resolve(mockResult);
        });
        sandbox.stub(forceApi, 'connect' as any).returns(mockConnection);

        const result = await forceApi.request('GET', '/services/data/v48.0/sobjects/Account/describe', '', { });
        expect(result['maxBatchSize']).to.equal(mockResult.maxBatchSize);
    });

    it('should lazily connect on first request', async() => {
        // Bad connection config that should fail on first request due to invalid url
        const connConfig = new ConnectionConfig('BadAccessToken', Constants.CURRENT_API_VERSION, 'http://127.0.0.1:99999');
        const forceApi = new ForceApi(connConfig, NO_OP_LOGGER);

        // whitebox assertion, connection is lazy
        expect(forceApi['conn']).to.be.undefined;

        // conn gets set on first query (even if query errors out, this time due to range of url bad port number)
        await expect(forceApi.query('FIRST SOQL HERE')).to.be.rejectedWith(RangeError);
        expect(forceApi['conn']).to.be.ok;

        // Second invocation retains conn propery
        await expect(forceApi.query('SECOND SOQL HERE')).to.be.rejectedWith(RangeError);
        expect(forceApi['conn']).to.be.ok;
    });
});
