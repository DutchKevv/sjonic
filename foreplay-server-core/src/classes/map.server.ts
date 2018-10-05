import { IPosition } from '@foreplay/shared/interfaces/position.interface'
import { Player } from './player.server';

export class Map {

    public id: string;
    public players: Array<Player> = [];

    private _data: any = {};

    constructor(public options: any = {}) {
        this.id = options.id;
    }

    public addPlayer(player: Player) {
        this.players.push(player);
        player.socket.join(this.id);

        const playerData = {
            uId: player.uId,
            cId: player.cId,
            name: player.name,
            level: player.level,
            position: player.position
        };

        if (!player.position || !player.position.x || !player.position.z) {
            playerData.position = {
                x: this.options.startPosition[0] * this.options.tileW,
                z: this.options.startPosition[1] * this.options.tileH,
                r: this.options.startPosition[2],
                gx: this.options.startPosition[0],
                gz: this.options.startPosition[1]
            }
        }

        player.socket.broadcast.to(this.id).emit('player-joined', playerData);
    }

    public removePlayer(player: Player) {
        player.socket.broadcast.to(this.id).emit('player-leaved', { uId: player.uId });
        player.socket.leave(this.id);
        this.players.splice(this.players.indexOf(player), 1);
    }

    public updatePlayerPosition(player: Player, position: IPosition) {
        player.position = position;

        player.socket.broadcast.to(this.id).emit('positions', [
            {
                uId: player.uId,
                position
            }
        ]);
    }
}