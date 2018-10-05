import * as jwt from 'jsonwebtoken';
import { User } from '../schemas/user.schema';
import { IUser } from "@foreplay/shared/interfaces/user.interface";
import { IReqUser } from '@foreplay/shared/interfaces/request.interface';
import { config } from '../config';
import * as bcrypt from 'bcryptjs';
import { characterController } from './character.controller';

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string, fields?: Array<string> }): Promise<any> {
		let user, fieldsObj: any = {};

		// normalize fields
		if (!params.fields || !params.fields.length) {
			params.fields = ['_id'];
		}
		params.fields.forEach(field => fieldsObj[field] = 1);

		// by token
		if (reqUser && reqUser.uId) {
			user = <IUser>await (<any>User).findById(reqUser.uId, fieldsObj).lean();

			if (!user || !user._id) return null;
		}

		// by email + password
		else {
			fieldsObj.password = 1;

			// find user by email
			user = <IUser>(await User.findOne({ email: params.email.toLowerCase() }, fieldsObj).lean());
			if (!user || !user._id) return null;

			// check password
			const passwordCheck = await bcrypt.compare(params.password, user.password);
			if (passwordCheck !== true) return null;

			delete user.password;
		}

		// set token
		user.token = jwt.sign({ uId: user._id }, config.auth.jwt.secret);

		// add characters
		user.characters = await characterController.findByUserId({uId: user._id});

		return user;
	}
};