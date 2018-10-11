import * as path from 'path';
import * as http from 'http';
import * as formidable from 'express-formidable';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as io from 'socket.io';
import * as expressJwt from 'express-jwt';
import * as jwt from 'jsonwebtoken';
import { API_ERROR_MAX_SIZE, API_ERROR_UNKNOWN, API_ERROR_FIELD_DUPLICATE, MONGO_ERROR_VALIDATION, MONGO_ERROR_KIND_DUPLICATE, MONGO_ERROR_KIND_REQUIRED, API_ERROR_FIELD_MISSING } from '@foreplay/shared/constants';
import { config } from './config';
import { GameController } from './controllers/game.controller';

// global async error catching
process.on('unhandledRejection', (reason, p) => {
    console.log('(custom message) Unhandled Rejection at: Promise ', p, ' reason: ', reason);

    // still throwing, so process will exit, 
    // but keeping the nodejs process running can be handled here
    throw reason;
});

export const app = {

    db: null,
    api: null,
    io: null,
    server: null,

    controllers: {
        game: null
    },

    async init(): Promise<void> {
        this.connectMongo();

        this.controllers.game = new GameController();
        await this.controllers.game.init();

        this.setupApi();
    },

    setupApi(): void {
        // http(s) / websocket
        this.api = express();
        this.server = (<any>http).Server(this.api);
        this.io = io(this.server, { path: '/io/game' });

        // logging
        this.api.use(morgan('dev'));
        this.api.use(helmet());

        // bodies
        this.api.use(formidable());

        // headers
        this.api.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'clientVersion, Authorization, Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
            next();
        });

		/**
         * http authentication
         */
        this.api.use(expressJwt({
            secret: config.auth.jwt.secret,
            credentialsRequired: true,
            getToken: req => {
                if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
                    return req.headers.authorization.split(' ')[1];
            }
        }).unless(req => {
            return (
                req.originalUrl === '/' ||
                req.originalUrl.startsWith('/api/v1/authenticate') ||
                (req.originalUrl === '/api/v1/user' && req.method === 'POST')
            );
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
		 * http routes
		 */
        this.api.use('/api/v1/authenticate', require('./api/authenticate.api'));
        this.api.use('/api/v1/user', require('./api/user.api'));
        this.api.use('/api/v1/character', require('./api/character.api'));
        this.api.use('/api/v1/map', require('./api/map.api'));

        /**
         * websocket authentication
         */
        this.io.use(async (socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
                jwt.verify(socket.handshake.query.token, config.auth.jwt.secret, (error, decoded) => {
                    if (error) return next(new Error('Authentication error'));

                    socket.user = {
                        uId: decoded.uId
                    }

                    next();
                });


            } else {
                next(new Error('Authentication error'));
            }
        });

        /**
         * websocket routes
         */
        this.io.on('connection', socket => {
            require('./io/game.io').router(this.io, socket);
        })


		/**
		 * error handling
		 */
        this.api.use((error, req, res, next) => {
            if (res.headersSent) {
                console.error('HEADERS ALREADT SENT: ', error);
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
                        console.error('ErrorHandler', error.message || error.error || error || 'Unknown error');
                        res.status(500).send({
                            code: API_ERROR_UNKNOWN,
                            message: 'Unknown error'
                        });
                }
            }

            // Mongo errors
            else if (error.name === MONGO_ERROR_VALIDATION) {
                const firstErrorField = Object.keys(error.errors)[0];
                const firstErrorKind = error.errors[firstErrorField].kind;

                switch (firstErrorKind) {
                    case MONGO_ERROR_KIND_REQUIRED:
                        return res.status(409).send({ code: API_ERROR_FIELD_MISSING, field: firstErrorField });
                    case MONGO_ERROR_KIND_DUPLICATE:
                        return res.status(409).send({ code: API_ERROR_FIELD_DUPLICATE, field: firstErrorField });
                    default:
                        return res.status(500).send({ code: API_ERROR_UNKNOWN });
                }
            }

            // unknown error
            else {
                console.error('API', error);
                res.status(500).send('Unknown server error');
            }
        });

        this.server.listen(
            config.server.core.port,
            config.server.core.host,
            () => console.info('Game', `Service started -> ${config.server.core.host}:${config.server.core.port}`));
    },

    connectMongo() {
        return new Promise((resolve, reject) => {

            (<any>mongoose).Promise = global.Promise; // Typescript quirk

            this.db = mongoose.connection;
            this.db.once('error', error => {
                console.error('connection error:', error);
                reject()
            })
            this.db.once('open', () => {
                console.info('Core connected to DB');
                resolve();
            });

            mongoose.connect(config.server.core.connectionString, { useNewUrlParser: true });
        });
    },
};

app.init().catch(console.error);