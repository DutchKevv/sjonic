import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as mkdirp from 'mkdirp';
import * as packer from 'gamefroot-texture-packer';
import { PLAYER_TYPE_NPC } from '@foreplay/shared/constants';
import { GameObject } from '../schemas/gameobject.schema';
import { fork } from 'child_process';

const PATH_STATIC = path.join(__dirname, '../../../static/')
const tilesPath = path.join(PATH_STATIC, '/game/image/tile/src/');
const UPLOAD_SIZE_MAX = 1024 * 1024 * 10; // 1024=(1KB) * 1024=(1MB) * 10 = 10MB
const API_ERROR_MAX_SIZE = 1234;
const SPRITE_SHEET_OUT_TEMP_PATH = path.join(__dirname, '../../_temp')
const SPRITE_SHEET_OUT_PATH = path.join(PATH_STATIC, '/game/image/tile/dist');

export const objectController = {

    async create(reqUser, image, params): Promise<any> {

        const gameObject = await GameObject.create(params);

        const imgData = this.getImgUrl(image, gameObject);

        await GameObject.findByIdAndUpdate(gameObject._id, { img: imgData.relative });

        await this.writeObjectImg(reqUser, image, imgData);

        await this.createTileMap();

        return gameObject;
    },

    async update(reqUser, objectId: string, image: any, params: any): Promise<any> {

        const object = await GameObject.findByIdAndUpdate(objectId, params);

        if (image) {
            const imgData = this.getImgUrl(image, object);

            await GameObject.findByIdAndUpdate(object._id, { img: imgData.relative });

            await this.writeObjectImg(reqUser, image, imgData);
        }

        await this.createTileMap();

        return object;
    },


    async writeObjectImg(reqUser, image, imgData) {
        // Check max file size (in bytes)
        if (image.size > UPLOAD_SIZE_MAX) {

            throw ({
                code: API_ERROR_MAX_SIZE,
                message: 'Max file size is : ' + Math.round(UPLOAD_SIZE_MAX / 1024 / 1024) + 'MB' // TODO hardcoded text
            });
        }

        // ensure folder exists
        mkdirp.sync(path.join(tilesPath, imgData.folder));

        // resize / crop and save to disk
        await sharp(image.path).resize(640).max().toFile(imgData.absolute)
    },

    async createTileMap() {

        const gameObjects = await GameObject.find({}, { createdAt: 0, updatedAt: 0 }).lean();

        const filePaths = gameObjects
            .filter(go => !!go.img) // temp - remove all without img path
            .map(gameObject => path.join(tilesPath + gameObject.img)) // normalize img path
            .filter(go => fs.existsSync(go)) // temp - check if img really exists

        await new Promise((resolve, reject) => {
            packer(filePaths, {
                format: 'json',
                path: SPRITE_SHEET_OUT_TEMP_PATH,
                fullpath: true
            }, function (error, data) {
                if (error) return reject(error);

                // normalize JSON
                const spritesheetJSON = JSON.parse(fs.readFileSync(path.join(SPRITE_SHEET_OUT_TEMP_PATH, 'spritesheet-1.json')).toString());
                spritesheetJSON.tiles = [];
                spritesheetJSON.meta.image = '/assets/image/tile/dist/' + spritesheetJSON.meta.image;

                for (let fileName in spritesheetJSON.frames) {
                    const gameObject = gameObjects.find(go => go._id.toString() === fileName.split('/').pop().split('.')[0])
                    gameObject.frame = spritesheetJSON.frames[fileName].frame;
                    gameObject.sourceSize = spritesheetJSON.frames[fileName].sourceSize;
                }

                const tileObject = {
                    tiles: gameObjects,
                    meta: {
                        image: '/static/game/image/tile/dist/tiles.png'
                    }
                }

                // spritesheet JSON
                fs.writeFileSync(path.join(SPRITE_SHEET_OUT_PATH, 'tiles.json'), JSON.stringify(tileObject, null, 2));

                // spritesheet PNG
                fs
                    .createReadStream(path.join(SPRITE_SHEET_OUT_TEMP_PATH, 'spritesheet-1.png'))
                    .pipe(fs.createWriteStream(path.join(SPRITE_SHEET_OUT_PATH, 'tiles.png')))
                    .on('finish', resolve);
            });
        });
    },

    getImgUrl(image, gameObject) {
        let folderDirectories = gameObject.type.split('_').reverse().reduce((name, value) => value + '/' + name, '/');

        const imgFileName = gameObject._id + path.extname(image.name).toLowerCase();
        const relativePath = path.join(folderDirectories, imgFileName);
        const absolutePath = path.join(tilesPath, relativePath);
        const jsonPath = path.join(tilesPath, folderDirectories, gameObject.name + '.json')

        return {
            folder: folderDirectories,
            relative: relativePath,
            absolute: absolutePath
        }
    }
};

function normalizeJSON() {

}