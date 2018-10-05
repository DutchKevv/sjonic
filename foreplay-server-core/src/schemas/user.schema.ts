import { Schema, model } from 'mongoose';
import { isEmail } from 'validator';
import { USER_GENDER_UNKNOWN, USER_GENDER_MALE, USER_GENDER_FEMALE, USER_GENDER_OTHER } from '@foreplay/shared/constants';
import { countries } from "@foreplay/shared/countries";
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import { IReqUser } from '@foreplay/shared/interfaces/request.interface';


export const UserSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			min: [2, 'name: min length 2'],
			max: [30, 'name: max length 30']
		},
		email: {
			type: String,
			unique: true,
			required: true,
			validate: [isEmail, 'invalid email'],
			lowercase: true,
			trim: true,
			select: false
		},
		password: {
			type: String,
			minlength: 4,
			select: false
		},
		fake: {
			type: Boolean
		},
		characters: {
			type: [Schema.Types.ObjectId],
			default: [],
			ref: 'Character'
		},
		img: {
			type: String,
			trim: true
		},
		gender: {
			type: Number,
			default: USER_GENDER_UNKNOWN,
			enum: [USER_GENDER_UNKNOWN, USER_GENDER_MALE, USER_GENDER_FEMALE, USER_GENDER_OTHER]
		},
		description: {
			type: String,
			default: ''
		},
		country: {
			type: String,
			default: 'US',
			trim: true,
			enum: countries.map(country => country.code)
		},
		transactions: {
			type: Schema.Types.ObjectId,
			required: false,
			select: false
		},
		lastOnline: {
			type: Date,
			required: false,
			default: Date.now
		},
		membershipStartDate: {
			type: Date,
			required: false,
			default: Date.now,
			select: false
		},
		membershipEndDate: {
			type: Date,
			required: false,
			select: false
		},
		membershipType: {
			type: String,
			required: false,
			default: 'free'
		},
		confirmed: {
			type: Boolean,
			default: false,
			select: false
		},
		resetPasswordToken: {
			type: String,
			select: false
		},
		resetPasswordExpires: {
			type: Date,
			select: false
		},
		emailConfirmed: {
			type: Boolean,
			default: false,
			select: false
		},
		oauthFacebook: {
			type: {
				id: String,
				token: String
			},
			select: false
		},
		removed: {
			type: Boolean
		}
	},
	{
		timestamps: true
	}
);

UserSchema.pre('validate', function (next) {
	if (!this['password'] && (!this['oauthFacebook'] || !this['oauthFacebook']['id'])) {
		next(new Error('Password must be given'));
	} else {
		next();
	}
});

UserSchema.plugin(beautifyUnique);

export const User = model('User', UserSchema);