import * as fs from 'fs';
import * as path from 'path';
import { Player } from '../classes/player.server';
import { Map } from '../classes/map.server';
import { API_ERROR_MAP_NOT_FOUND } from '@foreplay/shared/constants'
import { Character } from '../schemas/character.schema';

const PATH_GAMES = path.join(__dirname, '../../../data/public/projects');

export class GameController {

    public gameId: string = 'sjonic';
    public game: any = {};
    public maps: Array<Map> = [];
    public players: Array<Player> = [];

    private _mapsDir: string = path.join(PATH_GAMES, this.gameId, 'assets/maps');

    async init() {
        await this.reloadMaps();
        await this.loadNPCs();
    }

    // temp
    async loadNPCs() {
        const users = await Character.find({fake: true}, {name: 1, characters: 1}).populate('charaters[0]');
    }

    async addPlayer(userId: string, characterId: string): Promise<Player> {
        const characterData = await Character.findById(characterId).populate('user');

        const player = new Player(characterData);

        this.players.push(player);

        return player;
    }

    public removePlayer(player: Player) {
        if (player.map) {
            player.map.removePlayer(player);
        }

        this.players.splice(this.players.indexOf(player), 1);
    }

    public addPlayerToMap(player: Player, mapId: string): void {
        if (player.map) {
            player.map.removePlayer(player);
        }

        const map = this.maps.find(map => map.id === mapId);

        if (!map) throw ({ code: API_ERROR_MAP_NOT_FOUND, statusCode: 404 });

        player.map = map;
        map.addPlayer(player);
    }

    updatePlayerPosition(characterId: string, position: any) {
        const player = this.players.find(player => player.cId === characterId);

        player.position = position;
    }

    reloadMaps() {
        const files = <Array<any>>fs.readdirSync(this._mapsDir, <any>{ withFileTypes: true }).filter((file: any) => file.name.endsWith('.map.json'));

        files.forEach(file => {

            try {
                // console.log(fs.readFileSync(path.join(MAPS_DIR, file.name)).toString());
                const mapData = JSON.parse(fs.readFileSync(path.join(this._mapsDir, file.name)).toString());

                // check if map is already loaded
                const prevMapInstance = this.maps.find(prevMap => prevMap.id === mapData.id);

                const mapInstance = new Map(mapData);

                this.maps.push(mapInstance);

            } catch (error) {
                console.error(error);
            }
        });
    }
};