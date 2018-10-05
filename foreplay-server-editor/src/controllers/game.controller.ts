import * as fs from 'fs';
import * as path from 'path';
import { createGame } from '../util/create-game/create-game';

const PATH_ROOT = path.join(__dirname, '../../../');
const PATH_STATIC = path.join(PATH_ROOT, 'static');
const PATH_GAMES_SRC = path.join(PATH_ROOT, 'games');
const PATH_GAMES_DIST = path.join(PATH_STATIC, 'games');

export const gameController = {

	async getById(reqUser, gameId: string) {
		// return fs.readFileSync(path.join(__dirname);
	},

	getList(reqUser): Promise<Array<any>> {
		return new Promise((resolve, reject) => {
			fs.readdir(PATH_GAMES_DIST, (error, result) => {
				if (error) return reject(error);

				// remove .map.json from names
				const normalizedList = result.map(fileName => fileName.substring(0, fileName.length - 9));

				resolve(normalizedList);
			});
		});
	},

	create(reqUser, options): Promise<{ id: string }> {
		return createGame(options);
	},


	async save(reqUser, mapId, mapData) {
		// validity checks
		if (!mapId)
			throw { error: 'mapId missing' }

		if (!mapData || !mapData.tiles || !mapData.tiles.length)
			throw { error: 'invalid map data' }

		const filePathDist = path.join(PATH_GAMES_SRC, mapId + '.map.json');
		fs.writeFileSync(filePathDist, JSON.stringify(mapData));

		return {}
	},

	remove(reqUser, mapId: string) {

	}
};
