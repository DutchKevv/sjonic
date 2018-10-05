import { IPosition } from '@foreplay/shared/interfaces/position.interface'
import { Map } from './map.server';

export class Player {
    
    public uId: string;
    public cId: string;
    public map: Map;
    public position: IPosition
    public name: string;
    public level: number;
    public xp: number;
    public socket: any;

    constructor(options) {
        this.name = options.name;
        this.uId = options.user._id;
        this.cId = options._id;
        this.level = options.level;
        this.xp = options.xp;
        this.position = options.position;
    }

    public toJson(): any {
        return {
            uId: this.uId,
            cId: this.cId,
            position: this.position,
            name: this.name,
            level: this.level
        }
    }
}