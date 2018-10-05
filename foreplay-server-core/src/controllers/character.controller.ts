import * as bcrypt from 'bcryptjs';
import { User, UserSchema } from '../schemas/user.schema';
import { API_ERROR_EXPIRED, API_ERROR_NOT_FOUND, PLAYER_TYPE_HUMAN } from '@foreplay/shared/constants';
import { IReqUser } from "@foreplay/shared/interfaces/request.interface";
import { IUser } from "@foreplay/shared/interfaces/user.interface";
import { ICharacter } from "@foreplay/shared/interfaces/character.interface";
import { Character } from '../schemas/character.schema';

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const characterController = {

    async findById(reqUser: IReqUser, characterId: string, setActive: boolean = false) {
        if (!characterId)
            throw new Error('userId is required');

        return Character.findById(characterId).populate('user').lean();
    },

    async findByUserId(reqUser) {
        const characters = <IUser>await Character.find({user: reqUser.uId}).lean();

        return characters;
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

    async create(reqUser: IReqUser, params: ICharacter) {
        let characterData: ICharacter = {
            user: reqUser.uId,
            name: params.name,
            type: params.type || PLAYER_TYPE_HUMAN
        }

        // create character
        const character = <ICharacter>(await Character.create(characterData));

        // update user with characters
        await User.updateOne({_id: reqUser.uId}, { $addToSet: { characters: character._id }});

        return {
            _id: character._id,
            name: character.name
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