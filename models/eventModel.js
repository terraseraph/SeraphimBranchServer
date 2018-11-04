//@ts-check

/** Model for the events */
class Event {
    constructor(name) {
        this.id = ""
        this.name = name
        this.device_id = ""
        this.event = ""
        this.eventType = ""
        this.data = "" //String for now
        this.description = ""
        this.dependencies = []
        this.actions = []
        this.can_toggle = true
        this.message = ""
        this.state = ""
    }
}

module.exports = Event