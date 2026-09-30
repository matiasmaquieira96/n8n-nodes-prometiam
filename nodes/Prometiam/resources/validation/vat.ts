import type { INodeProperties } from 'n8n-workflow';

const showOnlyForValidationVat = {
	resource: ['validation'],
	operation: ['vat'],
};

export const validationVatDescription: INodeProperties[] = [
	{
		displayName: 'VAT Number',
		name: 'vatNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. DE811569869',
		displayOptions: { show: showOnlyForValidationVat },
		description:
			'Full VAT number including the 2-letter country prefix. Spaces and punctuation are ignored. Greek numbers use EL; GB VAT numbers are out of scope.',
	},
];
