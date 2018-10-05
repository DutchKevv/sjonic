import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as mkdirp from 'mkdirp';

const PATH_STATIC = path.join(__dirname, '../../../static')
const tilesPath = path.join(PATH_STATIC, '/game/image/tile/src');
const UPLOAD_SIZE_MAX = 1024 * 1024 * 10; // 1024=(1KB) * 1024=(1MB) * 10 = 10MB
const API_ERROR_MAX_SIZE = 1234;

export const tileController = {

    getList() {
        return fs.readdirSync(tilesPath).map(file => '/static/game/image/tile/src/' + file);
    },

    async create(reqUser, image, params) {
        // Check max file size (in bytes)
        if (image.size > UPLOAD_SIZE_MAX) {

            return Promise.reject({
                code: API_ERROR_MAX_SIZE,
                message: 'Max file size is : ' + Math.round(UPLOAD_SIZE_MAX / 1024 / 1024) + 'MB' // TODO hardcoded text
            });
        }

        let folderDirectories = params.type.split('_').reverse().reduce((name, value) => value + '/' + name, '/');
        const imgFileName = params.name + path.extname(image.originalname).toLowerCase();
        const relativePath = path.join(folderDirectories, imgFileName);
        const absolutePath = path.join(tilesPath, relativePath);
        const jsonPath = path.join(tilesPath, folderDirectories, params.name + '.json')

        console.log(folderDirectories, imgFileName, absolutePath);

        // ensure folder exists
        mkdirp.sync(path.join(tilesPath, folderDirectories));

        // resize / crop and save to disk
        await sharp(image.buffer).resize(640).max().toFile(absolutePath);

        fs.writeFileSync(jsonPath, JSON.stringify({
            id: params.name,
            img: relativePath,
            type: params.type,
            name: params.name,
            width: params.width,
            height: params.height,
            behaviors: params.behaviors
        }));

        // send img url
        return { id: params.name };
    },

    updateAllTilesJsonMap() {

    },

    // // temp
    // connectMongo() {
    //     return new Promise((resolve, reject) => {
    //         const mongoose = require('mongoose');
    //         // mongoose.set('debug', process.env.NODE_ENV === 'development');
    //         mongoose.Promise = global.Promise; // Typescript quirk

    //         this.db = mongoose.connection;

    //         const connection = mongoose.createConnection('mongodb://0.0.0.0:27017/sjonic');

    //         // autoIncrement.initialize(connection);
    //     });
    // },

    remove() {

    }
};
