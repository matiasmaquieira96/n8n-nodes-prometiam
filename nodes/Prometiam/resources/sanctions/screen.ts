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
					{ name: 'Any', value: 'any' },
					{ name: 'Company or Other Entity', value: 'entity' },
					{ name: 'Person', value: 'person' },
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
				typeOptions: { minValue: 50, maxValue: 100 },
				default: 80,
				description: 'Only return matches at or above this confidence, from 50 to 100',
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
