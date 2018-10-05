import { Layer } from "@foreplay/client-core/src/classes/engine.layer";
import { Camera } from "@foreplay/client-core/src/classes/engine.camera";
import { Map } from "@foreplay/client-core/src/classes/engine.map";
import { Sprite } from '@foreplay/client-core/src/classes/engine.sprite';
import { Player } from "@foreplay/client-core/src/classes/engine.player";
import { Animation } from "@foreplay/client-core/src/classes/engine.animation";
import { IPosition } from '@foreplay/shared/interfaces/position.interface';

export class LayerMain extends Layer {

	private _fadeInAlpha: any = null
	private _players: Array<Player> = [];

	public onInit() {
		const lastMap = Map.loadLastOpenedMapLocal();

		this.engine.socket.on('player-joined', (playerData: any) => this.onPlayerJoined(playerData));
		this.engine.socket.on('player-leaved', (playerData: any) => this.onPlayerLeaved(playerData));
		this.engine.socket.on('positions', (data: any) => this.onPositionsUpdate(data));

		this.switchMap(lastMap || Map.DEFAULT_MAP_ID).catch(console.error);
	}

	public onUpdate(delta: number, currentTime: DOMHighResTimeStamp) {
		if (!this.map || !this.camera) return;

		// zooming
		if (this.engine.controls.activeMouse.wheel) {
			const mouseWheelEvent = this.engine.controls.activeMouse.wheel;
			this.scale += mouseWheelEvent.up ? 0.1 : -0.1;

			// min / max scale
			if (this.scale < 0.7) this.scale = 0.7;
			else if (this.scale > 1.4) this.scale = 1.4;

			// update camera viewport size
			this.camera.updateViewPortSize(this.width / this.scale, this.height / this.scale);

			// zoom in at mouse position
			// const worldXZ = this.getRelativeXZFromScreenXY(mouseWheelEvent.event.pageX, mouseWheelEvent.event.pageY)
			// this.camera.updatePosition(worldXZ.x / 2, worldXZ.z / 2);
		} else {
			// update camera position
			this.camera.update(delta, currentTime);
		}
	}

