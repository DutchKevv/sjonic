import * as fs from 'fs';
import * as path from 'path';
import * as faker from 'faker';
import * as request from 'requestretry';
import { PLAYER_TYPE_NPC } from '@foreplay/shared/constants';

export const fakeController = {

    async addUsers(reqUser, amount: number = 20) {
        // console.log(amount);
        while (amount--) {
            const user = {
                name: faker.name.findName(),
                email: faker.internet.email(),
                password: 'test',
                fake: true
            }

            const character = {
                name: faker.name.findName(),
                type: PLAYER_TYPE_NPC
            }

            // add user
            const userResult = <any>await request({
                url: 'http://game:3002/api/v1/user',
                method: 'POST',
                json: true,
                body: user,
                // The below parameters are specific to request-retry
                maxAttempts: 1,   // (default) try 5 times
                retryDelay: 5000,  // (default) wait for 5s before trying again
                // retryStrategy: request.RetryStrategies.HTTPOrNetworkError // (default) retry on 5xx or network errors
            });

            const characterResult = await request({
                url: 'http://game:3002/api/v1/character',
                method: 'POST',
                json: true,
                body: character,
                headers: {
                    authorization: 'Bearer ' + userResult.body.token
                },
                // The below parameters are specific to request-retry
                maxAttempts: 1,   // (default) try 5 times
                retryDelay: 5000,  // (default) wait for 5s before trying again
                // retryStrategy: request.RetryStrategies.HTTPOrNetworkError // (default) retry on 5xx or network errors
            });

            // add character

            console.log(userResult.body, characterResult.body);
        }
    }
};
