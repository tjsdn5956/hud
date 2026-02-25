const market = {
    type: undefined,

    buy: (type, id, count) => {
        console.log("event: " + type + ", id: " + id + " count:" + count);
        $.post(`https://${GetParentResourceName()}/buy`, JSON.stringify({
            type: type,
            id: id,
            count: count
        })/*, (result) => {

        }*/);
    },

    show: data => {
        market.type = data.market;
        let html = "";

        $.each(data.data, (_, item) => {
            html += `
                <div class="item" data-id="${item.id}" data-price="${item.amount}">
                    <img src="${item.url}" alt="">
                    <span id="itemName">${item.name}</span>
                    <div>
                        <button class="minusBtn">-</button>
                        <input type="text" class="numberInput" value="1">
                        <button class="plusBtn">+</button>
                    </div>
                    <span class="amount">${comma(parseInt(item.amount))}원</span>
                    <button id="buyBox">구매</button>
                </div>
            `
        });

        $(".market h1").text(`버블 상점 (${data.market})`);
        $("#marketList").html(html);
        $(".market").show();
    }
}

$(document).on("click", ".market #close", function(){
    $(".market").hide();
    $.post(`https://${GetParentResourceName()}/close`);
});

$(document).on("click", ".market #buyBox", function(){
    const objParent = $(this).parent();
    const id = objParent.data("id");
    const type = market.type;
    if (!id || type === undefined) return;
    
    const count = objParent.find("input").val();

    market.buy(type, id, count);
});

CallBack["marketShow"] = market.show;

$(document).on('click', '.market .minusBtn', decreaseValue);
$(document).on('click', '.market .plusBtn', increaseValue);
$(document).on('input', '.market .numberInput', restrictInput);
$(document).on('blur', '.market .numberInput', resetValue);

function decreaseValue() {
    var input = $(this).siblings('.numberInput');
    var value = parseInt(input.val());

    if (value > 1) {
        input.val(value - 1);
    }
    updateAmount(input);
}

function increaseValue() {
    var input = $(this).siblings('.numberInput');
    var value = parseInt(input.val());

    if (value < 500) {
        input.val(value + 1);
    }
    updateAmount(input);
}

function restrictInput() {
    this.value = this.value.replace(/[^0-9]/g, '');
    updateAmount($(this));
}

function resetValue() {
    var value = parseInt($(this).val());

    if (isNaN(value) || value <= 0) {
        $(this).val(1);
    } else if (value > 500) {
        $(this).val(500);
    }
    
    updateAmount($(this));
}

function updateAmount(input) {
    var item = input.closest('.item');
    var price = parseInt(item.data('price'));
    var value = parseInt(input.val());
    if (value <= 0) value = 1;
    if (value > 500) value = 500;

    var amount = price * value;
    item.find('.amount').text(amount.toLocaleString() + '원');
}
