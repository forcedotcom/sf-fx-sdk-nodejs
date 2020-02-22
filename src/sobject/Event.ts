import { SObject } from './SObject'

/**
 * Represents a Platform Event.
 */
export class Event extends SObject {

    constructor(sObjectType: string) {
        if (!sObjectType) {
            throw new Error('Event type is required.');
        }
        if (!sObjectType.endsWith('__e')) {
            sObjectType = `${sObjectType}__e`;
        }
        super(sObjectType);
    }
}