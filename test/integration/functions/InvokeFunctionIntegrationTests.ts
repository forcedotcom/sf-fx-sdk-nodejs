/* tslint:disable: no-unused-expression */
import { assert, expect } from 'chai';
import 'mocha';
import { beforeEach } from 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise-native';
import * as validUrl from 'valid-url';

const functionResource: string = process.env.FUNCTION_RESOURCE || 'http://systematic-mamenchisaurus-1957.closed-cauliflower-6487.secret-hamlet-5094.herokuspace.com';
// Body or filepath to body
const functionRequestBody: string = process.env.FUNCTION_REQUEST_BODY;
const functionRequestBodyFilePath: string = process.env.FUNCTION_REQUEST_BODY_FILEPATH || path.join(__dirname, 'hello-payload.json');
const functionRequestBodyUrl: string = process.env.FUNCTION_REQUEST_BODY_URL;

describe('Invoke Function Integration Tests', () => {

    const fetchRequestBody = async (url: string) => {
        return await request.get(url);
    }

    beforeEach(() => {
    });

    it('successfully invokes function (no payload)', async () => {
        expect(functionResource).to.exist;
        expect(validUrl.isUri(functionResource)).to.exist;

        const options = {
            headers: {
                'Content-type': 'application/json'
            },
            json: true, // Automatically parses the JSON string in the response
            method: 'POST',
            resolveWithFullResponse: true,
            timeout: 10000,
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
                assert.fail(`Invalid JSON body: ${err.message}`)
            }
            options['body'] = body;
        }

        console.log(`Invoking ${functionResource}...`)
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
            assert.fail(`Invalid JSON response body: ${err.message}`)
        }
        expect(responseBody).to.exist;
        // Hello function specific validation
        expect(responseBody.status).to.exist;
        expect(responseBody.status.code).to.exist;
        expect(responseBody.status.code).to.be.equal('SUCCESS');
        // TODO: Assert more of the function response
    });
});