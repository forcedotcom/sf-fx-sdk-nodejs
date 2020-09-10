/* tslint:disable: no-unused-expression */
import { assert, expect } from 'chai';
import 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise-native';
import * as validUrl from 'valid-url';

const functionResource: string = process.env.FUNCTION_RESOURCE || 'http://spider-844zdrtz.orca-vet899to4u.peak-0c9bd7.evergreen.space';
// Body or filepath to body
const functionRequestBody: string = process.env.FUNCTION_REQUEST_BODY;
const functionRequestBodyFilePath: string = process.env.FUNCTION_REQUEST_BODY_FILEPATH || path.join(__dirname, 'hello-payload.json');
const functionRequestBodyUrl: string = process.env.FUNCTION_REQUEST_BODY_URL;
const functionRequestTimeout: number = parseInt(process.env.FUNCTION_REQUEST_TIMEOUT || '60000');

describe('Invoke Function Integration Tests', () => {

    const fetchRequestBody = async (url: string): Promise<any> => {
        return await request.get(url);
    };

    it('successfully invokes function (no payload)', async () => {
        expect(functionResource).to.exist;
        expect(validUrl.isUri(functionResource)).to.exist;

        const options = {
            headers: {
                'Content-type': 'application/json',
                'ce-specversion': '1.0',
                'ce-id': '00Dxx0000006IYJEA2-4Y4W3Lw_LkoskcHdEaZze--MyFunction-2020-09-03T20:56:27.608444Z',
                'ce-source': 'urn:event:from:salesforce/xx/228.0/00Dxx0000006IYJ/apex/MyFunctionApex:test():7',
                'ce-type': 'com.salesforce.function.invoke.sync',
                'ce-time': '2020-09-03T20:56:28.297915Z',
                'X-Request-Id': '00Dxx0000006IYJEA2-4Y4W3Lw_LkoskcHdEaZze--MyFunction-2020-09-03T20:56:27.608444Z'
            },
            json: true, // Automatically parses the JSON string in the response
            method: 'POST',
            resolveWithFullResponse: true,
            timeout: functionRequestTimeout,
            uri: functionResource,
        };

        // TODO: Assert none or one of.
        if (functionRequestBody || functionRequestBodyFilePath || functionRequestBodyUrl) {
            let body;
            try {
                body = JSON.parse(functionRequestBody
                    || (functionRequestBodyFilePath && fs.readFileSync(functionRequestBodyFilePath).toString())
                    || await fetchRequestBody(functionRequestBodyUrl));
            } catch(err) {
                assert.fail(`Invalid JSON body: ${err.message}`);
            }
            options['body'] = body;
        }

        console.log(`Invoking ${functionResource}...`);
        const response = await request(options);
        expect(response).to.exist;
        expect(response.statusCode).to.exist;
        expect(response.statusCode).to.be.equal(200);
        expect(response.body).to.exist;
        expect(response.body).to.not.contain('Error');
        let responseBody;
        try {
            responseBody = JSON.parse(response.body);
        } catch(err) {
            assert.fail(`Invalid JSON response body: ${err.message}`);
        }
        expect(responseBody).to.exist;
        // Hello function specific validation
        expect(responseBody.status).to.exist;
        expect(responseBody.status.code).to.exist;
        expect(responseBody.status.code).to.be.equal('SUCCESS');
        // TODO: Assert more of the function response
    });
});