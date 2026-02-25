-- 기본 설정 및 초기화
local player = PlayerPedId()
local ped = GetPlayerPed(-1)
local fontId = RegisterFontId("Nanum")

poco = {}
Tunnel.bindInterface(GetCurrentResourceName(), poco)
Proxy.addInterface(GetCurrentResourceName(), poco)
pocoS = Tunnel.getInterface(GetCurrentResourceName(), GetCurrentResourceName())
vRP = Proxy.getInterface("vRP")

local voice_list = {{0.01, "입막음"}, {5.0, "귓속말"}, {10.0, "보통"}, {35.0, "외치기"}}

local setting = {
    quest = true,
    qslot = true,
    qslotAmount = 6,
    call = true,
    darkmode = false,
    nuiNames = true,
    selectUI = 1,
    speedmeter = true
}

local isShowTalkerMarker = false
local isShowTalkerMarkerTimer = 0
local weaponSelectControlIndices = {157, 158, 159, 160, 161, 162, 163, 164, 165}
local lastVoice
local voice = 3

local isUiOpen = false
local speedBuffer = {}
local velBuffer = {}
local beltOn = false
local wasInCar = false
local lastPress = 0
local showUILevel = 4  -- 전역 변수로 선언

local allowedClasses = {
    car = {0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22},
    motocycle = {8},
    cycle = {13},
    boat = {14},
    helicopter = {15},
    airplane = {16}
}

-- 클래스 네임을 찾음
function findVehicleClassName(class, allowedClasses)
    for className, classList in pairs(allowedClasses) do
        for _, value in ipairs(classList) do
            if value == class then
                return className
            end
        end
    end
    return nil
end

function DrawTextBottom(x, y, width, height, scale, text, r, g, b, a, outline)
    SetTextFont(fontId)
    SetTextProportional(0)
    SetTextScale(scale, scale)
    SetTextColour(r, g, b, a)
    SetTextDropShadow(0, 0, 0, 0, 255)
    SetTextEdge(1, 0, 0, 0, 255)
    SetTextDropShadow()
    if outline then
        SetTextOutline()
    end
    SetTextEntry("STRING")
    AddTextComponentString(text)
    DrawText(x - width / 2, y - height / 2 + 0.005)
end

function poco_module_time(seconds)
    local hour = math.floor(seconds / 3600)
    local min = math.floor((seconds % 3600) / 60)
    local sec = math.floor(seconds % 60)
    if min == 0 then
        return sec .. "초"
    elseif hour == 0 then
        return min .. "분 " .. sec .. "초"
    else
        return hour .. "시 " .. min .. "분 " .. sec .. "초"
    end
end

function LoadSetting()
    for name, v in pairs(setting) do
        local value = GetResourceKvpInt("pocoMainSystemNew_" .. name)
        local otherType = name == "selectUI" or name == "qslotAmount"

        if value ~= 0 then
            setting[name] = otherType and value or value == 1
        else
            SetResourceKvpInt("pocoMainSystemNew_" .. name, (otherType and v) or (v and 1 or 2))
            setting[name] = v
        end
    end

    SendNUIMessage({
        type = "setting_info",
        data = setting
    })
    TriggerEvent("UI_Setting", setting)

    Citizen.Wait(3000)
    pocoS.FirstInfo({}, function(money, bank, credit, user_id, name, job, playerNum)
        if money and bank and credit and user_id and name and job then
            SendNUIMessage({
                type = "update_info",
                money = money,
                bank = bank,
                credit = credit,
                user_id = user_id,
                name = name,
                job = job
            })
        end
        if playerNum ~= nil then
            update({
                accessor = playerNum
            })
        end
    end)

    -- getServer()

    -- local storage = GetResourceKvpString("aquas_quickSlot") or "{}"
    -- -- 등록할꺼 정리
    -- local items = {}
    -- local storageTable = json.decode(storage) or {}
    -- for _,v in pairs(storageTable) do
    --     items[v] = true
    -- end
    -- pocoS.registerQuickSlot({items})
end

RegisterNUICallback("LoadSetting", LoadSetting)

RegisterNUICallback("SettingToggle", function(data, cb)
    if setting[data.name] ~= nil then
        if data.name == "selectUI" or data.name == "qslotAmount" then
            setting[data.name] = tonumber(data.value)
            SetResourceKvpInt("pocoMainSystemNew_" .. data.name, tonumber(data.value))
        else
            setting[data.name] = not setting[data.name]
            SetResourceKvpInt("pocoMainSystemNew_" .. data.name, (setting[data.name] and 1 or 0))
        end
        TriggerEvent("UI_Setting", setting)
        cb(setting[data.name])
    end
end)

