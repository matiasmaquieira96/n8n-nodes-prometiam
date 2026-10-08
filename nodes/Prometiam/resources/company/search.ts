import type { INodeProperties } from 'n8n-workflow';
import { CANONICAL_STATUSES, REGISTRY_COUNTRIES } from '../../shared/countries';
import { cursorPagination, queryString } from '../../shared/routing';

const showOnlyForCompanySearch = {
	resource: ['company'],
	operation: ['search'],
};

export const companySearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: showOnlyForCompanySearch },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: cursorPagination,
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { ...showOnlyForCompanySearch, returnAll: [false] } },
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
		displayOptions: { show: showOnlyForCompanySearch },
		description:
			'Give at least one of Name or an identifier. If you leave Country out, the API uses the first country allowed for your key (usually Spain).',
		options: [
			{
				displayName: 'Company Number',
				name: 'companyNumber',
				type: 'string',
				default: '',
				description:
					'Registry number, exact match: Spanish NIF or CIF, French SIREN, UK company number, Irish CRO number, Polish KRS number, Norwegian organisation number, Croatian MBS, Belgian enterprise number or Danish CVR number. Use it together with Country.',
				routing: queryString('company_number'),
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: REGISTRY_COUNTRIES,
				default: 'ES',
				description: 'Country to search',
				routing: queryString('country'),
			},
			{
				displayName: 'Founded After',
				name: 'foundedAfter',
				type: 'dateTime',
				default: '',
				description:
					'Only companies incorporated on or after this date. Works without a name: run it daily for newly incorporated companies.',
				routing: {
					send: {
						type: 'query',
						property: 'founded_after',
						value: '={{ $value ? String($value).substring(0, 10) : undefined }}',
					},
				},
			},
			{
				displayName: 'Founded Before',
				name: 'foundedBefore',
				type: 'dateTime',
				default: '',
				description: 'Only companies incorporated on or before this date',
				routing: {
					send: {
						type: 'query',
						property: 'founded_before',
						value: '={{ $value ? String($value).substring(0, 10) : undefined }}',
					},
				},
			},
			{
				displayName: 'Local Status',
				name: 'localStatus',
				type: 'string',
				default: '',
				description: "Only companies with this status in the register's own words, as shown in the local_status field of a result",
				routing: queryString('local_status'),
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description:
					'Company name or the first letters of it. Partial names match, best match first.',
				routing: queryString('name'),
			},
			{
				displayName: 'NIP (Poland)',
				name: 'nip',
				type: 'string',
				default: '',
				description: 'Polish NIP (10 digits), exact match. Use it with Country set to Poland.',
				routing: queryString('nip'),
			},
			{
				displayName: 'OIB (Croatia)',
				name: 'oib',
				type: 'string',
				default: '',
				description: 'Croatian OIB (11 digits), exact match. Use it with Country set to Croatia.',
				routing: queryString('oib'),
			},
			{
				displayName: 'REGON (Poland)',
				name: 'regon',
				type: 'string',
				default: '',
				description:
					'Polish REGON (9 or 14 digits), exact match. Use it with Country set to Poland.',
				routing: queryString('regon'),
			},
			{
				displayName: 'SIREN (France)',
				name: 'siren',
				type: 'string',
				default: '',
				description: 'French SIREN (9 digits)',
				routing: queryString('siren'),
			},
			{
				displayName: 'SIRET (France)',
				name: 'siret',
				type: 'string',
				default: '',
				description: 'French SIRET (14 digits)',
				routing: queryString('siret'),
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: CANONICAL_STATUSES,
				default: 'active',
				description:
					'Only companies with this standard status (the same list in every country). Outside Spain it must be combined with a name or an identifier.',
				routing: queryString('status'),
			},
			{
				displayName: 'VAT Number',
				name: 'vat',
				type: 'string',
				default: '',
				description:
					'VAT or tax number, exact match; an alias of Company Number. For Croatia use HR plus the 11-digit OIB, for Belgium BE plus the 10-digit enterprise number, for Denmark DK plus the 8-digit CVR number.',
				routing: queryString('vat'),
			},
		],
	},
];
