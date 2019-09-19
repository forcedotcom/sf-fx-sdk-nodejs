/* tslint:disable: no-unused-expression */
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
chai.use(chaiAsPromised);
import * as jsforce from 'jsforce';
import { ForceApi, SObject } from '../../../lib';


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
        const forceApi = new ForceApi(undefined, undefined);
        const fakeResult: jsforce.QueryResult<object> = {
            done: true,
            records: [{ Id: 'IDHERE' }],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(soql: string): Promise<jsforce.QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, 'connect').returns(mockConnection);

        const result = await forceApi.query('SOQL HERE');
        chai.assert(result.done);
        chai.expect(result.totalSize).to.equal(fakeResult.totalSize);
        chai.expect(result.records).to.equal(fakeResult.records);
    });

    it('should perform queryMore', async () => {
        const forceApi = new ForceApi(undefined, undefined);
        const fakeResult: jsforce.QueryResult<object> = {
            done: true,
            records: [{ Id: 'IDHERE' }],
            totalSize: 1
        };
        mockConnection.query.callsFake(async(locator: string): Promise<jsforce.QueryResult<object>> => {
            return Promise.resolve(fakeResult);
        });
        sandbox.stub(forceApi, 'connect').returns(mockConnection);

        const result = await forceApi.query('SOQL HERE');
        chai.assert(result.done);
        chai.expect(result.totalSize).to.equal(fakeResult.totalSize);
        chai.expect(result.records).to.equal(fakeResult.records);
    });

    it('should perform insert', async () => {
        const forceApi = new ForceApi(undefined, undefined);
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
        sandbox.stub(forceApi, 'connect').returns(mockConnection);

        const result = await forceApi.insert(acct);
        chai.assert(result.success);
        if ('id' in result) { // type narrow
            chai.expect(result.id).to.equal(fakeResult.id);
        } else {
            chai.assert(false);
        }
    });

    it('should perform update (SuccessResult)', async () => {
        const forceApi = new ForceApi(undefined, undefined);
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
        sandbox.stub(forceApi, 'connect').returns(mockConnection);

        const result = await forceApi.update(acct);
        chai.assert(result.success);
        if ('id' in result) { // type narrow
            chai.expect(result.id).to.equal(fakeResult.id);
        } else {
            chai.assert(false);
        }
    });

    it('should perform update (ErrorResult)', async () => {
        const forceApi = new ForceApi(undefined, undefined);
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
        sandbox.stub(forceApi, 'connect').returns(mockConnection);

        const result = await forceApi.update(acct);
        chai.assert(!result.success);
        if ('errors' in result) { // type narrow
            chai.expect(result.errors).to.equal(fakeResult.errors);
        } else {
            chai.assert(false);
        }
    });

});
