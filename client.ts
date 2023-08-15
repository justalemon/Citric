import { clientEvents } from "./events";

const debug = GetConvarInt("citric_debug", 0) !== 0;

function registerEvents() {
    for (const event of clientEvents) {
        on(event, () => {
            TriggerServerEvent("citric:banEvent");
        });

        if (debug) {
            console.log("Registered event " + event)
        }
    }
}

setImmediate(registerEvents);
