import type { INodeProperties } from 'n8n-workflow';

const showOnlyForValidationLei = {
	resource: ['validation'],
	operation: ['lei'],
};

export const validationLeiDescription: INodeProperties[] = [
	{
		displayName: 'LEI',
		name: 'lei',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. HWUPKR0MPOU8FGXBT394',
		displayOptions: { show: showOnlyForValidationLei },
		description: '20-character Legal Entity Identifier',
	},
];
