const debug = GetConvarInt("citric_debug", 0) !== 0;

type ExplosionData = {
    ownerNetId: number;
    explosionType: number;
    damageScale: number;
    posX: number;
    posY: number;
    posZ: number;
    cameraShake: number;
    isAudible: boolean;
    isInvisible: boolean;
}

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

async function banWeapons() {
    for (const player of getPlayers()) {
        const ped = GetPlayerPed(player);

        while (true) {
            const weapon = GetSelectedPedWeapon(ped);

            if (weapon === 0 || weapon === -1569615261) {  // unarmed
                break;
            }

            const unsigned = weapon >>> 0;
            const hex = unsigned.toString(16).toUpperCase();
            const permission = "citric.weapon.0x" + hex;

            if (!IsPlayerAceAllowed(player, permission)) {
                RemoveWeaponFromPed(ped, weapon);
                await new Promise(res => setTimeout(res, 0));
            } else {
                break;
            }
        }
    }
}
setTick(banWeapons);

function banExplosion(sender: number, data: ExplosionData) {
    const permission = "citric.explosion." + data.explosionType.toString();
    
    if (!IsPlayerAceAllowed(sender.toString(), permission)) {
        CancelEvent();
        banPlayer(sender, "Explosion", 0);
    }
}
on("explosionEvent", banExplosion);

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
