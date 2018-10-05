import * as fs from 'fs';
import * as path from 'path';
import * as copydir from 'copy-dir';
import * as mkdirp from 'mkdirp';

const PATH_ROOT = path.join(__dirname, '../../../../');
const PATH_STATIC = path.join(PATH_ROOT, '/static');
const PATH_GAMES_SRC = path.join(PATH_ROOT, '/games');
const PATH_GAMES_DIST = path.join(PATH_STATIC, '/games');
const PATH_DEFAULT = path.join(PATH_GAMES_SRC, 'default');

const GAME_TEMPLATE = Object.freeze({
    version: 1,
    id: 0
});

export interface ICreateGameOptions {
    id?: string;
    name?: string;
    pathSrc?: string;
    overwrite?: boolean;
}

export async function createGame(options: ICreateGameOptions) {
    options.id = options.id || options.name;

    if (!options.id) {
        throw new Error(`no game id |name given`);
    }

    // merge game options with defaults
    const gameOptions = Object.assign({}, GAME_TEMPLATE, options);

    // src path
    const pathGameSrc = path.join(PATH_GAMES_SRC, options.id);

    // check if game already exists and overwrite option is not enabled
    if (!options.overwrite && fs.existsSync(pathGameSrc))
        throw ({ message: 'game with name already exist: ' + options.id, code: '' });

    await createFiles(gameOptions, pathGameSrc);
    await updatePackageJson(gameOptions, pathGameSrc);
    
    return { id: gameOptions.id };
}

async function createFiles(gameOptions, pathGameSrc) {
    const pathGameConfig = path.join(pathGameSrc, 'game.json');
    
    // create src folder
    mkdirp.sync(pathGameSrc);

    // copy template game dir to game src dir
    copydir.sync(PATH_DEFAULT, pathGameSrc);

    // write game config to src folder
    fs.writeFileSync(pathGameConfig, JSON.stringify(gameOptions, null, 2));
}

async function updatePackageJson(gameOptions, pathGameSrc) {
    const pathPackageJson = path.join(pathGameSrc, 'package.json');

    // get package.json as JSON
    const packageJson: any = JSON.parse(fs.readFileSync(pathPackageJson).toString());

    // update package.json values
    packageJson.name = gameOptions.id;

    // write package.json back to src folder
    fs.writeFileSync(pathPackageJson, JSON.stringify(packageJson, null, 2));
}