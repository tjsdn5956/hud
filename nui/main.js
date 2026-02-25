setInterval(() => {
    getTime();
}, 1000);

function getTime() {
    var today = new Date();
    var YYYY = today.getFullYear()
    var MM = today.getMonth() + 1
    var DD = today.getDate(1)
    var day = today.getDay()
    var hh = ("0" + today.getHours()).slice(-2);
    var mm = ("0" + today.getMinutes()).slice(-2);
    var ss = ("0" + today.getSeconds()).slice(-2);
    var days = ["일", "월", "화", "수", "목", "금", "토"]
    if (!TabDiv) return;

    if (TabDiv === ".hudContainer202508 ") {
        $(TabDiv+"#time").text(hh + ":" + mm + " " + (hh < 12 ? "오전" : "오후"));
        $(TabDiv+"#day").text(DD <= 9 ? "0" + DD : DD);
        $(TabDiv+"#dayText").text(days[day] + "요일");
        $(TabDiv+"#monthText").text(MM + "월");
    } else {
        $(TabDiv+"#time").text(YYYY + "년 " + MM + "월 " + DD + "일 " + "(" + days[day] + ") " + hh + ":" + mm + ":" + ss)
    }
}

function checkKillDiv() {
    const $killActive = $(".alertWork kill active");

    if ($killActive.length >= 5) {
        $killActive.eq(0).remove();
    }
}

const addAlert = (title, text, img, src, type, killData) => {
    if (text === undefined) {
        text = title;
        title = undefined;
    }

    if (type === undefined && title !== undefined && title.indexOf(" 안내") !== -1) {
        const audio = new Audio('./sound/notify_soft.mp3');
        audio.volume = 0.1;
        audio.play();
    }

    const div = $(` 
        <ul class = "${type === "kill" ? type : "default"} start">
            ${img ? `<img src="${img}" onerror="this.style.display='none'">` : ""}${title ? `<div class="title">${title}</div>` : ""}${text ? `<div class="sub">${text}</div>` : ""} ${type === "kill"
            ? `${killData.killer} <img src="./img/weapon/${killData.img ? killData.img : ""}.webp" onerror="this.src='./img/weapon/default.webp'"> ${killData.death}` : ""}
        </ul>`);

    if (setting.darkmode) {
        $(div).css({
            background: setting.darkmode ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
            color: setting.darkmode ? "white" : "rgb(44, 44, 44)",
        })
        $(div).find(".title").css({
            color: setting.darkmode ? "white" : "black",
        })
    }

    $(".alertWork").append(div);

    checkKillDiv()

    setTimeout(()=>{
        div.addClass("active")
    }, 100);
    
    let time = null; // setTimeout을 관리하기 위한 변수

    if (src) {
        time = setTimeout(()=>{
            div.addClass("back");
            setTimeout(() => {
                div.remove();
            }, 500);
        }, src * 1000);
    }

    return {time : time, element : div}
}

let timer;
CallBack["uiDisplay"] = function (data) {
    let uiModeText = ["전체 숨김", "최소 표시", "HUD_UI 숨김", "이름 숨김", "모두 표시"]
    clearTimeout(timer);

    $("#alert").show(200, function () {
        timer = setTimeout(() => {
            $(this).hide(200)
        }, 2000)
    }).text(uiModeText[data.ui_display])
}

CallBack.addAlert = data => {
    addAlert(data.title, data.text, undefined, 20);
}

const stopAlert = data => {
    if (data && data.element) {
        data.element.addClass("back");
        setTimeout(() => {
            data.element.remove();
        }, 500);

        if (data.time) clearInterval(data.time);
    }
}

CallBack["killlog"] = data => {
    addAlert(undefined,undefined, undefined, 4, "kill", {
        killer : data.killer,
        death : data.death,
        img : data.weapon // "weapon_appistol.webp"
    })
}

const GameUIInfo = {
    money : 0,
    bank : 0,
    credit : 0,
    user_id : undefined,
    name : undefined,
    job : undefined,
    Eat : undefined,
    drink : undefined,
    Hpbar : undefined,
    Apbar : undefined,
    accessor : 0,
    job : ""
}

