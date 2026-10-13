import type { INodePropertyOptions } from 'n8n-workflow';

/** The twenty-eight company-registry countries (Europe, North and South America, Asia-Pacific and Israel), in alphabetical order. */
export const REGISTRY_COUNTRIES: INodePropertyOptions[] = [
	{ name: 'Australia', value: 'AU' },
	{ name: 'Belgium', value: 'BE' },
	{ name: 'Brazil', value: 'BR' },
	{ name: 'Canada', value: 'CA' },
	{ name: 'Colombia', value: 'CO' },
	{ name: 'Croatia', value: 'HR' },
	{ name: 'Cyprus', value: 'CY' },
	{ name: 'Czech Republic', value: 'CZ' },
	{ name: 'Denmark', value: 'DK' },
	{ name: 'Estonia', value: 'EE' },
	{ name: 'Finland', value: 'FI' },
	{ name: 'France', value: 'FR' },
	{ name: 'Ireland', value: 'IE' },
	{ name: 'Israel', value: 'IL' },
	{ name: 'Japan', value: 'JP' },
	{ name: 'Latvia', value: 'LV' },
	{ name: 'Lithuania', value: 'LT' },
	{ name: 'Norway', value: 'NO' },
	{ name: 'Poland', value: 'PL' },
	{ name: 'Romania', value: 'RO' },
	{ name: 'Singapore', value: 'SG' },
	{ name: 'Slovakia', value: 'SK' },
	{ name: 'Spain', value: 'ES' },
	{ name: 'Sweden', value: 'SE' },
	{ name: 'Switzerland', value: 'CH' },
	{ name: 'Taiwan', value: 'TW' },
	{ name: 'United Kingdom', value: 'GB' },
	{ name: 'United States', value: 'US' },
];

/**
 * The twelve insolvency markets. They are not the same set as the company registries: Germany, Austria,
 * Switzerland and the Netherlands have notices but no company registry.
 */
export const INSOLVENCY_COUNTRIES: INodePropertyOptions[] = [
	{ name: 'Austria', value: 'AT' },
	{ name: 'Croatia', value: 'HR' },
	{ name: 'Denmark', value: 'DK' },
	{ name: 'Finland', value: 'FI' },
	{ name: 'France', value: 'FR' },
	{ name: 'Germany', value: 'DE' },
	{ name: 'Netherlands', value: 'NL' },
	{ name: 'Norway', value: 'NO' },
	{ name: 'Sweden', value: 'SE' },
	{ name: 'Switzerland', value: 'CH' },
	{ name: 'United Kingdom', value: 'GB' },
	{ name: 'United States', value: 'US' },
];

/** Cross-country company status, as the API filters on it. */
export const CANONICAL_STATUSES: INodePropertyOptions[] = [
	{ name: 'Active', value: 'active' },
	{ name: 'Active, Strike-Off Pending', value: 'active_strike_off_pending' },
	{ name: 'Deregistered', value: 'deregistered' },
	{ name: 'In Administration', value: 'in_administration' },
	{ name: 'In Compulsory Liquidation', value: 'in_compulsory_liquidation' },
	{ name: 'In Dissolution', value: 'in_dissolution' },
	{ name: 'In Liquidation', value: 'in_liquidation' },
	{ name: 'In Liquidation (Insolvent)', value: 'in_liquidation_insolvent' },
	{ name: 'In Receivership', value: 'in_receivership' },
	{ name: 'In Restructuring', value: 'in_restructuring' },
	{ name: 'Insolvent', value: 'insolvent' },
	{ name: 'Merged', value: 'merged' },
	{ name: 'Not Yet Active', value: 'not_yet_active' },
	{ name: 'Suspended', value: 'suspended' },
	{ name: 'Withheld', value: 'withheld' },
];
