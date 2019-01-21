import * as sdk from './sf-sdk';
declare function invoke(fx: sdk.SfFunction): Promise<void>;
export { invoke, sdk };
