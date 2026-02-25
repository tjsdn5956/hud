var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

function smallnotify_add(service_name, name, why, id, time) {
    if (!time) return;
    if ($('#smallnotify').css("opacity") <= 0) {
        $('#smallnotify').animate({
            opacity: 1,
            right: "20px"
        }, 250, "swing");
    }

    $('.nowcall').removeClass('nowcall'); // 현재 콜 지우기
    $("#smallnotify").append(`
    <div class="smallN_Mbox nowcall" id="Snotify-${id}" style="opacity: 0.0 !important">
        <div class="logo"></div>
        <div class="small_title">${service_name}</div>
        <div class="use_info">${name}</div>
        <div class="why_info"><span></span>${escapeHtml(why || "")}</div>
        <div class="times">${time}초</div>
        <div class="ok">수락: + ㅣ 거절: -</div>
    </div>
    `);
    $('#Snotify-' + id).animate({
        opacity: 1
    });
    // 사운드 재생
    var audio = new Audio("sound/notify_soft.mp3");
    audio.volume = 0.3;
    audio.play();
    var now_time = time;
    const Snotify_loop = setInterval(() => {
        now_time--;
        if (now_time <= 0) {
            clearInterval(Snotify_loop);
            smallnotify_remove(id);
            return;
        }
        $('#Snotify-' + id + ' .times').text("" + now_time + "초");
    }, 1000);
}

function smallnotify_remove(id) {
    if ($("#Snotify-" + id).length <= 0) return;
    // 사운드 재생
    $("#Snotify-" + id).attr("style", "opacity:0 !important;");
    $("#Snotify-" + id).css('transform', 'scale(0.7)');
    setTimeout(() => {
        $("#Snotify-" + id).remove();

        // 제일 최상위로 현재 콜 변경

        const elements = $('#smallnotify').children();
        if (elements.length < 1) {
            $('#smallnotify').animate({
                opacity: 0,
                right: "-350px"
            }, 250, "swing");
            return;
        }

        $('.nowcall').removeClass('nowcall'); // 현재 콜 지우기
        $(elements[elements.length - 1]).addClass("nowcall");
    }, 500);
}

function soundeffect(sound) {
    var audio = new Audio("https://poco.kr/cdn/sound/" + sound + ".mp3");
    audio.volume = 0.8;
    audio.play();
}


CallBack["calladd"] = (data) => {
    smallnotify_add(data.service_name, data.name, data.msg, data.callID, data.time);
}

CallBack["callremove"] = (data) => {
    smallnotify_remove(data.id);
}