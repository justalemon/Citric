import "@citizenfx/server";

function kickPlayer(player: string, reason: string) {
    if (GetResourceState("easyadmin") == "started") {
        TriggerServerEvent("EasyAdmin:kickPlayer", player, reason);
    } else {
        console.error("There is no resource running for admin management!");
    }
}

function banPlayer(player: string, reason: string, expires: number) {
    if (GetResourceState("easyadmin") == "started") {
        TriggerServerEvent("EasyAdmin:addBan", player, reason, expires);
    } else {
        console.error("There is no resource running for admin management!");
    }
}
