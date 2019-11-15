import * as _ from 'lodash';

import { CompositeSubrequest } from './';

export class CompositeRequest {
    private allOrNone: boolean;
    // Named to match the composite api schema. This is actually an array of CompositeSubrequest
    private compositeRequest: CompositeSubrequest[];

    constructor() {
        this.allOrNone = true;
        this.compositeRequest = [];
    }

    public setAllOrNone(allOrNone: boolean): void {
        this.allOrNone = allOrNone;
    }

    public get isAllOrNone(): boolean {
        return this.allOrNone;
    }

    public addSubrequest(compositeSubrequest: CompositeSubrequest): void {
        this.compositeRequest.push(compositeSubrequest);
    }

    public get subrequests(): ReadonlyArray<CompositeSubrequest> {
        const ro: ReadonlyArray<CompositeSubrequest> = this.compositeRequest;
        return ro;
    }

    public getSubrequest(referenceId: string): CompositeSubrequest {
        for (const compositeSubrequest of this.compositeRequest) {
            if (compositeSubrequest.referenceId === referenceId) {
                return compositeSubrequest;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }
}
