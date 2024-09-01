import { Event, EventField, EventFieldOfType } from '../Calendar'
import { EventModification } from './Pipeline'

export interface FieldCopyParams<T> {
    fromField: EventFieldOfType<T>
    toField: EventFieldOfType<T>
}

export class SetFieldFrom<T> extends EventModification<FieldCopyParams<T>> {
    params: FieldCopyParams<T>
    constructor(params: FieldCopyParams<T>) {
        super()
        this.params = params
    }
    modify(event: Event): Event {
        let newEvent = Object.assign({}, event)
        newEvent[this.params.toField] = newEvent[this.params.fromField]
        return newEvent
    }
}

export class AppendFieldFrom extends EventModification<FieldCopyParams<string>> {
    params: FieldCopyParams<string>
    constructor(params: FieldCopyParams<string>) {
        super()
        this.params = params
    }
    modify(event: Event): Event {
        let newEvent = Object.assign({}, event)
        if (newEvent[this.params.toField] == undefined) {
            newEvent[this.params.toField] = newEvent[this.params.fromField]
        } else if (newEvent[this.params.fromField] != undefined) {
            newEvent[this.params.toField] += newEvent[this.params.fromField]
        }
        return newEvent
    }
}

export class PrependFieldFrom extends EventModification<FieldCopyParams<string>> {
    params: FieldCopyParams<string>
    constructor(params: FieldCopyParams<string>) {
        super()
        this.params = params
    }
    modify(event: Event): Event {
        let newEvent = Object.assign({}, event)
        if (newEvent[this.params.toField] == undefined) {
            newEvent[this.params.toField] = newEvent[this.params.fromField]
        } else if (newEvent[this.params.fromField] != undefined) {
            newEvent[this.params.toField] = newEvent[this.params.fromField] + newEvent[this.params.toField]
        }
        return newEvent
    }
}