import { Layer } from "@foreplay/client-core/src/classes/engine.layer";
import { OnInit } from "@foreplay/client-core/src/interfaces/basic.class.interface";

const bars = [
    {
        type: "health",
        text: "Health",
        backgroundColor: "rgba(255, 0, 0, 0.5)",
        frontColor: "rgba(255, 0, 0, 1)"
    },
    {
        type: "mana",
        text: "Mana",
        backgroundColor: "rgba(0, 0, 255, 0.5)",
        frontColor: "rgba(0, 0, 255, 1)"
    },
    {
        type: "XP",
        text: "XP",
        backgroundColor: "rgba(0, 255, 0, 0.5)",
        frontColor: "rgba(0, 255, 0, 1)"
    }
];

export class LayerHud extends Layer implements OnInit {

    private _currentOffset: { y: number } = { y: -300 };

    onInit() {
        this.addAnimation({from: this._currentOffset, to: { y: 0 }});
    }

    onDraw(delta: number, currentTime: DOMHighResTimeStamp) {
        // clean the layer
        this.context.clearRect(0, 0, this.engine.width, this.engine.height);

        this.drawStatusBars(delta);
    }

    drawStatusBars(delta: number) {
        const player = this.engine.state.game.player;
        const context = this.context;
        const offsetY = this._currentOffset.y

        context.strokeStyle = 'black';
        context.font = "bold 20px Arial";
        context.textAlign = "left";

        // if (this._currentOffset < 0) {
        //     this._currentOffset += (performance.now() - this._startTime) / 100;

        //     if (this._currentOffset > 0) {
        //         this._currentOffset = 0;

        //         // after animation is done, set to max 10 ticks per second
        //         this.options.maxTicksPerSecond = 10;
        //     }
        // }

        for (let i = 0, len = bars.length; i < len; i++) {
            const bar = bars[i];
            const textY = offsetY + 40 + (80 * i);
            const barY = offsetY + 50 + (80 * i);

            // shadow
            context.fillStyle = "rgba(0, 0, 0, 0.4)";
            context.fillText(bar.text, 20 - 2, textY - 1);

            // text
            context.fillStyle = '#FFFFFF';
            context.fillText(bar.text, 20, textY);

            let amount = 0;
            switch (bar.type) {
                case 'health':
                    amount = (player.health / player.healthMax);
                    break;
            }

            // bar
            context.fillStyle = bar.backgroundColor;
            context.fillRect(20, barY, 200, 25);
            context.fillStyle = bar.frontColor;
            context.fillRect(20, barY, 200 * amount, 25);
            context.strokeRect(20, barY, 200, 25);
        }
    }
}