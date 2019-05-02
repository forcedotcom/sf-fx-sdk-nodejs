import { newCompositeApi } from './CompositeApi';
import { newCompositeRequest } from './CompositeRequest';
import {
    deleteBuilder,
    describeBuilder,
    httpGETBuilder,
    insertBuilder,
    patchBuilder,
    putBuilder,
} from './CompositeSubrequest';

// tslint:disable-next-line:variable-name
export const CompositeApi = {
    deleteBuilder,
    describeBuilder,
    httpGETBuilder,
    insertBuilder,
    newCompositeApi,
    newCompositeRequest,
    patchBuilder,
    putBuilder,
};
