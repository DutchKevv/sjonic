import { IPosition } from '@foreplay/shared/interfaces/position.interface';
import { app } from '../index';
import { Player } from '../classes/player.server';

export function router(io, socket) {

    /**
     * update player position
     */
    socket.on('my-position', (position: IPosition) => {
        socket.user.instance.map.updatePlayerPosition(socket.user.instance, position);
    });

    /**
     * get all players when switchting map
     * TODO - also give NPC's etc
     */
    socket.on('players', (data, callback: Function) => {
        const players = app.controllers.game.players.filter(player => player !== socket.user.instance).map(player => player.toJson());
        callback(players);
    });

    /**
     * switch to other map
     */
    socket.on('map-switch', (mapId: string, callback: Function) => {
        try {
            // add player to map
            app.controllers.game.addPlayerToMap(socket.user.instance, mapId);

            const players = app.controllers.game.players.filter(player => player !== socket.user.instance).map(player => player.toJson());

            callback(null, players);
        } catch (error) {
            console.error('IO ERROR', error)
            callback(error);
        }
    });

    /**
     * switch to other character
     */
    socket.on('character-switch', async (cId: string, callback: Function) => {
        try {
            socket.user.instance = <Player>await app.controllers.game.addPlayer(socket.user.uId, cId);
            socket.user.instance.socket = socket;
            callback(null, {
                uId: socket.user.instance.uId,
                cId: socket.user.instance.cId,
                name: socket.user.instance.name,
                level: socket.user.instance.level
            });
        } catch (error) {
            console.error('IO ERROR', error)
            callback(error);
        }
    });

    /**
     * remove player when disconnected
     */
    socket.on('disconnect', () => {
        if (socket.user && socket.user.instance)
            app.controllers.game.removePlayer(socket.user.instance);
    });
}