	/**
	 * 
	 * @param delta 
	 */
	public onDraw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera) {
		if (!this.map || !this.map.isInitialized || !this.camera) return;

		for (let i = 0, len = this.children.length; i < len; i++) {
			const object = this.children[i];

			if (object instanceof Player)
				object.drawHealthBar(delta, context, camera);
		}

		if (this._fadeInAlpha !== null) {
			this.context.fillStyle = 'rgba(0, 0, 0, ' + this._fadeInAlpha + ')';
			this.context.fillRect(0, 0, this.width / this.scale, this.height / this.scale);
		}
	}

	public async switchMap(mapId: string) {
		this.isEnabled = false;

		// clear objects
		this.clear();

		// destroy previous map instance
		if (this.map) this.map.destroy();

		// request map switch on server
		const playersData = await new Promise((resolve, reject) => {
			this.engine.socket.emit('map-switch', mapId, (error: any, result: any) => error ? reject(error) : resolve(result));
		});

		// create new map
		this.map = new Map({}, await this.engine.assets.load(`/maps/${mapId}.map.json`));

		// create new camera
		this.camera = new Camera(this.engine, 1000, 500, this.width, this.height, this.map.width, this.map.height);

		// add map to children
		await this.addChild(this.map);

		// add self to game
		await this.addChild(this.engine.state.game.player);

		// add human players
		await this.addPlayers(playersData)

		// set self player position
		this.engine.state.game.player.setPositionByWorldGridXYR(15, 8, 0, this.map);
		console.log(this.engine.state.game.player.position);
		// let camera follow user
		// TODO - allow pre-configurable animations to / from game objects (slide in, fade in, etc)
		this.camera.followObject(this.engine.state.game.player.position, this.width / 2, this.height / 2);

		// add map related animals etc
		// TODO - move to map class
		await this.addAnimalsToMap();

		// NPC
		// TODO - can be in one call with human players
		await this.addNPCsToMap();

		// apply fade effect
		this.fadeIn();

		// trigger event
		this.engine.events.emit('map-switch', this.map);

		this.isEnabled = true;
	}

	public async addPlayers(playersData: any) {
		const players = playersData.map((playerData: any) => new Player(playerData));
		await this.addChild(players)
	}

	public onPlayerJoined(playerData: any) {
		// make sure player is not already loaded
		this.onPlayerLeaved(playerData);

		const player = new Player(playerData);
		this.addChild(player);
	}

	public onPlayerLeaved(playerData: any) {
		const object = <Player>this.children.find((object: any) => object.uId === playerData.uId);
		if (object) {
			this.removeChild(object);
		}
	}

	public onPositionsUpdate(players: Array<{ uId: string, position: IPosition }>) {
		for (let i = 0, len = players.length; i < len; i++) {
			const player = players[i];
			const object = <Player>this.children.find((object: any) => object.uId === player.uId);

			if (object) {
				object.setPositionByWorldXYR(player.position.x, player.position.z, player.position.r, this.map, true);
			}
		}
	}

	async addNPCsToMap() {
		let i = 30;
		while (i--) {
			const player = new Player({});
			this._players.push(player);

			// TODO store positions in map
			const randomTile = this.map.getRandomTile();

			player.setPositionByWorldGridXYR(randomTile.gx, randomTile.gz, 0, this.map);

			await this.addChild(player);

			player.moveRandomInRadius(30, this.map);
		}
	}

	public async addAnimalsToMap(amount: number = 20) {
		while (amount--) {
			const animal = new Sprite({
				name: 'bird',
				position: {
					x: Math.floor(Math.random() * this.map.data.width * this.map.tileW),
					z: Math.floor(Math.random() * this.map.data.height * this.map.tileH),
				},
				imgUrl: '/images/animation/batflap.png',
				maxFrames: 5,
				width: 64,
				height: 128,
				alignVerticalCenter: true,
				behavior: {
					speed: 200
				}
			});

			await this.addChild(animal);

			animal.moveRandomInRadius(30, this.map);
		}

		amount = 60;
		while (amount--) {
			const animal = new Sprite({
				name: 'coin',
				position: {
					x: Math.floor(Math.random() * this.map.data.width * this.map.tileW),
					z: Math.floor(Math.random() * this.map.data.height * this.map.tileH),
				},
				imgUrl: '/images/animation/coin.png',
				maxFrames: 9,
				width: 100,
				height: 128,
				drawHeight: 32,
				drawWidth: 32,
				alignVerticalCenter: true
			});

			await this.addChild(animal);
		}
	}

	public fadeIn(): void {
		this.addAnimation({
			from: { a: 1 },
			to: { a: 0 },
			easing: Animation.EASE_QUADRATIC_IN,
			time: 4000,
			onUpdate: value => {
				this._fadeInAlpha = value.a;
			},
			onComplete: () => {
				this._fadeInAlpha = null;
			}
		}, true);
	}

	// draw2() {
	// 	const updateObj = this.logicLayer;

	// 	//If the current player is loaded we can continue
	// 	if (!updateObj.players[updateObj.player_current])
	// 		return;

	// 	//Set the vars that determine the current player position relative to canvas
	// 	var cp = updateObj.players[updateObj.player_current];
	// 	var map_id = updateObj.players[updateObj.player_current].map;
	// 	var map = updateObj.maps[map_id];
	// 	var objects_map = updateObj.objects[map_id];
	// 	var npcs_map = updateObj.npcs[map_id];

	// 	var back_x = ((this.engine.width / 2) - cp.x);
	// 	var back_y = ((this.engine.height / 2) - cp.y);

	// 	var my_pos_x = (this.engine.width / 2);
	// 	var my_pos_y = (this.engine.height / 2);

	// 	//Set player relative to back
	// 	cp.x_rel = back_x;
	// 	cp.y_rel = back_y;

	// 	//If the canvas is out of bounds, stop moving the background
	// 	if (back_x > 0) {
	// 		back_x = 0;
	// 		cp.x_rel = back_x;
	// 		my_pos_x = cp.x;
	// 	}

	// 	if (back_x < (this.engine.width - map.w)) {
	// 		back_x = this.engine.width - map.w;
	// 		cp.x_rel = back_x;
	// 		my_pos_x = cp.x + cp.x_rel;
	// 	}

	// 	if (back_y > 0) {
	// 		back_y = 0;
	// 		cp.y_rel = back_y;
	// 		my_pos_y = cp.y;
	// 	}

	// 	if (back_y < (this.engine.height - map.h)) {
	// 		back_y = this.engine.height - map.h;

	// 		cp.y_rel = back_y;
	// 		my_pos_y = cp.y + cp.y_rel;
	// 	}

	// 	// if map is smaller than canvas center it
	// 	if (map.h < this.engine.height) {
	// 		back_y = (this.engine.height - map.h) / 2;
	// 		cp.y_rel = back_y;
	// 		my_pos_y = cp.y + cp.y_rel;
	// 	}

	// 	if (map.w < this.engine.width) {
	// 		back_x = (this.engine.width - map.w) / 2;
	// 		cp.x_rel = back_x;
	// 		my_pos_x = cp.x + cp.x_rel;
	// 	}

	// 	//Draw the map
	// 	this.Draw('map', map, back_x, back_y);

	// 	//Set target (npc / object) for current player
	// 	if (updateObj.players[updateObj.player_current].interaction == true) {
	// 		var target_id = updateObj.players[updateObj.player_current].target.id;
	// 		if (target_id) {
	// 			if (updateObj.players[updateObj.player_current].interaction_target_type == 'object') {
	// 				//Set the targetted mode on an object
	// 				//Prevent targetting of objects not on this map (anymore)
	// 				if (typeof objects_map[target_id] != 'undefined') {
	// 					objects_map[target_id].targetted = true;
	// 				}
	// 			} else if (updateObj.players[updateObj.player_current].interaction_target_type == 'npc') {
	// 				//Set the targetted mode on an npc
	// 				//Prevent targetting of objects not on this map (anymore)
	// 				if (typeof npcs_map[target_id] != 'undefined') {
	// 					npcs_map[target_id].targetted = true;
	// 				}
	// 			}
	// 		}
	// 	}

	// 	//Set attack targets for player
	// 	if (updateObj.players[updateObj.player_current].attack == true) {
	// 		var targets = updateObj.players[updateObj.player_current].targets_attack;

	// 		for (var id in targets) {
	// 			//Check if the target is not old (from before a reboot)
	// 			if (typeof updateObj.mobs[updateObj.players[updateObj.player_current].map][id] != 'undefined') {
	// 				updateObj.mobs[updateObj.players[updateObj.player_current].map][id].targetted = true;
	// 			}
	// 		}
	// 	}

	// 	//Draw this player
	// 	this.Draw('player_current', updateObj.players[updateObj.player_current], my_pos_x, my_pos_y);

	// 	//Draw all other players
	// 	for (var id in updateObj.players) {
	// 		var p = updateObj.players[id];

	// 		if (id != updateObj.player_current && p.map == updateObj.players[updateObj.player_current].map) {
	// 			var x = cp.x_rel + p.x;
	// 			var y = cp.y_rel + p.y;

	// 			this.Draw('player_other', p, x, y);
	// 		}
	// 	}

	// 	//Draw all mobs
	// 	if (updateObj.mobs) {
	// 		for (var mobkey in updateObj.mobs[updateObj.players[updateObj.player_current].map]) {
	// 			var m = updateObj.mobs[updateObj.players[updateObj.player_current].map][mobkey];
	// 			var x = Number(m.x) + Number(back_x);
	// 			var y = Number(m.y) + Number(back_y);

	// 			//Draw this mob
	// 			this.Draw('mob', m, x, y);
	// 		};
	// 	};

	// 	//Draw the objects
	// 	if (objects_map) {
	// 		for (var key in objects_map) {
	// 			var o = objects_map[key];
	// 			var x = Number(o.x) + Number(back_x);
	// 			var y = Number(o.y) + Number(back_y);

	// 			//Draw this object
	// 			this.Draw('object', o, x, y);
	// 		}
	// 	}
	// 	//Draw the npcs
	// 	if (npcs_map) {
	// 		for (var key in npcs_map) {
	// 			var n = npcs_map[key];
	// 			var x = Number(n.x) + Number(back_x);
	// 			var y = Number(n.y) + Number(back_y);

	// 			//Draw this npc
	// 			this.Draw('npc', n, x, y);
	// 		};
	// 	}
};