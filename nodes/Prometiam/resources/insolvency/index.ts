import type { INodeProperties } from 'n8n-workflow';
import { dataAsItems } from '../../shared/routing';
import { insolvencySearchDescription } from './search';

const showOnlyForInsolvency = {
	resource: ['insolvency'],
};

export const insolvencyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForInsolvency },
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search insolvency notices',
				description:
					'Search corporate insolvency notices (corporate only; nine markets: FR, DE, GB, AT, CH, NO, FI, US, NL)',
				routing: {
					request: { method: 'GET', url: '/insolvency/search' },
					output: dataAsItems,
				},
			},
		],
		default: 'search',
	},
	...insolvencySearchDescription,
];
