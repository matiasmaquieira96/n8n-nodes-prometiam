import type { INodeProperties } from 'n8n-workflow';
import { sanctionsScreenDescription } from './screen';

const showOnlyForSanctions = {
	resource: ['sanctions'],
};

export const sanctionsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSanctions },
		options: [
			{
				name: 'Screen',
				value: 'screen',
				action: 'Screen a name against sanctions lists',
				description:
					'Fuzzy-match a person or company name against consolidated sanctions lists',
				routing: {
					request: { method: 'GET', url: '/sanctions/screen' },
				},
			},
		],
		default: 'screen',
	},
	...sanctionsScreenDescription,
];
