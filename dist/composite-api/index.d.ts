import { HttpCodes, newCompositeApi } from './CompositeApi';
import { newCompositeRequest } from './CompositeRequest';
import { deleteBuilder, describeBuilder, httpGETBuilder, insertBuilder, patchBuilder, putBuilder } from './CompositeSubrequest';
export declare const CompositeApi: {
    HttpCodes: typeof HttpCodes;
    deleteBuilder: typeof deleteBuilder;
    describeBuilder: typeof describeBuilder;
    httpGETBuilder: typeof httpGETBuilder;
    insertBuilder: typeof insertBuilder;
    newCompositeApi: typeof newCompositeApi;
    newCompositeRequest: typeof newCompositeRequest;
    patchBuilder: typeof patchBuilder;
    putBuilder: typeof putBuilder;
};
