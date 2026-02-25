class DicePlayer {
    static instance;

    constructor() {
        if (DicePlayer.instance) {
            return DicePlayer.instance;
        }
        DicePlayer.instance = this;
        this.container = $("#container");
    }

    new({ id, number }) {
        this.remove({ id });
        this.rollDice(id, number);
    }

    rollDice(id, number) {
        const diceElement = $(`<section class="headupDisplay ID-${id}"></section>`);
        this.container.append(diceElement);

        this.rollDiceAnimation(id, number);
    }

    rollDiceAnimation(id, number) {
        const diceElement = $(`.ID-${id}`);
        const animationInterval = 75;
        const duration = 2000;
        
        const interval = setInterval(() => {
            const randomDiceNumber = Math.floor(Math.random() * 6) + 1;
            diceElement.css('background-image', `url('./img/dice/dice_${randomDiceNumber}.svg')`);
        }, animationInterval);

        setTimeout(() => {
            clearInterval(interval);
            diceElement.css('background-image', `url('./img/dice/dice_${number}.svg')`);
        }, duration);
    }

    update({ id, show, x, y }) {
        const diceElement = $(`.ID-${id}`);
        if (show) {
            diceElement.show().css({ left: `${x}%`, top: `${y}%` });
        } else {
            diceElement.hide();
        }
    }

    remove({ id }) {
        $(`.ID-${id}`).remove();
    }
}
