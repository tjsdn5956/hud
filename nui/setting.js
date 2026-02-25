let setting = {}

setTimeout(() => {
    $.post(`https://${GetParentResourceName()}/LoadSetting`)
}, 5000);

CallBack["setting_open"] = (data) => {
    $(".main_box").show();
}

const otherTypeFields = new Set(["selectUI", "qslotAmount"]);
CallBack["setting_info"] = (data) => {
    for (const name in data.data) {
        setting[name] = data.data[name];
        UIupdate(otherTypeFields.has(name) ? setting[name] : setting[name] == 1, name);
        // console.log(name, data.data[name])
    }
}

CallBack.LuaSet = data => {
    if (data.value === 4) {
        $("#quickslotWrap").hide();
        $("#hudui").hide();
    } else {
        $("#quickslotWrap").show();
        $("#hudui").show();
    }
}

const SettingToggle = (name, value) => {
    if (setting[name] !== undefined) {
        $.post(`https://${GetParentResourceName()}/SettingToggle`, JSON.stringify({
            name : name,
            value : value
        }), result => {
            UIupdate(result, name);
        })
    }
}

$('select').on('change', function() {
    const id = $(this).val();

    SettingToggle("selectUI", id)
});

$(".close").click( function() {
    $(".main_box").hide();
    $.post(`https://${GetParentResourceName()}/close`);
});

$(".qslot_amount_btn").click(function() {
    const plus = Number($(this).data("plus"));
    const now = Number($("#qslot_amount").text());
    
    const changeVal = now + plus;
    if (changeVal < 1 || changeVal > 9)
        return;

    $("#qslot_amount").text(changeVal);
    SettingToggle("qslotAmount", changeVal);
});

function UIupdate(boolean, name) {
    if (setting[name] === undefined) return;

    if (boolean) $(`#${name}`).addClass("checked");
    else $(`#${name}`).removeClass("checked");

    switch (name) {
        case "quest":
            $(".mission").css("margin-right", boolean ? "-200px" : "0px").animate({
                "margin-right":  boolean ? "0px" : "-340px",
                "opacity": boolean ? 1 : 0
            });
            break;

        case "qslot":
            $(".qslot").animate({opacity: (boolean ? 1 : 0)}, 500);
            break;

        case "qslotAmount":
            $("#qslot_amount").text(boolean);
            break;

        case "hud_box":
            $(".hud_box").css("margin-bottom", boolean ? "-20px" : "0px").animate({
                "margin-bottom":  boolean ? "0px" : "-20px",
                "opacity": boolean ? 1 : 0
            });

            $(".qslot").animate({
                "bottom" : boolean ? "55px" : "15px"
            });
            break;

        case "call":
            $("#smallnotify").animate({opacity: (boolean ? 1 : 0)}, 500);
            break;

        case "property":
            boolean ? $(".dolphin-container .box").show() : $(".dolphin-container .box").hide();
            break;

        case "property":
            boolean ? $(".dolphin-container .box").show() : $(".dolphin-container .box").hide();
            break;

            
        case "selectUI":
            if (boolean <= 4) {
                $('select').val(boolean);
            }

            $(".binHudUI, .dolphin-container, .dolphin2-container, .hudContainer202508").hide();

            $('#quest, #qslot, #call, #nuiNames').closest('.box').show();
            $('#darkmode').closest('.box').find("span").first().html("<span>&nbsp;&nbsp;다크모드</span>");

            switch (boolean) {
                case 1:
                    $(".hudContainer202508").show();
                    TabDiv = ".hudContainer202508 ";
                    $('#darkmode').closest('.box').find("span").first().html("<span>&nbsp;&nbsp;다크모드(재산, 캐릭터 상태는 변경되지 않음.)</span>");
                    break;

                case 2:
                    $(".dolphin2-container").show();
                    TabDiv = ".dolphin2-container ";
                    $('#darkmode').closest('.box').find("span").first().html("<span>&nbsp;&nbsp;다크모드(재산, 캐릭터 상태는 변경되지 않음.)</span>");
                    break;

                case 3:
                    $(".dolphin-container").show();
                    TabDiv = ".dolphin-container ";
                    break;

                case 4:
                    $(".binHudUI").show();
                    TabDiv = ".binHudUI ";
                    $('#darkmode').closest('.box').find("span").first().html("<span>&nbsp;&nbsp;다크모드(재산, 캐릭터 상태는 변경되지 않음.)</span>");
                    break;

                default:
                    break;
            }

            CallBack["update_info"](GameUIInfo, true);
            break;
        case "darkmode":
            $(".dolphin-container > .money_wrap > #time").css({
                backgroundColor: boolean ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
                color: boolean ? "white" : "black",
                boxShadow: boolean ? '0px 0px 3px rgba(10, 10, 10, 0.9)' : '0px 0px 3px rgb(255 255 255 / 0%)'
            });
            $(".dolphin-container > .money_wrap > #title").css({
                backgroundColor: boolean ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
                color: boolean ? "white" : "black",
                boxShadow: boolean ? '0px 0px 3px rgba(10, 10, 10, 0.9)' : '0px 0px 3px rgb(255 255 255 / 0%)'
            });
            $(".dolphin-container > .money_wrap > .box").css({
                backgroundColor: boolean ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
                color: boolean ? "white" : "black",
                boxShadow: boolean ? '0px 0px 3px rgba(10, 10, 10, 0.9)' : '0px 0px 3px rgb(255 255 255 / 0%)'
            });
            $(".dolphin-container > .money_wrap > .job").css({
                background: boolean ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
                color: boolean ? "white" : "black",
                boxShadow: boolean ? '0px 0px 3px rgba(10, 10, 10, 0.9)' : '0px 0px 3px rgb(255 255 255 / 0%)'
            });
            
            $(".alertWork > ul").css({
                background: boolean ? 'rgba(10, 10, 10, 0.9)' : 'rgb(255 255 255 / 90%)',
                color: boolean ? "white" : "rgb(44, 44, 44)",
            })
            $(".alertWork > ul > .title").css({
                color: boolean ? "white" : "black",
            })
            break;
    
        default:
            break;
    }
}