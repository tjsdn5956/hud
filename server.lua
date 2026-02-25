local Tunnel = module("vrp", "lib/Tunnel")
local Proxy = module("vrp", "lib/Proxy")

vRP = Proxy.getInterface("vRP")
vRPclient = Tunnel.getInterface("vRP", GetCurrentResourceName())
pocoC = Tunnel.getInterface(GetCurrentResourceName(), GetCurrentResourceName())

poco = {}
Tunnel.bindInterface(GetCurrentResourceName(), poco)

local Hyeok = Proxy.getInterface("Hyeok_Proxy")

local customActionExecute = {}
vRP.defInventoryCustomAction()

function userDB(user_id,source)
    vRP.getUserIdentity({user_id, function(identity)
        if identity == nil then
            identity = {}
        end

        local data = {}
        data.user_id = user_id
        data.name = GetPlayerName(source)
        data.age = identity.age or "재접속"
        data.phone = identity.phone or "재접속"
        data.car = identity.registration or "재접속"

        TriggerClientEvent("EscSetData",source, data)

        pocoC.one_getInfo(source, {data})
    end})
end
AddEventHandler("vRP:playerSpawn", userDB)

local lastPlayerNum = 0

function poco.FirstInfo()
    local source = source
    local user_id = vRP.getUserId({source})
    if user_id == nil then return end

    local money = vRP.getMoney({user_id})
    local bank = vRP.getBankMoney({user_id})
    local credit = vRP.getCredit({user_id})

    local name = GetPlayerName(source)
    local job = vRP.getUserGroupByType({user_id, "job"})

    return money, bank, credit, user_id, name, job, lastPlayerNum
end

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(3000)

        local newValue = GetNumPlayerIndices()
        
        if lastPlayerNum ~= newValue then
            TriggerClientEvent("HudUI_Update", -1, {
                accessor = newValue
            })
        end

        lastPlayerNum = newValue
    end
end)

SetTimeout(500, function()
    for k, main in ipairs(GetAllPeds()) do
        DeleteEntity(main)
    end

    for _, soruce in pairs(GetPlayers()) do
        userDB(vRP.getUserId({tonumber(soruce)}), soruce)
    end
end)

local pocos = {
    ["money"] = 91.2,
    ["ChangeItem"] = 7.5,
    ["machinePistol"] = 0.3,
    -- ["pumpShotgun"] = 0.2,
    ["2Rconfirmation"] = 0.7,
    ["1Rconfirmation"] = 0.3,
}


local function notify(player, msg, type, timer)
    TriggerClientEvent("pNotify:SendNotification", player, {
        text = msg,
        type = type or "success",
        timeout = timer or 3000,
        layout = "centerleft",
        queue = "global"
    })
end

-- local sendAmounts = {}
local registerAmountItems = {}

function poco.registerQuickSlot(data)
    local source = source
    local user_id = vRP.getUserId({source})
    if user_id == nil or type(data) ~= "table" then return end

    registerAmountItems[user_id] = {}

    for item, _ in pairs(data) do
        registerAmountItems[user_id][item] = true
    end
end

function poco.Get_itemAmount(storage)
    local source = source
    local user_id = vRP.getUserId({source})
    if user_id == nil then return end

    local data = {}

    for slotID, itemId in pairs(storage) do
        data[slotID] = vRP.getInventoryItemAmount({user_id, itemId})
    end

    return data
end

AddEventHandler("vRP:giveInventory", onItemChanged)
AddEventHandler("vRP:tryInventory", onItemChanged)

function onItemChanged(user_id, item)
    local data = registerAmountItems[user_id]
    if data == nil or data[item] ~= true then return end

    local amount = vRP.getInventoryItemAmount({user_id, item})
    pocoC.updateQuickSlot({item, amount})
end

local WhitelistItems = {
    "potion_MT",
    "potion_ST",
    "weed",
    "jtjc",
    "jtjc_NEW",
    "body_armor",
    "elixir",
    "supressor",
    "flash",
    "yusuf",
    "grip",
    "holografik",
    "powiekszonymagazynek",
    "body_armorCop",
    "milk",
    "water",
    "coffee",
    "tea",
    "icetea",
    "orangejuice",
    "cocacola",
    "redbull",
    "lemonade",
    "kanari",
    "ramen",
    "icecream",
    "vodka",
    "bread",
    "pizza",
    "donut",
    "tacos",
    "sandwich",
    "kebab",
    "pdonut",
    "tofu",
    "cigar1",
    "cigar2",
    "bptire",
}

local potionItems = {
    'potion_MT',
    'potion_ST',
}

local ItemCooldown = {}

function poco.getUserItem()
    local source = source
    local user_id = vRP.getUserId({source})
    if user_id == nil then return end

    local data = {}

    for _, itemID in pairs(WhitelistItems) do
        table.insert(data, {
            itemName = itemID,--vRP.getItemName({itemID}),
            itemAmount = vRP.getInventoryItemAmount({user_id, itemID})
        })

        TriggerClientEvent('itemAmountRefresh', source, {
            key = itemID,
            amount = vRP.getInventoryItemAmount({user_id,itemID}),
        })
    end

    return data
end

function split(inputstr, sep)
    if sep == nil then
            sep = "%s"
    end
    local t={}
    for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
            table.insert(t, str)
    end
    return t
end

function get_keys(t)
    local keys={}
    for key,_ in pairs(t) do
      table.insert(keys, key)
    end
    return keys
end

function has_value(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end
    return false
end

function poco.itemUse(data)
    local source = source
    local user_id = vRP.getUserId({source})
    if user_id == nil then return end

    local itemId = data.idName
    local key = data.key 

    local cooldown = 0
    if ItemCooldown[itemId] ~= nil then
        cooldown = ItemCooldown[itemId].cooldown
    else
        cooldown = 5
    end

    local amount = vRP.getInventoryItemAmount({user_id, itemId})

    if has_value(potionItems, itemId) then
        if amount > 0 then
            Hyeok.QuickItemUse({user_id, itemId})
        else
            vRPclient.notify(source, {"~r~" .. vRP.getItemName({itemId}) .. "(이)가 1개가 부족합니다."})
        end
    end

    if has_value(WhitelistItems, itemId) then
        if amount > 0 then
            local action = get_keys(vRP.getItemChoiceHud({itemId}))[1]
            if action ~= nil then
                vRP.executeInventoryCustomAction({source, itemId, action})
            end
        else
            vRPclient.notify(source, {"~r~" .. vRP.getItemName({itemId}) .. "(이)가 1개가 부족합니다."})
        end
    end

    TriggerClientEvent('itemAmountRefresh', source, {
        key = key,
        amount = amount
    })
    TriggerClientEvent("itemUsed", source, itemId, key, cooldown)
end

function poco.openinventory()
	vRP.openInventory({source})
end

function poco.nuiKick()
    DropPlayer(source, "Devtools를 오픈했습니다.")
end