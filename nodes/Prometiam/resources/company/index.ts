import type { INodeProperties } from 'n8n-workflow';
import { dataAsItems } from '../../shared/routing';
import { companyAutocompleteDescription } from './autocomplete';
import { companyGetDescription } from './get';
import { companyLookupDescription } from './lookup';
import { companySearchDescription } from './search';

const showOnlyForCompany = {
	resource: ['company'],
};

export const companyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCompany },
		options: [
			{
				name: 'Autocomplete',
				value: 'autocomplete',
				action: 'Autocomplete company names',
				description: 'Type-ahead suggestions for a partial company name',
				routing: {
					request: { method: 'GET', url: '/companies/search' },
					output: dataAsItems,
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a company',
				description: 'Get the full profile of one company by its ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/companies/{{ encodeURIComponent($parameter.companyId) }}',
					},
					output: dataAsItems,
				},
			},
			{
				name: 'Look Up (Batch)',
				value: 'lookup',
				action: 'Look up companies in a batch',
				description: 'Resolve up to 100 companies in one call; every item counts as one request',
				routing: {
					request: { method: 'POST', url: '/companies/lookup' },
					output: dataAsItems,
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search companies',
				description: 'Find companies by name or registry number',
				routing: {
					request: { method: 'GET', url: '/companies/search' },
					output: dataAsItems,
				},
			},
		],
		default: 'search',
	},
	...companySearchDescription,
	...companyAutocompleteDescription,
	...companyGetDescription,
	...companyLookupDescription,
];
