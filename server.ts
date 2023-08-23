const debug = GetConvarInt("citric_debug", 0) !== 0;
const invites = new RegExp("discord.gg/[A-Za-z0-9]+", "i");
const messages: string[] = [];

type Message = {
    mode: string,
    color: [number, number, number],
    args: Array<string>,
    multiline: boolean
}

type MessageHook = {
    updateMessage(data: object): null,
    cancel(): null,
    setSeObject(obj: object): null,
    setRouting(target: any): null
}

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

function banChatMessages(player: number, message: Message, hookRef: MessageHook) {
    if (player <= 0) {
        return;
    }

    if (GetConvarInt("citric_blockinvites", 1) !== 0 && message.args.some(x => invites.test(x))) {
        hookRef.cancel();
        return;
    }

    if (GetConvarInt("citric_blockmessages", 1) !== 0) {
        for (const messageContent of messages) {
            if (message.args.some(x => x.toLowerCase().indexOf(messageContent) !== -1)) {
                hookRef.cancel();
                return;
            }
        }
    }
}
async function registerChatHook() {
    const contents = LoadResourceFile(GetCurrentResourceName(), "messages.json");
    const newMessages: string[] = JSON.parse(contents);

    for (const newMessage of newMessages) {
        messages.push(newMessage.toLowerCase());
    }

    if (GetResourceState("chat") === "started") {
        console.log("Registering chat hook");
        exports.chat.registerMessageHook(banChatMessages);
    } else {
        console.error("Chat is not running, skipping hook registration");
    }
}
async function registerHook(name: string) {
    if (name === "chat") {
        console.log("Registering chat hook");
        exports.chat.registerMessageHook(banChatMessages);
    }
}
setImmediate(registerChatHook);
on("onResourceStart", registerHook)

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

function banEntities(entity: number) {
    const owner = NetworkGetFirstEntityOwner(entity);
    // https://alloc8or.re/gta5/doc/enums/ePopulationType.txt
    const populationType = GetEntityPopulationType(entity);

    if (owner === 0 || populationType === 2 || populationType === 3 || populationType === 4 || populationType === 5) {
        return;
    }

    const model = GetEntityModel(entity);
    const unsigned = model >>> 0;
    const hex = unsigned.toString(16).toUpperCase();
    let permission = "";

    switch (GetEntityType(entity)) {
        case 1:
            permission = "citric.ped.0x" + hex;
            break;
        case 2:
            permission = "citric.vehicle." + GetVehicleType(entity) + ".0x" + hex;
            break;
        case 3:
            permission = "citric.prop.0x" + hex;
            break;
        default:
            permission = "citric.entity.0x" + hex;
            break;
    }

    if (!IsPlayerAceAllowed(owner.toString(), permission)) {
        CancelEvent();
    }
}
on("entityCreating", banEntities)

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
