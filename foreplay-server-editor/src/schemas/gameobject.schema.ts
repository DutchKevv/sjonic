import { Schema, model } from 'mongoose';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import * as autoIncrement from 'mongoose-auto-increment';

const GameObjectSchema = new Schema(
	{
		type: {
			type: String,
			required: true
		},
		name: {
			type: String,
			required: true,
			unique: true
		},
		description: {
			type: String
		},
		img: {
			type: String
		},
		width: {
			type: Number
		},
		height: {
			type: Number
		},
		depth: {
			type: Number
		},
		behavior: {
			type: Schema.Types.ObjectId
		}
	},
	{
		timestamps: true
	}
);

// GameObjectSchema.plugin(autoIncrement.plugin, 'GameObject');
GameObjectSchema.plugin(beautifyUnique);

export const GameObject = model('GameObject', GameObjectSchema);