function comma(x) {
    var parts = x.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

let TabDiv = undefined;

const ChangeInfo = (origin_int, int, divTag) => {
    $({ val : origin_int }).animate({ val : int }, {
        duration: 200,
        step: function() {
            $(divTag).text(comma(parseInt(this.val)));
        },
        complete: function() {
            $(divTag).text(comma(parseInt(this.val)));
        }
    });
}

CallBack["update_info"] = (data, pass) => {
    if (pass || (TabDiv && data.money !== undefined && data.money != GameUIInfo.money)) ChangeInfo(GameUIInfo.money, data.money, TabDiv + "#money");
    if (pass || (TabDiv && data.bank !== undefined && data.bank != GameUIInfo.bank)) ChangeInfo(GameUIInfo.bank, data.bank, TabDiv + "#bank");
    if (pass || (TabDiv && data.credit !== undefined && data.credit != GameUIInfo.credit)) ChangeInfo(GameUIInfo.credit, data.credit, TabDiv + "#credit");

    GameUIInfo.money = data.money || GameUIInfo.money;
    GameUIInfo.bank = data.bank || GameUIInfo.bank;
    GameUIInfo.credit = data.credit || GameUIInfo.credit;

    ////////////////////////////////////////////////////////

    if (pass || (TabDiv && data.accessor !== undefined && data.accessor != GameUIInfo.accessor)) ChangeInfo(GameUIInfo.accessor, data.accessor, TabDiv + "#users");
    GameUIInfo.accessor = data.accessor || GameUIInfo.accessor;

    ////////////////////////////////////////////////////////

    if (TabDiv && data.job) $(TabDiv + "#userJob").text(data.job);
    if (TabDiv && data.user_id) $(TabDiv + "#userNumber").text(data.user_id);
    if (TabDiv && data.name) $(TabDiv + "#userName").text(data.name);

    GameUIInfo.job = data.job || GameUIInfo.job;
    GameUIInfo.user_id = data.user_id || GameUIInfo.user_id;
    GameUIInfo.name = data.name || GameUIInfo.name;

    ////////////////////////////////////////////////////////

    if (pass || (TabDiv && data.Eat !== undefined)) $(TabDiv + "#userThirsty").css(TabDiv === ".dolphin2-container " || TabDiv === ".binHudUI " || TabDiv === ".hudContainer202508 " ? "width" : "height", 100 - data.Eat + "%");
    if (pass || (TabDiv && data.drink !== undefined)) $(TabDiv + "#userHunger").css(TabDiv === ".dolphin2-container " || TabDiv === ".binHudUI " || TabDiv === ".hudContainer202508 " ? "width" : "height", 100 - data.drink + "%");

    GameUIInfo.Eat = data.Eat || GameUIInfo.Eat;
    GameUIInfo.drink = data.drink || GameUIInfo.drink;

    ////////////////////////////////////////////////////////

    if (pass || (TabDiv && data.Hpbar !== undefined)) {
        if (TabDiv === ".binHudUI ") {
            $(TabDiv + "#healthTxt").text(data.Hpbar - 100 + "%");
        } else $(TabDiv + "#userHp").css(TabDiv === ".dolphin2-container " || TabDiv === ".hudContainer202508 " ? "width" : "height", data.Hpbar - 100 + "%");
    }
    if (pass || (TabDiv && data.Apbar !== undefined)) {
        if (TabDiv === ".binHudUI ") {
            $(TabDiv + "#armorTxt").text(data.Apbar + "%");
        } else $(TabDiv + "#userAp").css(TabDiv === ".dolphin2-container " || TabDiv === ".hudContainer202508 " ? "width" : "height", data.Apbar + "%");
    }

    GameUIInfo.Hpbar = data.Hpbar || GameUIInfo.Hpbar;
    GameUIInfo.Apbar = data.Apbar || GameUIInfo.Apbar;

    ////////////////////////////////////////////////////////

    if (pass || (TabDiv && data.job !== undefined)) {
        $(TabDiv + "#userJob").text(data.job);
        $(".myJob").text(GameUIInfo.job);
    }
    GameUIInfo.job = data.job || "직업미선택";
}


$(document).on("keyup",function(e){
    if (e.key != "Escape") return;

    if ($(".market").is(":visible")) {
        $(".market #close").trigger("click")
    }
});

let isSeatbelt = false
let alertSeatbelt

let isEngineBroken = false
let alertEngintBroken

const radio_seatbelt = $("#radio_seatbelt")
const radio_carlock = $("#radio_carlock")
const seatBelt = $(".seatBeltWrap")
const vehicleSpeed = $("#speedmeter")
const setGear = $("#setGear")
const gear = ["P","R","N","1","2","3","4","5","6","7","8"]

// CallBack["seatbelt"] = function(data) {
//     const seatSound = document.getElementById("seatSound");
//     if (data.seatbelt == true) {
//         seatSound.volume = 0.2
//         seatSound.play()
//         isSeatbelt = false
//     } else if ( data.seatbelt == false) {
//         seatSound.pause()
//         seatSound.currentTime = 0
//         stopAlert(alertSeatbelt)
//         alertSeatbelt = null
//     }
// }

CallBack["seatbelt"] = function(data) {
    const seatSound = document.getElementById("seatSound");
    if (data.seatbelt === true) {
        seatSound.volume = 0.2;
        seatSound.play();
        isSeatbelt = false;
    } else if (data.seatbelt === false) {
        seatSound.pause();
        seatSound.currentTime = 0;
        if (alertSeatbelt) {
            stopAlert(alertSeatbelt);
            alertSeatbelt = null;
        }
    }
}

// 한번만 불러오는 유저 정보
CallBack["one_userInfo"] = function(data) {
    const info = data.info
    addAlert(`환영합니다. ${info.name}[${info.user_id}]님`,`게임에서 즐거운 시간 보내시길 바랍니다.`, "welcome.svg", 10); // alertStart("welcome.svg",`환영합니다. ${info.name}[${info.user_id}]님`,`게임에서 즐거운 시간 보내시길 바랍니다.`,10)
    
    if(!info.useGpu) addAlert("GPU 가속이 꺼져있습니다.", "파이브엠 설정 내 NUI in-process GPU 기능을 무조건 켜야 원활한 게임 이용이 가능합니다.", "settings.svg", 30) // alertStart("settings.svg", "GPU 가속이 꺼져있습니다.", "파이브엠 설정 내 NUI in-process GPU 기능을 무조건 켜야 원활한 게임 이용이 가능합니다.", 30)
      
    $("#userName").attr("data-userNumber",info.user_id)
    $("#userName").text(info.name)

    $(".myName").text(info.name)
    $(".myAge").text(info.age)
    $(".myNumber").text(info.user_id)
    $(".myPhonenumber").text(info.phone)
    $(".myCarNumber").text(info.car)
}

$(".copy").off().on("click",function(){
    const text = $(this).text()
    if($(this).hasClass("active")) return

    $(".copy").removeClass("active")

    $(this).addClass("active")
    textCopy(text)
})

$("#informationExit").off().on("click",function(){
    $("#myinformationWrap").hide()
    $.post("https://"+GetParentResourceName()+`/NuiFocusFalse`)
})

function textCopy(text) {
    var input = document.createElement('textarea')
    input.innerHTML = text
    document.body.appendChild(input)
    input.select()
    var result = document.execCommand('copy')
    document.body.removeChild(input)
    addAlert(`"${text}" 복사완료!`, "Ctrl + V 를 하여 붙여넣기를 할 수 있습니다.", "settings.svg", 30); // alertStart("clipboard.svg", `"${text}" 복사완료!`, "Ctrl + V 를 하여 붙여넣기를 할 수 있습니다.", 5)
    return result
}

// 속도계
CallBack["speedmeter"] = function(data) {
    const $speedmeterWrap = $("#speedmeterWrap")
    const $seatBelt = $(".seatBeltWrap")
    const $durability = $("#Durability")
    const $durabilityBox = $(".durabilityBox")
    const $quickslotWrap = $("#quickslotWrap")
    const $userStateWrap = $("#userStateWrap")
    const $niddle = $("#niddle")
    const $niddleBox = $(".niddleBox")
    const $vehicleSpeed = $("#speed")
    const carType = data.cartype
    const Lua_durability = data.durability
    const MIN_RPM = 0.1
    const MAX_RPM = 1

    $seatBelt.hide()
    radio_seatbelt.hide()

    $("#CurrentCarABS").removeClass("on")
    switch(carType){
        case "car":
            radio_seatbelt.show()
        break
    }

    if (data.veh) { // 차량 속도계 ON
        if (!isSeatbelt && !alertSeatbelt) {
            alertSeatbelt = addAlert("안전벨트를 착용하세요. [단축키 U]", "안전이 최우선, 반드시 안전벨트 착용 바랍니다.", "./img/modal/seatbelt.svg")
            isSeatbelt = true
        }
        $speedmeterWrap.addClass("show")
        $quickslotWrap.addClass("active")
        $userStateWrap.addClass("active")
        radio_carlock.show()
    } else { // 아님
        $speedmeterWrap.removeClass("show")
        $quickslotWrap.removeClass("active")
        $userStateWrap.removeClass("active")
        radio_carlock.hide()
        isEngineBroken = false
        
        if (alertSeatbelt) {
            stopAlert(alertSeatbelt);
            alertSeatbelt = null;
        }

        return // 꺼져있으면 정보 안바꿈
    }

    // 기어표시
    if(data.vehiclegear){
        gear.forEach(function(v,i) {
            if(data.vehiclegear == v && data.vegiclegear != i){
                setGear.children("li").css("transform",`translateY(${-30*i}px)`)
            }
        })
    }

       // 차량 내구도 바
    if(Lua_durability != ($durability.width() / 180) * 100){
        $durability.css("width",Lua_durability+"%")

        $durability.attr("class","")
        $vehicleSpeed.removeClass("fail")
        $durabilityBox.removeClass("fail")

        if(Lua_durability >= 70){
            $durability.addClass("nice")
            isEngineBroken = false
        }else if(Lua_durability >= 30){
            $durability.addClass("good")
        }else if(Lua_durability > 10){
            $durability.addClass("bad")
        }
    }

    if(Lua_durability <= 10){
        $durability.addClass("bad")
        $vehicleSpeed.addClass("fail")       
        $durabilityBox.addClass("fail")
        $niddleBox.css("transform", `translate(-50%,-50%) rotate(0deg)`)
        $niddle.css("stroke-dashoffset",`420`)
        $vehicleSpeed.text("엔진 고장")
        if(!isEngineBroken){
            isEngineBroken = true
            alertEngintBroken = addAlert("엔진 고장", "엔진이 고장났어요. 빠르게 정비공을 호출해서 수리를 받으세요. 길 위에 다시 나갈 수 있도록 해줄 거예요.", undefined, 10)
        }
        return false
    }

    // RPM 조절

    let carRpm = data.vehiclerpm;

    if (carRpm >= 0.95) {
      carRpm = MAX_RPM - (Math.random() / 10);
    } else if (carRpm <= 0.21) {
      carRpm = MIN_RPM - (Math.random() / 100);
    }

    $niddle.toggleClass("active", carRpm >= 0.8);

    const carRpmslope = (240 * carRpm) - 120;
    const carRpmsline = (420 * carRpm) - 420;
    
    $niddleBox.css("transform", `translate(-50%,-50%) rotate(${carRpmslope}deg)`);
    $niddle.css("stroke-dashoffset",`${carRpmsline}`);

    // 속도표시
    if(data.vehiclespeed != $vehicleSpeed.text()){

        const x = $vehicleSpeed.text()
        const y = data.vehiclespeed

        $({ val : x }).animate({ val : y }, {
            duration: 100,
           step: function() {
            $($vehicleSpeed).text(Math.floor(this.val))
           },
           complete: function() {
             $($vehicleSpeed).text(Math.floor(this.val))
           }
         })
    }
}

CallBack["mission"] = data => {
    const $mission = $(".mission");
    if (data.stop) {
        $mission.addClass("back");
        
        setTimeout(() => {
            $mission.removeClass("active back");
            $mission.hide();
        }, 500);
        return
    }
    
    $("ul .text").text(data.target);

    let html = "";
    $.each(data.thing, function(_, name) {
        if (!name) return;
        html += `<div>- ${name}</div>`;
    })

    $mission.find(".thing").html(html);
    
    $mission.show();
    setTimeout(()=>{
        $mission.addClass("active start");
    },100);
}

const quickslotSettingWrap = $("#quickslotSettingWrap");
const radioWrap = $("#radioWrap");
const myinformationWrap = $("#myinformationWrap")

CallBack["radiomenu"] = function(data){
    if(data.menuOpen) {
        radioWrap.addClass("show")
        // 차량 탑승 시 주사위 숨김, 아니면 표시
        if (data.vehicle) {
            $("#radio_Dice").hide();
            if (data.vehicle_lock)
                radio_carlock.text("차량 문 열기")
            else
                radio_carlock.text("차량 문 잠그기")
        } else {
            $("#radio_Dice").show();
        }
    } else {
        // 메뉴 닫힐 때 항상 주사위 보이게 복구
        $("#radio_Dice").show();
    }
}

$.post("https://"+GetParentResourceName()+`/get_radialKey`,{},function(result){
    radialKey = result;
})

// 레디얼 메뉴 작동 취소 할때
$(document).on("keyup",function(e){

    if(e.key.toUpperCase() == radialKey.toUpperCase() && 
    $(".main_box").css("display") == "none" &&
    myinformationWrap.css("display") == "none" &&
    quickslotSettingWrap.css("display") == "none"
    ){
       radialMenuClose();
    }
})

function radialMenuClose() {
    $.post("https://"+GetParentResourceName()+`/NuiFocusFalse`);
    radioWrap.removeClass("show");
}

$(".radialMenu").off().on("click",function(){
    const Idx = $(this).attr("id")
    radialMenuSet(Idx)
});

const radialMenuSet = function(Idx){

    radioWrap.removeClass("show")

    switch(Idx){
        case "radio_ui":
            CallBack["setting_open"]();
        break
        case "radio_seatbelt":
            $.post("https://"+GetParentResourceName()+`/radio_seatbelt`)
        break
        case "radio_carlock":
            $.post("https://"+GetParentResourceName()+`/radio_carlock`)
        break
        case "radio_inventory":
            radialMenuClose();
            $.post("https://"+GetParentResourceName()+`/radio_inventory`);
        break
        case "radio_Lucky":
            fortune()
        break
        case "radio_Dice":
            $.post("https://"+GetParentResourceName()+`/radio_dice`,JSON.stringify({randomNum : Math.floor(Math.random() * 6) + 1})) 
        break
        case "radio_myinformation":
            myinformationWrap.show()
        break
        case "radio_quickSlot":
            if( $(".cooldown").length > 0 ){
                return addAlert("쿨타임", "퀵슬롯의 모든 쿨다운이 완료되어야 해당 인터페이스를 열 수 있습니다.", "./img/modal/hourglass.svg", 5);
            }else{
                $.post("https://"+GetParentResourceName()+`/radio_quickSlot`)
                quickslotSettingWrap.show()
            }
        break
    }
}

CallBack["user_amount"] = function(data) {
    const amount = data.amount

    $.each(amount,function(el,index){

        const Number = parseInt(el.replace(/\D/g, ''), 10);
        
        if(el){
            $(".sortable").eq(Number).children(".item").attr("data-itemAmount",index)
        }
    })
}

CallBack["userInventory"] = function(data){

    const userInventory = data.itemData

    userInventory.sort((a, b) => {if (a.itemName < b.itemName) {return -1} else if (a.itemName > b.itemName) {return 1} return 0;});

    const $slotSetting = $("#quickslotSettingWrap")
    let appendData = '';

    for(el of userInventory){
        appendData += `<div class="item" data-itemname="${el.itemName}" data-itemAmount="${el.itemAmount}" style="background-image: url(./img/quick/${el.itemName.replace("|", "")}.png);"></div>`
    }

    $slotSetting.children("#quickslotItems").html(appendData)
    sortableEvent()
}

function sortableEvent() {

    $('.item').draggable({
        helper: 'clone',
        scroll: false,
        connectToSortable: '.sortable',
    });

    $('.sortable').sortable({
        connectWith: ".sortable",
        start: function (e, _) {
            $(e.target).removeClass("active");
        },
        update: function (e, ui) {
    
            if ($(e.target).hasClass('sortable')) {
                var movedItem = $(e.target).children('.item').not(ui.item);
                $(movedItem).remove();
            }
    
            // Check for duplicate data-itemName
            const itemName = $(ui.item).attr('data-itemname');
            const duplicates = $('.sortable').children(`[data-itemname="${itemName}"]`).not(ui.item);
    
            if (duplicates.length > 0) {
                duplicates.eq(0).remove();
            }

            $(".sortable").each(function(index,elemnet){
                if($(elemnet).children(".item").length == 0){
                    $.post("https://"+GetParentResourceName()+`/save_quickSlot`,JSON.stringify({itemIndex:index,itemName:undefined})) 
                }
            })

            $.post("https://"+GetParentResourceName()+`/save_quickSlot`,JSON.stringify({itemIndex:$(e.target).index(),itemName:itemName})) 
            
            updateCustomClass()
        },
    });
}

function updateCustomClass() {

    $(".sortable").each(function(_,element){
        if($(element).children(".item").length > 0){
            $(element).addClass("active")
        }else{
            $(element).removeClass("active")
        }
    })
}

$(".box").on("contextmenu", function (event) {
    event.preventDefault(); // 기본 동작 취소 (우클릭 메뉴 표시 방지)

    if($("#quickslotSettingWrap").is(":visible")){
        var _this = $(this)
        if (_this.hasClass("sortable")) {
            _this.removeClass("active");
            _this.children(".item").remove()
            $.post("https://"+GetParentResourceName()+`/save_quickSlot`,JSON.stringify({itemIndex:_this.index(),itemName:undefined})) 
        }
    }    
});

$(".quickLengthBtn").on("click",function(){
    const sortable = $(".sortable")
    const sortableLength = $(".sortable:visible").length;
    const btnType = $(this).attr("id")

    if(btnType == "plus" && sortableLength <= 9){
        sortable.eq(sortableLength).show()
    }else if(btnType == "minus" && sortableLength > 1){
        sortable.eq(sortableLength-1).hide()
    }

    $.post("https://" + GetParentResourceName() + "/save_quickSlotLength", JSON.stringify($(".sortable:visible").length))

})

// 퀵슬롯 개수 로드
$.post("https://"+GetParentResourceName()+`/get_quickSlotLength`,{},function(result){
    if(result){
        $(".sortable").hide()
        for(i=0; i<result; i++){
            $(".sortable").eq(i).show()
        }
    }else{
        $(".sortable").show()
    }
})

// 퀵슬롯 데이터 로드
$.post("https://"+GetParentResourceName()+`/get_quickSlot`,{},function(result){
    const $sortable = $(".sortable")

    $.each(result,function(itemIndex,itemName){
        const number = parseInt(itemIndex.replace(/\D/g, ''), 10);
        if(itemName !== undefined){
            $sortable.eq(number).html(`<div class="item" data-itemname="${itemName}" style="background-image: url(./img/quick/${itemName.replace("|", "")}.png);"></div>`)
        }
    })

    updateCustomClass()
});


// 등록된 아이템 항목 있는지 체크
CallBack["hasItem"] = function(data){
    const isItem = $(".sortable").eq(data.key-1).children(".item");
    
    if (isItem.length == 0 || isItem.hasClass('cooldown-active')) {  // 등록된 아이템이 없거나 쿨타임 중인 경우
      return $.post("https://" + GetParentResourceName() + "/itemhasNot", JSON.stringify(data.key));
    } else if (isItem.attr("data-itemamount") == 0) {  // 등록은 되어 있지만 아이템이 없을 경우
      return $.post("https://" + GetParentResourceName() + "/itemhasNot", JSON.stringify(data.key));
    }
  
    $.post("https://" + GetParentResourceName() + "/hasItemResult", JSON.stringify({ 
      hasItemResult: true, 
      key: data.key,
      idName: isItem.attr("data-itemname")
    }));
  }
CallBack["itemUseReload"] = function(data){
    reloadEvent(data.itemId,data.itemKey,data.itemCooldown)
}


// 키 이벤트
CallBack["refreshItem"] = function(data){

    $(".sortable").eq(data.Id-1).children(".item").attr("data-itemamount",data.itemAmount)

    const userHp = $("#userHpBox")
    const userAp = $("#userApBox")
    const userHp_mask = $("#mask-hp")
    const getServer_userHp = data.Hpbar
    const getServer_userAp = data.Apbar
    // const getServer_userEat = data.Eat
    // const getServer_userDrink = data.Drink
    // const userEat = $("#userEatGauge")
    // const userDrink = $("#userDrinkGauge")

    const widthOrHeight = TabDiv === ".hudContainer202508 " ? "height" : "width";
    
    if(getServer_userHp){
        if(getServer_userHp <= 120){
            userHp.attr("data-userHp","0%")
            userHp.children("p").css(widthOrHeight,"0%")
            userHp_mask.css("y","0%")
        }else{
            userHp.attr("data-userHp",data.Hpbar-100+"%")
            userHp.children("p").css(widthOrHeight,data.Hpbar-100+"%")
            userHp_mask.css("y",100-(data.Hpbar-100)+"%")
        }
    }

    if(getServer_userAp){
        userAp.attr("data-userAp",data.Apbar+"%")
        userAp.children("p").css(widthOrHeight,data.Apbar+"%")
    }

    // const x = (100-getServer_userEat).toFixed(0)
    // userEat.css("width",x+"%")

    // const y = (100-getServer_userDrink).toFixed(0)
    // userDrink.css("width",y+"%")
}

let timers = {};

// 기존 reloadPromise 함수 유지
const reloadPromise = function() {
  return Promise.resolve()
}

// 특정 아이템 목록 설정
const cooldownItems = ['jtjc', 'jtjc_NEW'];

// reloadEvent 함수 수정
const reloadEvent = function(name, key, second) {
  reloadPromise()
    .then(() => {
      if (timers[name]) {
        cancelAnimationFrame(timers[name])
      }

      // jtjc와 jtjc_NEW에만 쿨타임 처리
      let targetBoxes;
      if (cooldownItems.includes(name)) {
        targetBoxes = $(`.item[data-itemname='jtjc'], .item[data-itemname='jtjc_NEW']`);
      } else {
        targetBoxes = $(`.item[data-itemname='${name}']`);
      }

      targetBoxes.prepend(`
        <div class="cooldown">
          <p class="cooldown__text">${(second)}</p>
          <svg class="circleFill" style="transition-duration: ${(second)}s">
            <circle cx="50%" cy="50%" r="50%" stroke="rgba(0,0,0,0.5)" stroke-width="100%" fill="none"></circle>
          </svg>
        </div>
      `);

      // 쿨타임 동안 해당 아이템의 키 비활성화
      if (cooldownItems.includes(name)) {
        targetBoxes.addClass('cooldown-active');
      }

      return targetBoxes;
    })
    .then((targetBoxes) => {
      setTimeout(() => {
        targetBoxes.find(".circleFill").attr("class", "circleFill filled")
      }, 10);

      let timer = (second);
      let timeElapsed = 0;
      let prevTimestamp = null;

      const updateTimer = (timestamp) => {
        if (!prevTimestamp) prevTimestamp = timestamp;
        const delta = timestamp - prevTimestamp;
        prevTimestamp = timestamp;
        timeElapsed += delta / 1000;

        timer = Number((second) - timeElapsed);
        const cooldownText = targetBoxes.find(".cooldown__text");

        if (timer <= 0) {
            cancelAnimationFrame(timers[name]);
            targetBoxes.children(".cooldown").addClass("remove");
            setTimeout(() => {
                targetBoxes.children(".cooldown").remove();
                if (cooldownItems.includes(name)) {
                  targetBoxes.removeClass('cooldown-active'); // 쿨타임 종료 후 아이템 사용 가능하게
                }
                $.post("https://"+GetParentResourceName()+`/cooldownEnd`,JSON.stringify(key));
            }, 300);
        } else {
          requestAnimationFrame(updateTimer);
          if (timer < 1) {
            cooldownText.text(timer.toFixed(1));
          } else {
            cooldownText.text(timer.toFixed(0));
          }
        }
      }

      if (timers[name]) {
        cancelAnimationFrame(timers[name]);
      }
      prevTimestamp = null;
      timers[name] = requestAnimationFrame(updateTimer);
    });
}


  

$("#quickslotSettingExit").off().on("click",function(){
    $("#quickslotSettingWrap").hide()
    $.post("https://"+GetParentResourceName()+`/NuiFocusFalse`)
})

// 음성범위 조절
$("#radio_voice_set").children("li").off().on("click",function(){
    const Idx = $(this).index()

    if($(this).hasClass("active")) {
        return
    }

    $("#radio_voice_set").children("li").removeClass("active")
    $(this).addClass("active")
    
    $.post("https://"+GetParentResourceName()+`/radio_voice_set`,JSON.stringify({voice:Idx+1})) 
});