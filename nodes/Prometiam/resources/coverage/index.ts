import type { INodeProperties } from 'n8n-workflow';
import { dataAsItems } from '../../shared/routing';

const showOnlyForCoverage = {
	resource: ['coverage'],
};

export const coverageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCoverage },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get coverage',
				description: 'List the countries the API serves and how often each is refreshed',
				routing: {
					request: { method: 'GET', url: '/coverage' },
					output: dataAsItems,
				},
			},
		],
		default: 'get',
	},
];
