import type { INodeProperties } from 'n8n-workflow';
import { REGISTRY_COUNTRIES } from '../../shared/countries';

const showOnlyForCompanyAutocomplete = {
	resource: ['company'],
	operation: ['autocomplete'],
};

/**
 * The API has no separate autocomplete endpoint: type-ahead is GET /companies/search with the letters typed so far
 * as `name` and a small `limit`. This operation is that call with the fields a type-ahead needs.
 */
export const companyAutocompleteDescription: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'autocompleteText',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForCompanyAutocomplete },
		description: 'The letters typed so far: a company name or the first part of one',
		routing: { send: { type: 'query', property: 'name' } },
	},
	{
		displayName: 'Country',
		name: 'autocompleteCountry',
		type: 'options',
		options: REGISTRY_COUNTRIES,
		default: 'ES',
		displayOptions: { show: showOnlyForCompanyAutocomplete },
		description: 'Country whose companies are suggested',
		routing: { send: { type: 'query', property: 'country' } },
	},
	{
		displayName: 'Limit',
		name: 'autocompleteLimit',
		type: 'number',
		displayOptions: { show: showOnlyForCompanyAutocomplete },
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 6,
		description: 'Max number of suggestions to return. 5 to 10 suits a type-ahead list.',
		routing: {
			send: { type: 'query', property: 'limit' },
			output: { maxResults: '={{$value}}' },
		},
	},
];
