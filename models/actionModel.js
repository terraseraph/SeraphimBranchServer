class Action{
    constructor(name){
        this.id = ""
        this.name = name
        this.device_id = ""
        this.event = ""
        this.eventType = ""
        this.action = ""
        this.actionType = ""
        this.data = ""
        this.wait = 0
        this.description = ""
        this.repeatable = true
        this.dependencies = []
        this.actions = []
        this.message = ""
        this.state = ""
    }
}

module.exports = Action