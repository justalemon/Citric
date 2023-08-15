const debug = GetConvarInt("citric_debug", 0) !== 0;

function kickPlayer(player: number, reason: string) {
    if (GetResourceState("easyadmin") == "started") {
        TriggerServerEvent("EasyAdmin:kickPlayer", player, reason);
    } else {
        console.error("There is no resource running for admin management!");
        DropPlayer(player.toString(), reason);
    }
}

function banPlayer(player: number, reason: string, expires: number) {
    if (GetResourceState("easyadmin") == "started") {
        TriggerServerEvent("EasyAdmin:addBan", player, reason, expires > 0 ? expires : null);
    } else {
        console.error("There is no resource running for admin management!");
        DropPlayer(player.toString(), reason);
    }
}

function banEvent() {
    banPlayer(source, "Lua Injector", 0);
}
onNet("citric:banEvent", banEvent);

function registerEvents() {
    const contents = LoadResourceFile(GetCurrentResourceName(), "events.json");
    const events = JSON.parse(contents);

    for (const event of events) {
        onNet(event, () => {
            banPlayer(source, "Lua Injector", 0);
        });

        if (debug) {
            console.log("Registered event " + event)
        }
    }
}
setImmediate(registerEvents);
