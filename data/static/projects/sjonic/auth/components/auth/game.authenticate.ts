import './game.authenticate.scss';
import HTML from './game.authenticate.template.html';
import * as $ from 'jquery';
import { config } from '../../../engine.config';
import { API_ERROR_FIELD_DUPLICATE } from '@foreplay/shared/constants';

console.log(config);

const auth = window['auth'] = {
	user: null,
	music: null,

	async loadGame(token: string): Promise<void> {
		if (!token)
			throw new Error('token must be given');

		config.credentials = config.credentials || {};
		config.credentials.token = token;

		// store last used credentials in storage
		localStorage.setItem('auth', JSON.stringify(config.credentials));

		// start the game in new window
		window.location.href = 'index.game.html?token=' + token;
	},

	async login(formElement?: HTMLFormElement) {
		const formData = <any>new FormData(formElement);
		const email = formData.get('email');
		const password = formData.get('password');

		try {
			this.user = await $.post(this.buildUrl('authenticate'), { email, password });

			//Show chars, onclick go to the game
			// for (var key in this.user.characters) {
			// 	const character = this.user.characters[key];
			// 	const buttonHTML = `<button class='form-control btn' onClick='window.auth.loadGame("${this.user.token}","${character._id}")'>${character.name}</button>`;
			// 	$("#chars_select").append(buttonHTML);
			// }

			// this.toggleForm('characterSelect');
			this.loadGame(this.user.token)
		} catch (error) {
			console.error(error);
		}
	},

	async register(formElement: HTMLFormElement): Promise<void> {
		if (!formElement.checkValidity())
			return;

		try {
			const fetchOptions = {
				method: 'POST',
				body: new FormData(formElement)
			}

			const response = await fetch(this.buildUrl('user'), fetchOptions);
			const result = await response.json();

			// success
			if (response.ok)
				return this.toggleForm('login');

			// error
			switch (result.code) {
				case API_ERROR_FIELD_DUPLICATE:
					$('#registerForm input[name=email]').addClass('input-error');
					break;
				default:
					console.error(result);
					throw new Error('Unhandled error');

			}
		} catch (error) {
			console.error(error);
		}
	},

	// async addCharacter(formElement: HTMLFormElement): Promise<void> {
	// 	try {
	// 		const fetchOptions = {
	// 			method: 'POST',
	// 			body: new FormData(formElement),
	// 			headers: {
	// 				'authorization': 'Bearer ' + this.user.token
	// 			}
	// 		}

	// 		const response = await fetch(this.buildUrl('character'), fetchOptions);
	// 		const result = await response.json();

	// 		if (response.ok)
	// 			return this.loadGame(this.user.token, result._id);

	// 		// error
	// 		switch (result.code) {
	// 			case API_ERROR_FIELD_DUPLICATE:
	// 				$('#addCharacterForm input[name=name]').addClass('input-error');
	// 				break;
	// 			default:
	// 				console.error(result);
	// 				throw new Error('Unhandled error');

	// 		}
	// 	} catch (error) {
	// 		console.error(error);
	// 	}
	// },

	toggleForm(formName: string): void {
		$('form').hide();
		$(`#${formName}Form`).show();
	},

	playMusic() {
		this.music = new Audio('/static/games/sjonic/audio/login_ost.mp3');
		this.music.loop = true;
		this.music.volume = 0.8;
		this.music.play();
	},

	buildUrl(url: string) {
		url = `${config.api.protocol}//${config.api.host}${config.api.port ? ':' + config.api.port : ''}${config.api.prefix}${url}`;

		// remove double slashes
		return url.replace(/([^:]\/)\/+/g, "$1");
	},

	async checkStoredCredentials(): Promise<void> {
		const credentials = JSON.parse(localStorage.getItem("auth"));

		if (credentials && credentials.token && credentials.characterId) {
			await this.loadGame(credentials.token, credentials.characterId);
		}
	}
};

auth.checkStoredCredentials().finally(() => {
	document.body.innerHTML = HTML;
	auth.playMusic();
});