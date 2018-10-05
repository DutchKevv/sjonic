import { Engine } from '@foreplay/client-core/src/engine';
import { Layer } from '@foreplay/client-core/src/classes/engine.layer';
import { SceneMenu } from './scenes/menu/game.scene.menu';
import { IGameOptions } from '@foreplay/client-core/src/engine';
import config from '../../config.json';

window.addEventListener('load', async () => {
    try {
        // merge options
        Object.assign(config, {
            credentials: {
                token: new URLSearchParams(window.location.search).get('token')
            }
        });

        // create Engine instance (the actual game)
        const myGame = new Engine(<IGameOptions>config);

        // init engine
        await myGame.init();

        // attempt connect websocket
        try {
            await myGame.socket.connect();
        } catch (error) {
            console.warn('websocket connection failed');
            console.error(error);
        }

        // menu
        await myGame.addChild(new SceneMenu({ id: Layer.TYPE_MENU }));

        // kickstart
        myGame.start();
        
    } catch (error) {
        console.error(error)
    }
}, { passive: true, once: true });