import { Schema, model } from 'mongoose';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

export const CharacterSchema = new Schema(
    {
        type: {
            type: Number,
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            min: [2, 'name: min length 2'],
            max: [30, 'name: max length 30']
        },
        level: {
            type: Number,
            default: 1
        },
        map: {
            type: String,
            default: 'default'
        },
        position: {
            x: Number,
            y: Number,
            z: Number
        },
        inventory: {
            type: [Schema.Types.ObjectId],
            default: []
        },
        equiped: {
            type: [Schema.Types.ObjectId],
            default: []
        }
    },
    {
        timestamps: true
    }
);

CharacterSchema.plugin(beautifyUnique);

export const Character = model('Character', CharacterSchema);