import type { INodeProperties } from 'n8n-workflow';
import { queryString } from '../../shared/routing';

const showOnlyForSanctionsScreen = {
	resource: ['sanctions'],
	operation: ['screen'],
};

export const sanctionsScreenDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'screenName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForSanctionsScreen },
		description: 'Name of the person or company to screen (at least 2 characters)',
		routing: { send: { type: 'query', property: 'name' } },
	},
	{
		displayName: 'Split Matches Into Items',
		name: 'splitMatches',
		type: 'boolean',
		default: false,
		displayOptions: { show: showOnlyForSanctionsScreen },
		description:
			'Whether to return each match as its own item. Off, you get one item with the matches under data and a summary under meta, which is easier to branch on when nothing matches.',
		routing: {
			output: {
				postReceive: [
					{
						type: 'rootProperty',
						enabled: '={{ $value }}',
						properties: { property: 'data' },
					},
				],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForSanctionsScreen },
		options: [
			{
				displayName: 'Entity Type',
				name: 'entityType',
				type: 'options',
				options: [
					{ name: 'Aircraft', value: 'aircraft' },
					{ name: 'Any', value: 'any' },
					{ name: 'Company', value: 'company' },
					{ name: 'Company (Legacy Value)', value: 'entity', description: 'Same as Company, kept for workflows saved before 0.1.4' },
					{ name: 'Person', value: 'person' },
					{ name: 'Unknown', value: 'unknown', description: 'Entries whose type the list does not state' },
					{ name: 'Vessel', value: 'vessel' },
				],
				default: 'any',
				description: 'Restrict the screen to one kind of entity',
				routing: queryString('entity_type'),
			},
			{
				displayName: 'Group by Entity',
				name: 'group',
				type: 'boolean',
				default: false,
				description: 'Whether to fold the matches into one row per listed person or company',
				routing: {
					send: { type: 'query', property: 'group', value: '={{ $value ? "entity" : undefined }}' },
				},
			},
			{
				displayName: 'Include ICIJ Offshore Leaks Mention',
				name: 'includeOffshoreLeaks',
				type: 'boolean',
				default: false,
				description:
					"Whether to add a separate offshore_leaks object from the ICIJ Offshore Leaks Database. A mention, never a sanction: static data (the leaks end in 2021), offshore entities and organisation intermediaries only, matched by name only, so a match is a prompt to look and not an identification. ICIJ's disclaimer, verbatim in offshore_leaks.notice: “There are legitimate uses for offshore companies and trusts. The inclusion of a person or entity in the ICIJ Offshore Leaks Database is not intended to suggest or imply that they have engaged in illegal or improper conduct. Many people and entities have the same or similar names. We suggest you confirm the identities of any individuals or entities included in the database based on addresses or other identifiable information. The data comes directly from the leaked files ICIJ has received in connection with various investigations and each dataset encompasses a defined time period specified in the database. Some information may have changed over time.” No extra credit",
				routing: {
					send: {
						type: 'query',
						property: 'include_offshore_leaks',
						value: '={{ $value ? true : undefined }}',
					},
				},
			},
			{
				displayName: 'Include PEP Screening (Beta, Spain Only)',
				name: 'includePep',
				type: 'boolean',
				default: false,
				description:
					'Whether to also screen against politically exposed persons. Beta and Spain only. It is not a complete PEP check: the list holds no relatives or close associates.',
				routing: {
					send: {
						type: 'query',
						property: 'include_pep',
						value: '={{ $value ? true : undefined }}',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
				description: 'Max number of results to return',
				routing: { send: { type: 'query', property: 'limit' } },
			},
			{
				displayName: 'Minimum Match Score',
				name: 'threshold',
				type: 'number',
				typeOptions: { minValue: 30, maxValue: 100 },
				default: 80,
				description: 'Only return matches at or above this confidence, from 30 to 100',
				routing: { send: { type: 'query', property: 'threshold' } },
			},
			{
				displayName: 'Minimum PEP Tier',
				name: 'pepMinTier',
				type: 'options',
				options: [
					{ name: 'Local', value: 'local' },
					{ name: 'National', value: 'national' },
					{ name: 'Regional', value: 'regional' },
				],
				default: 'local',
				description: 'With PEP screening: only return PEP hits at or above this tier',
				routing: queryString('pep_min_tier'),
			},
		],
	},
];
