import * as sdk from './sf-sdk';
declare const compositeApi: any;
declare const config: any;
declare const sObject: any;
declare const unitOfWork: any;
declare function invoke(fx: sdk.SfFunction): Promise<void>;
export { invoke, compositeApi, config, sdk, unitOfWork, sObject };
