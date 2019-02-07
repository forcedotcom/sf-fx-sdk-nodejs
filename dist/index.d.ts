import { CompositeApi } from './composite-api';
import { ConnectionConfig } from './ConnectionConfig';
import { Constants } from './Constants';
import * as SdkInterfaces from './Interfaces';
import * as sdk from './sf-sdk';
import { SObject } from './SObject';
import { UnitOfWork } from './unit-of-work';
declare function invoke(fx: sdk.SfFunction): Promise<void>;
export { invoke, CompositeApi, ConnectionConfig, Constants, sdk, UnitOfWork, SObject, SdkInterfaces };
