import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { companyDescription } from './resources/company';
import { coverageDescription } from './resources/coverage';
import { insolvencyDescription } from './resources/insolvency';
import { sanctionsDescription } from './resources/sanctions';
import { validationDescription } from './resources/validation';
import { BASE_URL } from './shared/constants';
import { requestOptions } from './shared/requestOptions';

export class Prometiam implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Prometiam',
		name: 'prometiam',
		icon: { light: 'file:../../icons/prometiam.svg', dark: 'file:../../icons/prometiam.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Search European companies, screen names against sanctions lists (beta), check corporate insolvency notices, and validate VAT numbers and LEIs',
		defaults: {
			name: 'Prometiam',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'prometiamApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'Coverage', value: 'coverage' },
					{ name: 'Insolvency', value: 'insolvency' },
					{ name: 'Sanctions Screening', value: 'sanctions' },
					{ name: 'Validation', value: 'validation' },
				],
				default: 'company',
			},
			...companyDescription,
			...sanctionsDescription,
			...insolvencyDescription,
			...validationDescription,
			...coverageDescription,
			requestOptions,
		],
	};
}
