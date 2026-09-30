import type { INodeProperties } from 'n8n-workflow';
import { REGISTRY_COUNTRIES } from '../../shared/countries';

const showOnlyForCompanyLookup = {
	resource: ['company'],
	operation: ['lookup'],
};

const showForFields = { ...showOnlyForCompanyLookup, inputMode: ['fields'] };
const showForJson = { ...showOnlyForCompanyLookup, inputMode: ['json'] };

/** An empty string would be sent as "", which the API reads as a value: leave the key out instead. */
const orUndefined = '={{ $value || undefined }}';

export const companyLookupDescription: INodeProperties[] = [
	{
		displayName: 'Input Mode',
		name: 'inputMode',
		type: 'options',
		options: [
			{ name: 'Define Below', value: 'fields', description: 'Add each company as a row' },
			{
				name: 'JSON',
				value: 'json',
				description: 'Give the items as a JSON array, for example from a previous node',
			},
		],
		default: 'fields',
		displayOptions: { show: showOnlyForCompanyLookup },
		description:
			'Resolve up to 100 companies in one call. Every item counts as one request against your plan. Batch calls are not part of the free trial.',
	},
	{
		displayName: 'Companies',
		name: 'companies',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Company',
		default: {},
		displayOptions: { show: showForFields },
		description: 'Each row is a country plus a company number, or a country plus a name',
		options: [
			{
				displayName: 'Company',
				name: 'item',
				values: [
					{
						displayName: 'Company Number',
						name: 'companyNumber',
						type: 'string',
						default: '',
						description:
							'Registry number: NIF (Spain), SIREN (France), company number (United Kingdom), CRO number (Ireland) and so on',
						routing: {
							send: {
								type: 'body',
								property: '=items[{{$index}}].company_number',
								value: orUndefined,
							},
						},
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'options',
						options: REGISTRY_COUNTRIES,
						default: 'ES',
						description: 'Country to search',
						routing: {
							send: { type: 'body', property: '=items[{{$index}}].country', value: orUndefined },
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description:
							'Company name for a fuzzy lookup; the best match is returned with its match score',
						routing: {
							send: { type: 'body', property: '=items[{{$index}}].name', value: orUndefined },
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Items (JSON)',
		name: 'itemsJson',
		type: 'json',
		default: '[\n  { "country": "ES", "company_number": "A46103834" }\n]',
		required: true,
		displayOptions: { show: showForJson },
		description:
			'A JSON array of 1 to 100 items. Each item has country plus company_number (or siren, nif, vat), or country plus name.',
		routing: {
			send: {
				type: 'body',
				property: 'items',
				value: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForCompanyLookup },
		options: [
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Send the same value again to replay the same batch safely within 24 hours; a replay does not use quota again',
				routing: {
					request: { headers: { 'Idempotency-Key': '={{ $value || undefined }}' } },
				},
			},
		],
	},
];
