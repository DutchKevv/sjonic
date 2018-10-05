import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserSchema } from '../schemas/user.schema';
import { API_ERROR_EXPIRED, API_ERROR_NOT_FOUND, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM } from '@foreplay/shared/constants';
import { IReqUser } from "@foreplay/shared/interfaces/request.interface";
import { IUser } from "@foreplay/shared/interfaces/user.interface";
import { config } from '../config';

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

    getAllowedFields: ['_id', 'name', 'img', 'description', 'country', 'followers', 'following', 'followersCount', 'membershipStartDate', 'description', 'balance'],

    async findById(reqUser, userId, type: number = USER_FETCH_TYPE_SLIM, fields: Array<string> = ['_id', 'name', 'img', 'followers', 'followersCount']) {
        if (!userId)
            throw new Error('userId is required');

        let fieldsArr = [];
        let user;

        switch (type) {
            case USER_FETCH_TYPE_ACCOUNT_DETAILS:
                fieldsArr = ['name', 'country', 'balance', 'leverage'];
                break;
            case USER_FETCH_TYPE_PROFILE_SETTINGS:
                fieldsArr = ['country', 'leverage', 'gender', 'description'];
                break;
            case USER_FETCH_TYPE_SLIM:
            default:
                fieldsArr = fields;
                break;
        }

        let fieldsObj = {};
        fieldsArr.forEach(field => fieldsObj[field] = 1);
        user = await User.findById(userId, fieldsObj).lean();

        if (user) {
            UserSchema.statics.normalize(reqUser, user);
        }

        return user;
    },

    async findMany(reqUser, params) {
        const limit = parseInt(params.limit, 10) || 20;
        const sort = params.sort || -1;

        // Filter allowed fields
        const fields: any = {};
        (params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);

        const where: any = {};
        if (params.email)
            where.email = params.email;

        if (params.text)
            where.name = { "$regex": params.text, "$options": "i" }

        if (params.facebookId)
            where['oauthFacebook.id'] = { "$eq": params.facebookId }

        fields.followers = 1;
        const users = <Array<IUser>>await User.find(where, fields).sort({ _id: sort }).limit(limit).lean();
        users.forEach((user) => {
            (<any>User).normalize(reqUser, user);
            delete user['followers'];
        });

        // TODO - does not belong here
        if (params.facebookId && users.length)
            users[0].token = jwt.sign({ uId: users[0]._id }, config.auth.jwt.secret);

        return users;
    },

    async findByEmail(reqUser, email: string, fields: Array<string> = []) {
        let fieldsObj = {};
        fields.forEach(field => fieldsObj[field] = 1);

        const user = await User.findOne({ email }, fields);

        if (user)
            (<any>User).normalize(reqUser, user)

        return user;
    },

    async findByText(reqUser: IReqUser, text: string): Promise<Array<IUser>> {
        const users = await User.find({ $match: { name: new RegExp('.*' + text + '.*', 'i') } });

        users.forEach(user => (<any>User).normalize(reqUser, user));

        return users;
    },

    async create(reqUser: IReqUser, params: IUser) {
        // hash password
        // TODO - unique hash per user
        if (params.password) {
            await new Promise((resolve, reject) => {
                bcrypt.hash(params.password, 10, (error, password) => {
                    if (error)
                        return reject(error);

                    params.password = password;
                    resolve();
                });
            });
        }

        let userData: IUser = {
            email: params.email,
            name: params.name,
            img: params.img,
            gender: params.gender,
            password: params.password,
            country: params.country,
            fake: params.fake
        };

        // facebook user
        if (params.oauthFacebook && params.oauthFacebook.id) {
            userData.confirmed = true;
            userData.oauthFacebook = {
                id: params.oauthFacebook.id
            };
        }

        const user = <IUser>(await User.create(userData)).toObject();

        return {
            _id: user._id,
            token: jwt.sign({ uId: user._id }, config.auth.jwt.secret),
        };
    },

    // TODO - Filter fields
    async update(reqUser: IReqUser, userId: string, params: any): Promise<void> {
        if (params.password) {
            // await this.updatePassword(reqUser, undefined, params.password);
            delete params.password;
        }

        const user = await User.findByIdAndUpdate(userId, params);

        if (!user)
            throw ({ code: API_ERROR_NOT_FOUND, user: userId });
    },

    // TODO - Filter fields
    async updatePassword(reqUser: IReqUser, token: string, password: string): Promise<void> {
        let user;

        if (token)
            user = await User.findOne({ resetPasswordToken: token }, { resetPasswordExpires: 1 });
        else if (reqUser.uId)
            user = await User.findById(reqUser.uId);

        // Update redis and other micro services
        if (!user)
            throw ({ code: API_ERROR_NOT_FOUND });

        if (token && user.resetPasswordExpires < new Date())
            throw ({ code: API_ERROR_EXPIRED });

        user.password = bcrypt.hashSync(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
    },

    async requestPasswordReset(reqUser, email: string): Promise<{ _id: string, resetPasswordToken: string, resetPasswordExpires: number, name: string }> {
        const token = bcrypt.genSaltSync(10);
        const expires = Date.now() + RESET_PASSWORD_TOKEN_EXPIRE;

        const user = <IUser>await User.findOneAndUpdate({ email }, { resetPasswordToken: token, resetPasswordExpires: expires }, { fields: { _id: 1, name: 1 } }).lean();

        if (!user)
            throw ({ code: API_ERROR_NOT_FOUND });

        return { _id: user._id, resetPasswordToken: token, resetPasswordExpires: expires, name: user.name };
    },

    async toggleFollow(reqUser: { uId: string }, userId: string, state?: boolean): Promise<any> {
        if (userId === reqUser.uId)
            throw new Error('Cannot follow self');

        const user = await <any>User.findById(userId, { followers: 1 });

        // TODO: validity checks
        if (!user)
            throw new Error('User not found');

        const isCurrentlyFollowing = user.followers && user.followers.indexOf(reqUser.uId) > -1;

        // unfollow
        if (isCurrentlyFollowing) {
            await user.update({ $pull: { followers: reqUser.uId }, $inc: { followersCount: -1 } });
        }
        // follow
        else {
            await user.update({ $addToSet: { followers: reqUser.uId }, $inc: { followersCount: 1 } });

            // send notification
            let pubOptions = {
                type: 'user-follow',
                toUserId: userId,
                fromUserId: reqUser.uId,
                data: {}
            };
        }

        return { state: !isCurrentlyFollowing };
    },

    remove(reqUser, id): Promise<any> {
        if (reqUser.uId !== id)
            throw ({ code: '???', message: 'Remove user - req.user.id and userId to not match' });

        return this.update(reqUser, id, { removed: true });
    }
};