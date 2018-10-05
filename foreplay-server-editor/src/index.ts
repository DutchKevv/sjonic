import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as formidable from 'express-formidable';
import * as mkdirp from 'mkdirp';
import * as io from 'socket.io';
import { API_ERROR_MAX_SIZE, API_ERROR_UNKNOWN } from '@foreplay/shared/constants';
import { config } from './config';

const PATH_STATIC = path.join(__dirname, '../../static')

// error catching
process.on('unhandledRejection', (reason, p) => {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    throw reason;
});


export const app = {

    db: null,
    api: null,
    io: null,
    server: null,

    async init(): Promise<void> {
        this.connectMongo();
        this.setupApi();
    },

    setupApi(): void {
        // http 
        this.api = express();
        this.server = (<any>http).Server(this.api);
        this.io = io(this.server, { path: '/io/game' });

        this.api.use(morgan('dev'));
        this.api.use(helmet());

        this.api.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'clientVersion, Authorization, Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
            next();
        });

        mkdirp.sync(path.join(PATH_STATIC, 'tmp/upload'));

        // bodies
        this.api.use(formidable({
            uploadDir: path.join(PATH_STATIC, 'tmp/upload')
        }));

		/**
		 * error - unauthorized
		 */
        this.api.use((err, req, res, next) => {
            if (err.name === 'UnauthorizedError')
                return res.status(401).send('invalid token...');

            next();
        });

		/**
		 * routes
		 */
        this.api.use('/editor/v1/game', require('./api/game.api'));
        this.api.use('/editor/v1/fake', require('./api/fake.api'));
        this.api.use('/editor/v1/map', require('./api/map.api'));
        this.api.use('/editor/v1/tile', require('./api/tile.api'));
        this.api.use('/editor/v1/object', require('./api/object.api'));

		/**
		 * error handling
		 */
        this.api.use((error, req, res, next) => {
            if (res.headersSent) {
                console.error('API', error);
                return next(error);
            }

            // normal error objects
            if (error && (error.code || error.statusCode)) {

                // known error
                if (error.statusCode) {
                    return res.status(error.statusCode).send(error.error || {
                        statusCode: error.statusCode,
                        message: error.message
                    });
                }

                // custom error
                switch (parseInt(error.code, 10)) {
                    case API_ERROR_MAX_SIZE:
                        res.status(413).send(error);
                        break;
                    default:
                        console.error('ErrorHandler', error.message || error.error || 'Unknown error');
                        res.status(500).send({
                            code: API_ERROR_UNKNOWN,
                            message: 'Unknown error'
                        });
                }
            }

            // unknown error
            else {
                console.error('API', error);
                res.status(500).send('Unknown server error');
            }
        });

        this.server.listen(
            config.server.editor.port,
            config.server.editor.host,
            () => console.info('Editor', `Service started -> ${config.server.editor.host}:${config.server.editor.port}`));
    },

    connectMongo() {
        return new Promise((resolve, reject) => {
            // mongoose.set('debug', process.env.NODE_ENV === 'development');
            (<any>mongoose).Promise = global.Promise; // Typescript quirk

            this.db = mongoose.connection;
            this.db.on('error', error => {
                console.error('connection error:', error);
                reject();
            });
            this.db.once('open', () => {
                console.log('Editor connected to mongo');
                resolve();
            });

            mongoose.connect(config.server.editor.connectionString, { useNewUrlParser: true });
        });
    },
};

app.init().catch(console.error);