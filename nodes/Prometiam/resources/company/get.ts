import type { INodeProperties } from 'n8n-workflow';
import { REGISTRY_COUNTRIES } from '../../shared/countries';
import { queryString } from '../../shared/routing';

const showOnlyForCompanyGet = {
	resource: ['company'],
	operation: ['get'],
};

export const companyGetDescription: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForCompanyGet },
		description:
			'The Prometiam company ID: the ID field of a search result. Officers are embedded where they exist (Spain, France, the United Kingdom and Norway only).',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForCompanyGet },
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: REGISTRY_COUNTRIES,
				default: 'ES',
				description: 'Country of the company. Set it if the company is not found by its ID alone.',
				routing: queryString('country'),
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{
						name: 'Insolvency Notices',
						value: 'insolvency',
						description:
							'Corporate insolvency notices only, in twelve markets (FR, DE, GB, AT, CH, NO, FI, US, NL, DK, HR, SE)',
					},
					{ name: 'LEI Record', value: 'lei' },
					{ name: 'Public Procurement Awards', value: 'procurement' },
					{
						name: 'Risk Flags (Registry Compliance)',
						value: 'risk_flags',
						description:
							'The register’s own signal that a company has stopped meeting its filing duties',
					},
				],
				default: [],
				description: 'Extra blocks to attach to the profile',
				routing: {
					send: {
						type: 'query',
						property: 'include',
						value: '={{ $value && $value.length ? $value.join(",") : undefined }}',
					},
				},
			},
		],
	},
];
