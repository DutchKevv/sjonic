import * as fs from 'fs';
import * as path from 'path';

const PATH_PUBLIC_PROJECTS = path.join(__dirname, '../../../data/public/projects/');

export const mapController = {

	maps: [],

	getList(reqUser, gameId: string) {
		const PATH_PROJECT_SRC = path.join(PATH_PUBLIC_PROJECTS, gameId);
		const MAP_ROOT_PATH_DIST = path.join(PATH_PROJECT_SRC, '/assets/game/map');

		return new Promise((resolve, reject) => {
			fs.readdir(MAP_ROOT_PATH_DIST, (error, result) => {
				if (error) return reject(error);

				// remove .map.json from names
				const normalizedList = result.map(fileName => fileName.substring(0, fileName.length - 9));

				resolve(normalizedList);
			});
		});
	}
};