import type { INodeProperties } from 'n8n-workflow';
import { INSOLVENCY_COUNTRIES } from '../../shared/countries';
import { cursorPagination, queryString } from '../../shared/routing';

const showOnlyForInsolvencySearch = {
	resource: ['insolvency'],
	operation: ['search'],
};

export const insolvencySearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: showOnlyForInsolvencySearch },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: cursorPagination,
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { ...showOnlyForInsolvencySearch, returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		routing: {
			send: { type: 'query', property: 'limit' },
			output: { maxResults: '={{$value}}' },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showOnlyForInsolvencySearch },
		description:
			'Give at least one of Company Name, Company Number, Country, Event Type or Date From. Corporate insolvency only, in nine markets.',
		options: [
			{
				displayName: 'Company Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Company name, matched anywhere in the name (at least 2 characters)',
				routing: queryString('name'),
			},
			{
				displayName: 'Company Number',
				name: 'companyNumber',
				type: 'string',
				default: '',
				description:
					'Registry number of the debtor exactly as printed on the notice (SIREN for France, company number for the United Kingdom). Combine it with Country.',
				routing: queryString('company_number'),
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: INSOLVENCY_COUNTRIES,
				default: 'FR',
				description:
					'Country of the notice. These nine markets are not the same set as the company registries.',
				routing: queryString('country'),
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Only notices filed on or after this date',
				routing: {
					send: {
						type: 'query',
						property: 'date_from',
						value: '={{ $value ? String($value).substring(0, 10) : undefined }}',
					},
				},
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Only notices filed on or before this date',
				routing: {
					send: {
						type: 'query',
						property: 'date_to',
						value: '={{ $value ? String($value).substring(0, 10) : undefined }}',
					},
				},
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'string',
				default: '',
				placeholder: 'e.g. insolvency, liquidation, forced_sale',
				description:
					'Kind of event, for example insolvency, dissolution, liquidation or forced_sale',
				routing: queryString('event_type'),
			},
		],
	},
];
