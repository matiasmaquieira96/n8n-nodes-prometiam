import type { INodeProperties } from 'n8n-workflow';
import { dataAsItems } from '../../shared/routing';
import { validationLeiDescription } from './lei';
import { validationVatDescription } from './vat';

const showOnlyForValidation = {
	resource: ['validation'],
};

export const validationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForValidation },
		options: [
			{
				name: 'Look Up LEI',
				value: 'lei',
				action: 'Look up a LEI',
				description:
					'Look up a Legal Entity Identifier: name, jurisdiction, status, addresses and renewal date',
				routing: {
					request: { method: 'GET', url: '=/lei/{{ encodeURIComponent($parameter.lei) }}' },
					output: dataAsItems,
				},
			},
			{
				name: 'Validate VAT Number',
				value: 'vat',
				action: 'Validate a VAT number',
				description: 'Check an EU VAT number and return the registered trader when it is valid',
				routing: {
					request: { method: 'GET', url: '=/vat/{{ encodeURIComponent($parameter.vatNumber) }}' },
					output: dataAsItems,
				},
			},
		],
		default: 'vat',
	},
	...validationVatDescription,
	...validationLeiDescription,
];
