const debug = GetConvarInt("citric_debug", 0) !== 0;

function registerEvents() {
    const contents = LoadResourceFile(GetCurrentResourceName(), "events.json");
    const events = JSON.parse(contents);

    for (const event of events.client) {
        on(event, () => {
            TriggerServerEvent("citric:banEvent");
        });

        if (debug) {
            console.log("Registered event " + event)
        }
    }
}

setImmediate(registerEvents);
