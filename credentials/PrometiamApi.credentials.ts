import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { BASE_URL } from '../nodes/Prometiam/shared/constants';

export class PrometiamApi implements ICredentialType {
	name = 'prometiamApi';

	displayName = 'Prometiam API';

	icon: Icon = { light: 'file:../icons/prometiam.svg', dark: 'file:../icons/prometiam.dark.svg' };

	documentationUrl = 'https://www.prometiam.com/risk-api/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your Prometiam API key. It starts with rk_live_. Create one for free at https://www.prometiam.com/signup',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// Saving the credential makes one call to GET /account, which any valid key can read.
	test: ICredentialTestRequest = {
		request: {
			baseURL: BASE_URL,
			url: '/account',
			method: 'GET',
		},
	};
}
