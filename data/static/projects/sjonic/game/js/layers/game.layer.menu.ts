import { Layer } from "@foreplay/client-core/src/classes/engine.layer";
import { OnInit } from "@foreplay/client-core/src/interfaces/basic.class.interface";
import { Button } from "@foreplay/client-core/src/classes/engine.button";
import { LayerMain } from "./game.layer.main";
import { LayerHud } from "./game.layer.hud";
import { PlayerSelfGame } from "../objects/game.player-self";
import { Drawable } from "@foreplay/client-core/src/classes/engine.drawable";
import { Scene } from "@foreplay/client-core/src/classes/engine.scene";
import { TextInput } from "@foreplay/client-core/src/classes/engine.form.input";
import { PlayerSelf } from "@foreplay/client-core/src/classes/engine.player.self";
import { Arrow } from "@foreplay/client-core/src/classes/shapes/engine.shape.arrow"

export class LayerMenu extends Layer implements OnInit {

    public onInit(): Promise<void> {
        return this._showMainMenu();
    }

    /**
     * MAIN MENU
     */
    private async _showMainMenu(): Promise<void> {
        this.clear();

        const container = new Drawable({
            width: 300,
            height: 150,
            style: {
                center: true
            }
        });

        await this.addChild([container]);

        const buttonStart = new Button({
            text: 'Play',
            onClick: () => this._showCharacterSelectMenu(),
            position: { x: 0, y: 0 }
        });

        const buttonExit = new Button({
            text: 'Exit',
            onClick: () => this._exitGame(),
            position: { x: 0, y: 100 },
            backgroundColor: 'grey',
        });

        await container.addChild([buttonStart, buttonExit]);
    }

    /**
     * CHARACTER SELECT MENU
     */
    private async _showCharacterSelectMenu() {
        this.clear();

        const characters = <any>await this.engine.http.get('/character');
        const buttons = [];

        const buttonBack = new Arrow({
            position: { x: 100, y: 40, },
            toPosition: { x: 20, y: 40 },
            headSize: 30,
            onClick: () => this._showMainMenu()
        });

        const container = new Drawable({
            width: 300,
            height: 50 + ((characters.length) * 100),
            style: {
                center: true
            }
        });

        await this.addChild([buttonBack, container]);

        for (let i = 0, len = characters.length; i < len; i++) {
            const character = characters[i];

            const button = new Button({
                text: character.name,
                position: { x: 0, y: 0 + (i * 100) },
                onClick: () => this._startGame(button.options.data.characterId),
                data: {
                    characterId: character._id
                }
            });

            buttons.push(button);
        }

        const createCharacterButton = new Button({
            text: 'Create character',
            position: { x: 0, y: 0 + (characters.length * 100) },
            backgroundColor: 'blue',
            fontColor: 'white',
            onClick: () => this._showCharacterCreateMenu()
        });

        buttons.push(createCharacterButton);

        await container.addChild(buttons);
    }

    /**
     * CHARACTER CREATE MENU
     */
    private async _showCharacterCreateMenu() {
        this.clear();

        const buttonBack = new Arrow({
            position: { x: 100, y: 40, },
            toPosition: { x: 20, y: 40 },
            headSize: 30,
            onClick: () => this._showCharacterSelectMenu()
        });

        const container = new Drawable({
            width: 300,
            height: 250,
            style: {
                center: true
            },
            onClick: () => this._showCharacterCreateMenu()
        });

        await this.addChild([buttonBack, container]);

        const playerSelf = new PlayerSelf({
            position: { x: 400, z: 0, y: 50, r: 1 }
        });

        const textInput = new TextInput({
            placeholder: 'name',
            position: { x: 0, y: 0 }
        });

        const submitButton = new Button({
            text: 'Create',
            position: { x: 0, y: 100 },
            backgroundColor: 'blue',
            fontColor: 'white',
            onClick: async () => {
                try {
                    const character: any = await this.engine.http.post('character', { body: { name: textInput.value } });
                    this._startGame(character._id);
                } catch (error) {
                    console.error(error);
                    alert(JSON.stringify(error))
                }
            }
        });

        await container.addChild([textInput, submitButton, playerSelf]);
    }

    /**
     * MAIN GAME 
     * 
     * @param characterId 
     */
    private async _startGame(characterId) {
        try {
            this.clear();

            this.engine.options.credentials.characterId = characterId;

            // hide menu
            this.toggle(false);

            // load character
            const character = await new Promise((resolve, reject) => {
                this.engine.socket.emit('character-switch', this.engine.options.credentials.characterId, (error: any, character: any) => {
                    if (error) return reject(error);
                    resolve(character);
                });
            });

            // add user player
            await this.engine.setPlayerSelf(new PlayerSelfGame(character));

            // add game scene
            const gameScene = new Scene({});
            await this.engine.addChild(gameScene, 1);

            const layerGame = new LayerMain({ style: { alpha: false, center: true }, id: Layer.TYPE_GAME });
            const layerHud = new LayerHud({ style: { alpha: true }, id: Layer.TYPE_HUD });
            await gameScene.addChild([layerGame, layerHud]);
        } catch (error) {
            console.error(error);
        }
    }

    private _drawBackButton() {

    }

    private _exitGame() {
        alert('exit!!');
    }

    private _drawBackground() {

    }
}