-- 전역 UI 한방 끄기/켜기 이벤트
RegisterNetEvent("ui:hideAll")
AddEventHandler("ui:hideAll", function()
    showUILevel = 0  -- showUILevel 동기화
    SendNUIMessage({type = "LuaSet", id = "selectUI", value = 4})
    TriggerEvent("vrp_names_ex:changeShowUI", false)
    TriggerEvent("UI_Setting", { qslot = false })
    TriggerEvent("chat:changeShowUI", false)
    DisplayRadar(false)
    SendNUIMessage({
        type = "uiDisplay",
        ui_display = 0
    })
end)

RegisterNetEvent("ui:showAll")
AddEventHandler("ui:showAll", function()
    showUILevel = 4  -- showUILevel 동기화
    SendNUIMessage({
        type = "LuaSet",
        id = "selectUI",
        value = setting.selectUI or 1  -- 기본값 설정
    })
    TriggerEvent("UI_Setting", { qslot = setting.qslot or true })  -- 실제 설정 값 사용
    TriggerEvent("vrp_names_ex:changeShowUI", setting.nuiNames or true)  -- 실제 설정 값 사용
    TriggerEvent("chat:changeShowUI", true)
    DisplayRadar(true)
    SendNUIMessage({
        type = "uiDisplay",
        ui_display = 4
    })
end)


RegisterNUICallback("close", function()
    SetNuiFocus()
end)

function update(data)
    local UItable = {
        type = "update_info"
    }
    for key, value in pairs(data) do
        UItable[key] = value
    end
    SendNUIMessage(UItable)
end

RegisterNetEvent("HudUI_Update")
AddEventHandler("HudUI_Update", update)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(500)
        local ped = PlayerPedId()
        update({
            ["Hpbar"] = GetEntityHealth(ped),
            ["Apbar"] = GetPedArmour(ped)
        })
    end
end)

-- Citizen.CreateThread(function()
--     while true do
--         Citizen.Wait(2000)
--         getServer()
--     end
-- end)

RegisterNetEvent('pocoMainUI:setting_open')
AddEventHandler('pocoMainUI:setting_open', function()
    SendNUIMessage({
        type = "setting_open"
    })
    SetNuiFocus(true, true)
end)

local call_control_save = {}

RegisterNetEvent('pocoMainUI:AddRequest')
AddEventHandler('pocoMainUI:AddRequest', function(callname, title, message, callID, time)
    SendNUIMessage({
        type = "calladd",
        service_name = callname,
        name = title,
        msg = message,
        callID = callID,
        time = time
    })
    table.insert(call_control_save, callID)
    SetTimeout(time * 1000, function()
        controlSaveRemove(callID)
    end)
end)

RegisterNetEvent('pocoMainUI:RemoveRequest')
AddEventHandler('pocoMainUI:RemoveRequest', function(callID)
    SendNUIMessage({
        type = "callremove",
        id = callID
    })
    controlSaveRemove(callID)
end)

function controlSaveRemove(id)
    for index, callID in pairs(call_control_save) do
        if id == callID then
            table.remove(call_control_save, index)
            break
        end
    end
end

