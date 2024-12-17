/*
 * Copyright the Collabora Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

namespace cool {
	export interface SignatureResponse {
		signatureTime: number;
		digest: string;
	}

	export interface CommandValuesResponse {
		commandName: string;
		commandValues: SignatureResponse;
	}

	export interface CommandResultResponse {
		commandName: string;
		success: boolean;
		// Depends on the value of commandName
		result: any;
	}

	// Describes one provider
	export interface MethodConfig {
		// Name of the provider
		action_type: string;
		supported_countries: Array<string>;
	}

	export interface HashSendResponse {
		doc_id: string;
		available_methods: Array<string>;
		method_configs: Array<MethodConfig>;
		message: string;
	}

	export interface SignedResponse {
		type: string;
		error: string;
	}

	export interface ReceiveSignatureResponse {
		status: string;
		signed_file_contents: string;
	}

	/**
	 * Provides electronic signing with document hashes for PDF files.
	 */
	export class ESignature {
		// Base url, e.g. https://id.eideasy.com or https://test.eideasy.com
		url: string;
		// This is a partial API token, see
		// <https://docs.eideasy.com/guide/api-credentials.html>
		clientId: string;

		// Timestamp of the hash extraction
		signatureTime: number;

		// Identifier of the document on the eIDEasy side
		docId: string;

		// The popup window we opened.
		popup: Window;

		availableProviderIDs: Array<string>;

		availableCountryCodes: Array<string>;

		// Provider ID to name map.
		static providerNames: { [name: string]: string } = {
			// The /api/client-config API would provide this, but having the data here
			// saves us from fetching the same data every time for every user.
			'id-signature': 'Estonian ID card',
			'mid-signature': 'Estonian Mobile-ID',
			'lt-mid-signature': 'Lithuanian Mobile-ID',
			'smart-id-signature': 'Smart-ID',
			'be-id-signature': 'Belgian ID card',
			'lt-id-signature': 'Lithuanian ID card',
			'lv-id-signature': 'Latvian ID card',
			'lv-eparaksts-mobile-signature': 'Latvian eParaksts Mobile',
			'fi-id-signature': 'Finnish ID card',
			'at-handy-signatur-signature': 'Austrian Handy-Signatur',
			'evrotrust-signature': 'Evrotrust',
			'd-trust-sign-me-qes-signature': 'D-Trust sign-me',
			'certeurope-usb-token-signature': 'CertEurope USB token',
			'certsign-usb-token-signature': 'certSIGN USB token',
			'zealid-signature': 'ZealID app',
			'audkenni-qes-signature': 'Audkenni',
			'simply-sign-qes-signature': 'SimplySign',
			'halcom-qes-signature': 'Halcom',
			'hr-id-signature': 'Croatian ID Card',
			'uanataca-qes-signature': 'Uanataca',
			'itsme-qes-signature': 'Itsme',
			'harica-qes-signature': 'Harica',
			'lt-id-qes-signature': 'LT ID',
			'trust-asia-signature': 'TrustAsia',
			'buypass-qes-signature': 'Buypass',
			'cert-store-qes-signature': 'Local Certificate',
			'fi-ftn-intesi-adv-signature':
				'Finnish Trust Network / Luottamusverkosto',
			'cz-id-signature': 'Czech ID Card',
			'es-lleida-advanced-signature': 'Lleida',
			'serpro-id-advanced-signature': 'SerproID',
		};

		// Country code to name map
		static countryNames: { [name: string]: string } = undefined;

		constructor(url: string, clientId: string) {
			this.url = url;
			this.clientId = clientId;

			app.map.on('commandvalues', this.onCommandValues.bind(this));
			app.map.on('commandresult', this.onCommandResult.bind(this));

			if (!ESignature.countryNames) {
				ESignature.countryNames = {
					// Generated by scripts/countries.py
					AD: _('Andorra'),
					AE: _('United Arab Emirates'),
					AL: _('Albania'),
					AM: _('Armenia'),
					AR: _('Argentina'),
					AT: _('Austria'),
					AU: _('Australia'),
					AX: _('Åland Islands'),
					AZ: _('Azerbaijan'),
					BA: _('Bosnia and Herzegovina'),
					BE: _('Belgium'),
					BG: _('Bulgaria'),
					BR: _('Brazil'),
					BY: _('Belarus'),
					CA: _('Canada'),
					CH: _('Switzerland'),
					CL: _('Chile'),
					CN: _('China'),
					CY: _('Cyprus'),
					CZ: _('Czech Republic'),
					DE: _('Germany'),
					DK: _('Denmark'),
					EE: _('Estonia'),
					ES: _('Spain'),
					FI: _('Finland'),
					FR: _('France'),
					GB: _('United Kingdom'),
					GE: _('Georgia'),
					GG: _('Guernsey'),
					GR: _('Greece'),
					HR: _('Croatia'),
					HU: _('Hungary'),
					ID: _('Indonesia'),
					IE: _('Ireland'),
					IL: _('Israel'),
					IN: _('India'),
					IS: _('Iceland'),
					IT: _('Italy'),
					JP: _('Japan'),
					KE: _('Kenya'),
					KR: _('South Korea'),
					KZ: _('Kazakhstan'),
					LI: _('Liechtenstein'),
					LT: _('Lithuania'),
					LU: _('Luxembourg'),
					LV: _('Latvia'),
					MC: _('Monaco'),
					MD: _('Moldova, Republic of'),
					ME: _('Montenegro'),
					MK: _('North Macedonia, Republic of'),
					MT: _('Malta'),
					MX: _('Mexico'),
					NL: _('Netherlands'),
					NO: _('Norway'),
					NZ: _('New Zealand'),
					PH: _('Philippines'),
					PL: _('Poland'),
					PT: _('Portugal'),
					QA: _('Qatar'),
					RO: _('Romania'),
					RS: _('Serbia'),
					RU: _('Russian Federation'),
					SA: _('Saudi Arabia'),
					SE: _('Sweden'),
					SG: _('Singapore'),
					SI: _('Slovenia'),
					SK: _('Slovakia'),
					SM: _('San Marino'),
					TR: _('Turkey'),
					TW: _('Taiwan, Province of China'),
					UA: _('Ukraine'),
					US: _('United States of America'),
					VA: _('Holy See (Vatican City State)'),
					XK: _('Kosovo'),
					ZA: _('South Africa'),
				};
			}
		}

		insert(): void {
			// Step 1: extract the document hash.
			app.socket.sendMessage('commandvalues command=.uno:Signature');
		}

		// Handles the result of dispatched UNO commands
		onCommandResult(event: CommandResultResponse): void {
			if (event.commandName == '.uno:PrepareSignature') {
				const response = <HashSendResponse>event.result;
				this.handleSendHashResponse(event.success, response);
			} else if (event.commandName == '.uno:DownloadSignature') {
				const response = <ReceiveSignatureResponse>event.result;
				this.handleReceiveSignatureResponse(response);
			}
		}

		// Handles the command values response for .uno:Signature
		onCommandValues(event: CommandValuesResponse): void {
			if (event.commandName != '.uno:Signature') {
				return;
			}

			const signatureResponse = event.commandValues;

			// Save this, we'll need it for the serialize step.
			this.signatureTime = signatureResponse.signatureTime;

			const digest = signatureResponse.digest;

			// Step 2: send the hash, get a document ID.
			const redirectUrl = window.makeHttpUrl('/cool/signature');
			const documentName = <HTMLInputElement>(
				document.querySelector('#document-name-input')
			);
			const fileName = documentName.value;
			const body = {
				client_id: this.clientId,
				// Create a PKCS#7 binary signature
				container_type: 'cades',
				files: [
					{
						// Actual file name appears during 2FA
						fileName: fileName,
						mimeType: 'application/pdf',
						fileContent: digest,
					},
				],
				// Learn about possible providers
				return_available_methods: true,
				// Learn about which provider is available in which country
				return_method_configs: true,
				signature_redirect: redirectUrl,
				// Automatic file download will not happen after signing
				nodownload: true,
			};
			const args = {
				body: body,
			};
			app.map.sendUnoCommand('.uno:PrepareSignature', args);
		}

		// Handles the 'send hash' response JSON
		handleSendHashResponse(ok: boolean, response: HashSendResponse): void {
			if (!ok) {
				app.console.log(
					'/api/signatures/prepare-files-for-signing failed: ' +
						response.message,
				);
				return;
			}

			this.docId = response.doc_id;
			this.availableProviderIDs = response.available_methods;
			const availableProviderConfigs = response.method_configs;
			const countries = this.createCountryList(availableProviderConfigs);
			const providers = this.createProviders(this.availableProviderIDs);
			const dialog = JSDialog.eSignatureDialog(countries, providers);
			// Providers can be in-context or redirect-based.  Most real-world providers
			// are redirect-based, set the only tested non-in-context provider as
			// preferred.
			dialog.setDefaultProviderId('d-trust-sign-me-qes-signature');
			// Set the country for the default provider as preferred.
			dialog.setDefaultCountryCode('DE');
			dialog.open();
		}

		// Handles the selected provider from the dialog
		handleSelectedProvider(countryCode: string, providerId: string): void {
			app.console.log(
				'attempting to esign using the "' + providerId + '" provider',
			);

			let url = this.url + '/single-method-signature';
			url += '?client_id=' + this.clientId;
			url += '&doc_id=' + this.docId;
			url += '&method=' + providerId;
			url += '&country=' + countryCode;

			const lang = window.coolParams.get('lang');
			if (lang) {
				// Two letter ISO 639-1 language code is wanted, but it seems to
				// accept our xx-YY version.
				url += '&lang=' + lang;
			}

			let features = 'popup';
			features += ', left=' + window.screen.width / 4;
			features += ', top=' + window.screen.height / 4;
			features += ', width=' + window.screen.width / 2;
			features += ', height=' + window.screen.height / 2;

			// Step 3: sign the hash.
			this.popup = window.open(url, '_blank', features);
		}

		// Handles the 'sign hash' response
		handleSigned(response: SignedResponse): void {
			if (response.type != 'SUCCESS') {
				app.console.log('failed to sign: ' + response.error);
				return;
			}

			try {
				if (this.popup) {
					this.popup.close();
				}
			} catch (error) {
				app.console.log('failed to close the signing popup: ' + error.message);
				return;
			}

			// Step 4: fetch the signature.
			const body = {
				client_id: this.clientId,
				doc_id: this.docId,
			};
			const args = {
				body: body,
			};
			app.map.sendUnoCommand('.uno:DownloadSignature', args);
		}

		// Handles the 'receive signature' response JSON
		handleReceiveSignatureResponse(response: ReceiveSignatureResponse): void {
			if (response.status != 'OK') {
				app.console.log(
					'received signature status is not OK: ' + response.status,
				);
				return;
			}

			// Step 5: serialize the signature.
			const args = {
				SignatureTime: {
					type: 'string',
					value: String(this.signatureTime),
				},
				SignatureValue: {
					type: 'string',
					value: response.signed_file_contents,
				},
			};
			app.map.sendUnoCommand('.uno:Signature', args);
		}

		// Turns a list of provider IDs into a list of signature providers
		createProviders(providerIds: Array<string>): Array<cool.SignatureProvider> {
			return providerIds.map((id) => {
				const providerName = ESignature.providerNames[id];
				if (providerName) {
					return { action_type: id, name: providerName };
				}
				app.console.log(
					'failed to find a human-readable name for provider "' + id + '"',
				);
				return { action_type: id, name: id };
			});
		}

		createCountryList(
			availableProviderConfigs: Array<MethodConfig>,
		): Array<cool.Country> {
			let codes = new Array<string>();
			for (const config of availableProviderConfigs) {
				for (const code of config.supported_countries) {
					codes.push(code);
				}
			}
			codes = [...new Set(codes)].sort();
			this.availableCountryCodes = codes;

			return codes.map((code) => {
				const countryName = ESignature.countryNames[code];
				if (countryName) {
					return { code: code, name: countryName };
				}
				app.console.log(
					'failed to find a human-readable name for country "' + code + '"',
				);
				return { code: code, name: code };
			});
		}
	}
}

L.Control.ESignature = cool.ESignature;

L.control.eSignature = function (url: string, clientId: string) {
	return new L.Control.ESignature(url, clientId);
};
