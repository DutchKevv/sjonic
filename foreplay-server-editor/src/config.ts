import * as _isDocker from 'is-docker';

const isDocker = _isDocker();

export const config = {
    auth: {
        jwt: {
            secret: 'SeA MoNKiES LoVE RiDiNG My BuTTeR-FlY'
        }
    },
    server: {
        editor: {
            port: 3001,
            host: isDocker ? '0.0.0.0' : 'localhost',
            connectionString: `mongodb://root:example@${isDocker ? 'mongo' : '127.0.0.1'}:27017/sjonic?authSource=admin`
        }
    }
}