RegisterCommand("GUI_yes", function()
    if not setting.call or #call_control_save <= 0 then
        return
    end
    local callid = call_control_save[#call_control_save]
    TriggerServerEvent("vRP:requestResult", callid, true)
    TriggerEvent("pocoMainUI:RemoveRequest", callid)
end, false)

RegisterCommand("GUI_no", function()
    if not setting.call or #call_control_save <= 0 then
        return
    end
    local callid = call_control_save[#call_control_save]
    TriggerServerEvent("vRP:requestResult", callid, false)
    TriggerEvent("pocoMainUI:RemoveRequest", callid)
end, false)

local HUD_COMPONENTS = {1, 2, 3, 4, 6, 7, 8, 9, 13, 17, 20}

function hideHudComponents()
    for _, id in ipairs(HUD_COMPONENTS) do
        HideHudComponentThisFrame(id)
    end
end

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        hideHudComponents()
        local player = GetPlayerPed(-1)
        local inVehicle = GetVehiclePedIsIn(player, false)
        local playerCoords = GetPedBoneCoords(player, "SKEL_Spine0", 0, 0, 0)

        if IsControlJustPressed(0, 243) then
            local vehicleClass = GetVehicleClass(inVehicle)
            local isVehicleLocked = (inVehicle ~= 0) and (GetVehicleDoorLockStatus(inVehicle) > 1) or false

            SetCursorLocation(0.5, 0.5)
            SetNuiFocus(true, true)
            SendNUIMessage({
                type = "radiomenu",
                menuOpen = true,
                vehicle = inVehicle ~= 0,
                class = vehicleClass == 0,
                vehicle_lock = isVehicleLocked
            })
        end

        if isShowTalkerMarker then
            if lastVoice ~= voice then
                DrawMarkerAlpha = true
                increaseHeight = true
                heightOffset = 0
                DrawMarkerAlphaOffset = 150
                isShowTalkerMarkerTimer = 0
            end
            lastVoice = voice

            isShowTalkerMarkerTimer = isShowTalkerMarkerTimer + 1

            if isShowTalkerMarkerTimer > 300 then
                isShowTalkerMarker = false
            end

            local range, color = voice_list[voice][1], {255, 255, 255}
            if voice == 3 then
                color = {1, 255, 174}
            elseif voice == 4 then
                color = {251, 81, 149}
            elseif voice == 1 then
                color = {0, 0, 0}
                range = 0.3
            elseif voice == 2 then
                color = {51, 255, 255}
            end

            if increaseHeight then
                heightOffset = heightOffset + 0.002
                if heightOffset >= 0.4 then
                    increaseHeight = false
                end
            end

            if DrawMarkerAlpha then
                DrawMarkerAlphaOffset = DrawMarkerAlphaOffset - 1
                if DrawMarkerAlphaOffset <= 0 then
                    DrawMarkerAlpha = false
                end
            end

            DrawMarker(1, playerCoords.x, playerCoords.y, (playerCoords.z - 0) + heightOffset, 0, 0, 0, 0, 0, 0,
                range * 2, range * 2, -0.5, color[1], color[2], color[3], DrawMarkerAlphaOffset, 0, 0, 2, 0, 0, 0, 0)
            DrawMarker(1, playerCoords.x, playerCoords.y, (playerCoords.z - 0.05) + heightOffset, 0, 0, 0, 0, 0, 0,
                range * 2, range * 2, 0.5, color[1], color[2], color[3], DrawMarkerAlphaOffset, 0, 0, 2, 0, 0, 0, 0)
        end

        NetworkSetTalkerProximity(voice_list[voice][1])

        for _, controlIndex in ipairs(weaponSelectControlIndices) do
            DisableControlAction(0, controlIndex)
        end

        if inVehicle ~= 0 and (wasInCar or IsCar(inVehicle)) then
            if IsControlJustPressed(0, 303) then
                toggleVehiclebelt()
            end

            wasInCar = true
            DisableControlAction(0, 75)
            if IsDisabledControlJustPressed(0, 75) then
                local currentTime = GetGameTimer()
                if currentTime - lastPress < 200 then
                    if beltOn then
                        beltOn = false
                        if not vRP.isHandcuffed() then
                            SetEntityMaxSpeed(inVehicle, GetVehicleHandlingFloat(inVehicle, "CHandlingData",
                                "fInitialDriveMaxFlatVel"))
                            TaskLeaveVehicle(player, inVehicle, 4160)
                        end
                    else
                        beltOn = true
                    end
                else
                    if beltOn then
                        vRP.notify(
                            {"F를 빠르게 두번 누르면 벨트를 해제하고 빠르게 내릴 수 있어요!"})
                    else
                        if not vRP.isHandcuffed() then
                            SetEntityMaxSpeed(inVehicle, GetVehicleHandlingFloat(inVehicle, "CHandlingData",
                                "fInitialDriveMaxFlatVel"))
                            TaskLeaveVehicle(player, inVehicle, 4160)
                        end
                    end
                end
                lastPress = currentTime
            end

            if not isUiOpen and not IsPlayerDead(PlayerId()) then
                SendNUIMessage({
                    type = "seatbelt",
                    seatbelt = true
                })
                isUiOpen = true
            end

            speedBuffer[2] = speedBuffer[1]
            speedBuffer[1] = GetEntitySpeed(inVehicle)

            if speedBuffer[2] and not beltOn and GetEntitySpeedVector(inVehicle, true).y > 1.0 and speedBuffer[1] >
                19.25 and (speedBuffer[2] - speedBuffer[1]) > (speedBuffer[1] * 0.255) then
                local playerCoords = GetEntityCoords(player)
                local forwardVector = Fwv(player)

                SetEntityCoords(player, playerCoords.x + forwardVector.x, playerCoords.y + forwardVector.y,
                    playerCoords.z - 0.47, true, true, true)
                SetEntityVelocity(player, velBuffer[2].x, velBuffer[2].y, velBuffer[2].z)

                Citizen.Wait(1)
                SetPedToRagdoll(player, 1000, 1000, 0, 0, 0, 0)
            end

            velBuffer[2] = velBuffer[1]
            velBuffer[1] = GetEntityVelocity(inVehicle)
        elseif wasInCar then
            wasInCar = false
            beltOn = false
            speedBuffer[1], speedBuffer[2] = 0.0, 0.0

            if isUiOpen and not IsPlayerDead(PlayerId()) then
                SendNUIMessage({
                    type = "cruiser",
                    cruiser = false
                })
                SendNUIMessage({
                    type = "seatbelt",
                    seatbelt = false
                })
                isUiOpen = false
                vehicleCruiser = false
            end
        end
    end
end)

function Fwv(entity)
    local headingRadians = (GetEntityHeading(entity) + 90.0) * 0.0174533
    return {
        x = math.cos(headingRadians) * 2.0,
        y = math.sin(headingRadians) * 2.0
    }
end

function IsCar(veh)
    local vehicleClass = GetVehicleClass(veh)
    return (vehicleClass >= 0 and vehicleClass <= 7) or (vehicleClass >= 9 and vehicleClass <= 12) or
               (vehicleClass >= 17 and vehicleClass <= 20)
end

function toggleVehiclebelt()
    local ped = GetPlayerPed(-1)
    local vehicle = GetVehiclePedIsIn(ped, false)
    local class = GetVehicleClass(vehicle)

    local function isAllowedClass(class)
        for _, allowedClass in ipairs(allowedClasses.car) do
            if class == allowedClass then
                return true
            end
        end
        return false
    end

    if isAllowedClass(class) then
        beltOn = not beltOn
        SendNUIMessage({
            type = "seatbelt",
            seatbelt = not beltOn
        })
        isUiOpen = true
    else
        vRP.notify({"차량에서만 사용가능합니다."})
    end
end

RegisterNetEvent('pocoMainUI:openMarket')
AddEventHandler('pocoMainUI:openMarket', function(data)
    SendNUIMessage({
        type = "marketShow",
        market = data.type,
        data = data.data
    })
    SetNuiFocus(true, true)
end)

RegisterNUICallback("buy", function(data)
    if data and data.count and data.type and data.id then
        TriggerServerEvent("vRP:BuyMarket", data.count, data.type, data.id)
    end
end)

RegisterNUICallback(GetCurrentResourceName(), function()
    pocoS.nuiKick()
end)

Citizen.CreateThread(function()
    local vehicleIn = false

    while true do
        Citizen.Wait(100)
        local ped = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(ped, false)
        local vehicleClass = GetVehicleClass(vehicle)
        local vehicleClassName = findVehicleClassName(vehicleClass, allowedClasses)

        if setting.speedmeter and vehicleClassName and not IsPauseMenuActive() and IsPedInAnyVehicle(ped, false) then
            local carSpeed = GetEntitySpeed(vehicle)
            local carBrakeABS = (GetVehicleWheelSpeed(vehicle, 0) <= 0.0) and (carSpeed > 0.0)
            local carHandBrake = GetVehicleHandbrake(vehicle)
            local carGear = GetVehicleCurrentGear(vehicle)
            if carGear == 0 then
                carGear = "R"
            end
            local setGear = GetVehicleCurrentRpm(vehicle)
            local setRPM = GetVehicleCurrentRpm(vehicle)

            if setGear > 0.99 then
                setGear = setGear * 100
                setGear = setGear + math.random(-2.0, 2.0)
                setGear = setGear / 100
            end
            if setGear < 0.067 or not setGear then
                setGear = 0.067
            end
            setGear = (setGear / (12 / 8)) - 0.07
            if setGear > 0.8 then
                setGear = 0.8
            end
            if setGear < 0 then
                setGear = 0
            end
            local eng = GetIsVehicleEngineRunning(vehicle)
            if not eng then
                setGear = 0
            end

            local km = math.ceil(carSpeed * 3.6)
            if setGear < 0.1 and km == 0 then
                carGear = "N"
            end
            if not eng then
                carGear = "P"
            end

            SendNUIMessage({
                type = "speedmeter",
                veh = true,
                durability = math.floor(GetVehicleEngineHealth(vehicle) / 10),
                vehiclespeed = math.ceil(carSpeed * 3.6),
                vehiclegear = carGear,
                cartype = vehicleClassName,
                vehiclerpm = setRPM,
                handBrake = carHandBrake,
                CurrentCarABS = GetVehicleWheelBrakePressure(vehicle, 0) > 0 and not carBrakeABS
            })

            if not vehicleIn then
                vehicleIn = true
                TriggerEvent("pocoMainUI:speedmeterState", true)
            end
        else
            SendNUIMessage({
                type = "speedmeter",
                veh = false
            })

            if vehicleIn then
                vehicleIn = false
                TriggerEvent("pocoMainUI:speedmeterState", false)
            end

            Citizen.Wait(500)
        end
    end
end)

RegisterNetEvent("pocoMainUI:Mission")
AddEventHandler("pocoMainUI:Mission", function(target, thing)
    SendNUIMessage({
        type = "mission",
        target = target,
        thing = thing
    })
end)

RegisterNetEvent("pocoMainUI:MissionCancel")
AddEventHandler("pocoMainUI:MissionCancel", function()
    SendNUIMessage({
        type = "mission",
        stop = true
    })
end)

local isKeyLocked = {}

RegisterNUICallback("get_radialKey", function(_, callBack)
    callBack("`")
end)

function getServer()
    local storage = GetResourceKvpString("aquas_quickSlot") or "{}"
    storage = json.decode(storage)

    pocoS.Get_itemAmount({storage}, function(data)
        if data then
            SendNUIMessage({
                type = "user_amount",
                amount = data
            })
        end
    end)
end

function poco.updateQuickSlot(item, amount)
    local storage = GetResourceKvpString("aquas_quickSlot") or "{}"

    local data = {}
    for slotId, itemId in pairs(storage) do
        if itemId == item then
            data[slotId] = amount
        end
    end

    SendNUIMessage({
        type = "user_amount",
        amount = data
    })
end

RegisterNUICallback("NuiFocusFalse", function()
    SetNuiFocus(false, false)
end)
RegisterNUICallback("NuiFocusTrue", function()
    SetNuiFocus(true, true)
end)

RegisterNUICallback("radio_quickSlot", function()
    pocoS.getUserItem({}, function(data)
        if data then
            SendNUIMessage({
                type = "userInventory",
                itemData = data
            })
        end
    end)
end)

RegisterNUICallback("radio_voice_set", function(data)
    voice = data.voice
    isShowTalkerMarker = true
end)

RegisterNUICallback("save_quickSlot", function(data)
    local storage = GetResourceKvpString("aquas_quickSlot") or "{}"
    storage = json.decode(storage)
    storage["quick_" .. data.itemIndex] = data.itemName
    storage = json.encode(storage)
    SetResourceKvp("aquas_quickSlot", storage)

    -- 등록할꺼 정리
    local items = {}
    for _, v in pairs(storage) do
        items[v] = true
    end
    pocoS.registerQuickSlot({items})
end)

RegisterNUICallback("get_quickSlot", function(_, callBack)
    local storage = GetResourceKvpString("aquas_quickSlot") or "{}"
    storage = json.decode(storage)
    callBack(storage)
end)

RegisterNUICallback("save_quickSlotLength", function(data)
    SetResourceKvp("aquas_quickSlotLength", data)
end)

RegisterNUICallback("get_quickSlotLength", function(_, callBack)
    local storage = GetResourceKvpString("aquas_quickSlotLength") or nil
    callBack(storage)
end)

RegisterNUICallback("cooldownEnd", function(id)
    isKeyLocked[id] = true
end)

RegisterNUICallback("itemhasNot", function(id)
    isKeyLocked[id] = true
end)

for i = 1, 9 do
    local key = tostring(i)
    local keyName = "DOKKU" .. tostring(i)

    RegisterKeyMapping(keyName, "퀵슬롯 단축키 [" .. i .. "]", 'keyboard', key)
    RegisterCommand(keyName, function()
        itemkeyInput(i)
    end, false)
end

function check_state()
    return (GetEntityHealth(PlayerPedId()) > 121 and not vRP.isHandcuffed())
end

function itemkeyInput(id)
    if isKeyLocked[id] == nil then
        isKeyLocked[id] = true
    end

    if check_state() and isKeyLocked[id] then
        isKeyLocked[id] = false
        SendNUIMessage({
            type = "hasItem",
            key = id
        })
    end
end

RegisterNUICallback("hasItemResult", function(data)
    if data.hasItemResult then
        local player = GetPlayerPed(-1)
        if string.find(data.idName, "wbody|") then
            local weapon = string.gsub(data.idName, "wbody|", "")
            if HasPedGotWeapon(player, weapon, false) then
                isKeyLocked[data.key] = true
                return GiveWeaponToPed(player, weapon, 0, false, true)
            end
            GiveWeaponToPed(player, weapon, 0, false, true)
        end
        pocoS.itemUse({data})
    end
end)

RegisterNetEvent("itemUsed")
AddEventHandler("itemUsed", function(itemId, itemKey, itemCooldown)
    SendNUIMessage({
        type = "itemUseReload",
        itemId = itemId,
        itemKey = itemKey,
        itemCooldown = itemCooldown
    })
end)

RegisterNetEvent("itemAmountRefresh")
AddEventHandler("itemAmountRefresh", function(data)
    local player = GetPlayerPed(-1)
    SendNUIMessage({
        type = "refreshItem",
        itemAmount = data.amount,
        Id = data.key,
        Hpbar = GetEntityHealth(player),
        Apbar = GetPedArmour(player)
    })
end)

RegisterNUICallback("radio_inventory", function()
    if GetEntityHealth(PlayerPedId()) > 121 then
        -- pocoS.openinventory()
        TriggerEvent('domiInventory:open')
    else
        vRP.notify({"혼수 상태에서 사용할 수 없습니다."})
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(100)
        while not IsPedInAnyVehicle(PlayerPedId(), false) do
            Citizen.Wait(5000)
        end
        local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
        if vehicle then
            setSpeed(540, vehicle)
        end
    end
end)

function setSpeed(speed, vehicle)
    local vehicleClass = GetVehicleClass(vehicle)
    speed = speed / 3.6
    if vehicleClass ~= 16 and vehicleClass ~= 15 then
        SetVehicleMaxSpeed(vehicle, speed)
    end
end

function poco.one_getInfo(data)
    data.useGpu = GetConvarInt("nui_useInProcessGpu")
    SendNUIMessage({
        type = "one_userInfo",
        info = data
    })
end

RegisterNUICallback("radio_carlock", function()
    local ped = GetPlayerPed(-1)
    local vehicle = GetVehiclePedIsIn(ped, 0)
    if not IsEntityAVehicle(vehicle) then
        vRP.notify({"차량에 탑승해야 합니다."})
        return
    end
    if GetPedInVehicleSeat(vehicle, -1) ~= ped then
        vRP.notify({"운전석에 탑승 해야 합니다."})
        return
    end
    if GetVehicleDoorLockStatus(vehicle) > 1 then
        SetVehicleDoorsLocked(vehicle, 1)
        vRP.notify({"차량이 열림"})
    else
        SetVehicleDoorsLocked(vehicle, 2)
        vRP.notify({"차량이 잠김"})
    end
end)

RegisterNUICallback("radio_seatbelt", function()
    toggleVehiclebelt()
end)

function applyUIMode()
    local modes = {
        [4] = function()
            SendNUIMessage({
                type = "LuaSet",
                id = "selectUI",
                value = setting.selectUI
            })
            TriggerEvent("vrp_names_ex:changeShowUI", true)
            TriggerEvent("chat:changeShowUI", true)
            TriggerEvent("UI_Setting", {
                qslot = setting.qslot
            })
            DisplayRadar(true)
        end,
        [3] = function()
            SendNUIMessage({
                type = "LuaSet",
                id = "selectUI",
                value = setting.selectUI
            })
            TriggerEvent("chat:changeShowUI", true)
            TriggerEvent("chat:changeShowUI", true)
            TriggerEvent("vrp_names_ex:changeShowUI", false)
            TriggerEvent("UI_Setting", {
                qslot = setting.qslot
            })
            DisplayRadar(true)
        end,
        [2] = function()
            SendNUIMessage({
                type = "LuaSet",
                id = "selectUI",
                value = 4
            })
            TriggerEvent("chat:changeShowUI", true)
            TriggerEvent("UI_Setting", {
                qslot = false
            })
            DisplayRadar(true)
        end,
        [1] = function()
            SendNUIMessage({
                type = "LuaSet",
                id = "selectUI",
                value = 4
            })
            TriggerEvent("chat:changeShowUI", true)
            TriggerEvent("vrp_names_ex:changeShowUI", false)
            TriggerEvent("UI_Setting", {
                qslot = false
            })
            DisplayRadar(false)
        end,
        [0] = function()
            SendNUIMessage({
                type = "LuaSet",
                id = "selectUI",
                value = 4
            })
            TriggerEvent("chat:changeShowUI", false)
            TriggerEvent("vrp_names_ex:changeShowUI", false)
            TriggerEvent("UI_Setting", {
                qslot = false
            })
            DisplayRadar(false)
        end
    }

    modes[showUILevel]()
end

Citizen.CreateThread(function()
    isShowUI = true
    -- showUILevel은 이미 전역으로 선언되어 있음
    AddEventHandler("hudui:changeShow:hide", function()
        print("Hide UI Event Triggered")
        showUILevel = 0 -- 직접적으로 showUILevel을 설정하여 applyUIMode의 로직을 타게 함
        applyUIMode() -- applyUIMode를 호출하여 UI 설정 반영
        SendNUIMessage({
            type = "uiDisplay",
            ui_display = 0
        })
    end)

    AddEventHandler("hudui:changeShow:show", function()
        print("Show UI Event Triggered")
        showUILevel = 4 -- showUILevel을 초기 값으로 설정하여 applyUIMode의 로직을 타게 함
        applyUIMode() -- applyUIMode를 호출하여 UI 설정 반영
        SendNUIMessage({
            type = "uiDisplay",
            ui_display = showUILevel
        })
    end)

    while true do
        Citizen.Wait(0)
        if IsControlJustPressed(0, 182) and IsControlPressed(0, 21) then
            showUILevel = showUILevel - 1
            if showUILevel < 0 then
                showUILevel = 4
            end
            SendNUIMessage({
                type = "uiDisplay",
                ui_display = showUILevel
            })
            applyUIMode()
        end
    end
end)

-- 전역 변수 추가
local activePlayers = {}

local function playDice(player, number)
    -- client 플레이어를 찾을 수 없음
    if not NetworkIsPlayerActive(player) then
        return
    end

    local my_coords = GetEntityCoords(client.playerPed)
    local n_coords = GetEntityCoords(GetPlayerPed(player))

    -- 거리 안됨
    if GetDistanceBetweenCoords(my_coords, n_coords, true) > 10 then
        return
    end

    SendNUIMessage({
        type = "dicePlayerNew",
        id = player,
        number = number
    })

    local time = 500
    while time > 0 and not activePlayers[player].terminate do
        Wait(10)
        time = time - 1
        local nPlayerPed = GetPlayerPed(player)
        local my_coords = GetEntityCoords(client.playerPed)
        local n_coords = GetEntityCoords(nPlayerPed)

        local distance = GetDistanceBetweenCoords(my_coords, n_coords, true)

        local pedBone = GetPedBoneCoords(nPlayerPed, 31086, 0, 0, 0)
        local onScreen, _x, _y = World3dToScreen2d(pedBone.x, pedBone.y, pedBone.z + 0.45)

        if distance < 10 and onScreen then
            SendNUIMessage({
                type = "dicePlayerUpdate",
                id = player,
                show = true,
                x = _x * 100,
                y = _y * 100
            })
        else
            SendNUIMessage({
                type = "dicePlayerUpdate",
                id = player,
                show = false
            })
        end
    end

    SendNUIMessage({
        type = "dicePlayerRemove",
        id = player
    })

    activePlayers[player] = nil
end

function poco.playDice(data)
    local player = GetPlayerFromServerId(data.player)
    if player <= 0 then
        return
    end

    -- 중복된 플레이어 확인
    if activePlayers[player] ~= nil then
        -- 이전 함수 실행을 종료하기 위한 플래그 설정
        activePlayers[player].terminate = true
        Wait(50) -- 이전 함수가 완전히 종료되기를 기다림
    end

    -- 플레이어를 활성 플레이어 목록에 추가 및 플래그 초기화
    activePlayers[player] = {
        terminate = false
    }

    playDice(player, data.number)
end