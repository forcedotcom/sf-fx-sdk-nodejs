# Salesforce Function SDK for Node.js

Note: This feature is in beta and has been released early so we can collect feedback. It may contain significant problems, undergo major changes, or be discontinued. The use of this feature is governed by the [Salesforce.com Program Agreement](https://trailblazer.me/terms?lan=en).

## What

This repo contains the public typescript types for https://github.com/forcedotcom/sf-fx-runtime-nodejs. These types have been extracted into their own repo. The idea is that a customer can depend on this [public package](https://www.npmjs.com/package/sf-fx-sdk-nodejs) and import necessary types for their project:

```
import { InvocationEvent, Context, Logger} from "sf-fx-sdk-nodejs";
export async function execute(event: InvocationEvent<any>, context: Context, logger: Logger {
  // ...
}
```

The https://github.com/forcedotcom/sf-fx-runtime-nodejs also [internally depends on these types](https://github.com/forcedotcom/sf-fx-runtime-nodejs/blob/dff634abec5e45bd34b518ce4c3554a727bcb687/package.json#L44).

## Releasing

Follow the internal [SDK publish pipeline doc](https://github.com/heroku/languages-team/blob/main/languages/nodejs/sdk-publish-pipeline.md).
