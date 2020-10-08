# Salesforce Function SDK for Node.js

Note: This feature is in beta and has been released early so we can collect feedback. It may contain significant problems, undergo major changes, or be discontinued. The use of this feature is governed by the [Salesforce.com Program Agreement](https://trailblazer.me/terms?lan=en).

## Usage

All function implementations must export a function accepting these arguments:

* [InvocationEvent](docs/classes/invocationevent.md) containing the payload for the function, etc.
* [Context](docs/classes/context.md) containing utility and Salesforce API classes to call back to the invoking org
* [Logger](https://forcedotcom.github.io/sfdx-core/classes/logger.html) for logging diagnostic/status messages

Functions must return an object that can be serialized to JSON.

The following JavaScript example makes a SOQL query to a Salesforce org: 

```js
const sdk = require('@salesforce/salesforce-sdk');

module.exports = async function (event, context, logger) {
     
     const soql = 'SELECT Name FROM Account';
     const queryResults = await context.org.data.query(soql);
     logger.info(JSON.stringify(queryResults));
     
     return queryResults;
}
```

and the same example in TypeScript is as follows:

```ts
import * as sdk from '@salesforce/salesforce-sdk';

export default async function execute(event: sdk.InvocationEvent, context: sdk.Context, logger: sdk.Logger): Promise<any> {

    const soql = 'SELECT Name FROM Account';
    const queryResults = await context.org.data.query(soql);
    logger.info(JSON.stringify(queryResults));

    return queryResults;
}
```

For more complex transactions, the SDK provides the UnitOfWork class. A UnitOfWork represents a set of one or more Salesforce operations that need to be done as a single atomic operation. The following JavaScript example uses a UnitOfWork to create an Account record and several related records:

> For the Salesforce Functions pilot, always use a new instance of UnitOfWork for each transaction and never re-use a committed UnitOfWork.

```js
module.exports = async function (event, context, logger) {
    const payload = event.data;
    const uniqueId = Date.now();

    // Create a unit of work that inserts multiple objects.
    const work = context.org.unitOfWork;

    const account = new sdk.SObject('Account');
    account.setValue('Name', payload.accountName + uniqueId);
    work.registerNew(account);

    const contact = new sdk.SObject('Contact');
    contact.setValue('LastName', payload.contactName + uniqueId);
    contact.setValue('AccountId', account.fkId);
    work.registerNew(contact);

    const opportunity = new sdk.SObject('Opportunity');
    opportunity.setValue('Name', payload.opportunityName + uniqueId);
    opportunity.setValue('StageName', 'Prospecting');
    opportunity.setValue('CloseDate', Date.now());
    opportunity.setValue('AccountId', account.fkId);
    work.registerNew(opportunity);

    // Commit the unit of work.
    const response = await work.commit();
    if (response.success) {
        logger.info(JSON.stringify(response));
        const result = { 'accountId' : response.getResults(account)[0].id,
                         'contactId' : response.getResults(contact)[0].id,
                         'opportunityId' : response.getResults(opportunity)[0].id };
        logger.info('Committed a Unit of Work');
        logger.info(JSON.stringify(result));
    // If there was an error, log the root cause and throw an Error to indicate
    // a failed Function status
    } else {
        const errMsg = `Failed to commit Unit of Work. Root cause: ${response.rootCause}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
}
```
