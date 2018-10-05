import throttle from 'lodash-es/throttle';
import { PlayerSelf } from '@foreplay/client-core/src/classes/engine.player.self';
import { Camera } from '@foreplay/client-core/src/classes/engine.camera';
import { Map } from '@foreplay/client-core/src/classes/engine.map';

export class PlayerSelfGame extends PlayerSelf {

    public action: any = null;
    public rewardtime: any = null;
    public data: any = {};

    private _moveEmitThrottled: Function = throttle(this._moveEmit, 100);

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param map 
     * @param camera 
     */
    public onUpdate(delta: number, currentTime: DOMHighResTimeStamp, map: Map, camera: Camera): void {
        if (this.isMoving) {
            this._moveEmitThrottled();
        }
    }

    private _moveEmit(): void {
        this.engine.socket.emit('my-position', { r: this.position.r, x: this.position.x, z: this.position.z });
    }
}