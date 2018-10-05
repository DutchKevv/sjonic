import { Scene } from "@foreplay/client-core/src/classes/engine.scene";
import { LayerMenu } from "../../layers/game.layer.menu";

export class SceneMenu extends Scene {

    async onInit() {
        await this.addChild(new LayerMenu({
            style: {
                alpha: true,
                center: true
            }
        }));
    }
}