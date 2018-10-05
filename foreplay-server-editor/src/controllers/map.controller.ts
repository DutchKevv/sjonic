import * as fs from 'fs';
import * as path from 'path';

const PATH_STATIC = path.join(__dirname, '../../../static');
const MAP_ROOT_PATH_DIST = path.join(PATH_STATIC, '/game/map');
const TILE_ROOT_PATH = path.join(PATH_STATIC, '/game/image/tile/dist/tiles.json');

const MAP_TEMPLATE = {
	version: 1,
	id: 0,
	wildLife: ['birds'],
	width: 100,
	height: 100,
	backgroundImage: '/static/game/image/background/starter.jpg',
	backgroundStretch: true,
	music: '/static/game/audio/outside_ost1c.mp3',
	audioAmbience: '/static/game/audio/nature1.mp3',
	tileMap: '/static/game/image/tile/dist/tiles',
	startPosition: [15, 8, 1],
	tileW: 32,
	tileH: 32,
	tiles: []
};

export const mapController = {

	async getById(reqUser, mapId) {
		// return fs.readFileSync(path.join(__dirname);
	},

	getList(reqUser) {
		return new Promise((resolve, reject) => {
			fs.readdir(MAP_ROOT_PATH_DIST, (error, result) => {
				if (error) return reject(error);

				// remove .map.json from names
				const normalizedList = result.map(fileName => fileName.substring(0, fileName.length - 9));

				resolve(normalizedList);
			});
		});
	},

	async save(reqUser, mapId, mapData) {
		// validity checks
		if (!mapId)
			throw { error: 'mapId missing' }

		if (!mapData || !mapData.tiles || !mapData.tiles.length)
			throw { error: 'invalid map data' }

		const filePathDist = path.join(MAP_ROOT_PATH_DIST, mapId + '.map.json');
		fs.writeFileSync(filePathDist, JSON.stringify(mapData));

		return {}
	},

	create(reqUser, options) {
		if (!options.id) {
			throw new Error(`no id given`);
		}

		const filePathDist = path.join(MAP_ROOT_PATH_DIST, options.id + '.map.json');

		if (!options.overwrite && fs.existsSync(filePathDist)) {
			console.error(`map file with name '${options.id}' already existsm use --overwrite`);
			throw new Error('file already exist')
		}

		// merge options with defaults
		const map = Object.assign({}, MAP_TEMPLATE, options);
		map.tiles = new Array(map.width * map.height);
		map.tiles.fill(0);

		if (options.randomFill) {
			const tileObjects = JSON.parse(<any>fs.readFileSync(TILE_ROOT_PATH));

			for (let i = 0, len = map.tiles.length; i < len; i++) {
				const fillWithSomething = Math.floor(Math.random() * 40) === 5;

				if (fillWithSomething) {
					const objectType = tileObjects.tiles[Math.floor(Math.random() * tileObjects.tiles.length)];
					console.log(objectType)
					map.tiles[i] = { _id: objectType._id };
				}
			}
		}

		fs.writeFileSync(filePathDist, JSON.stringify(map));

		return { id: map.id };
	},

	remove(reqUser, mapId: string) {

	}
};
