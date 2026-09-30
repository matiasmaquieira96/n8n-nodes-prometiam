import type { INodeProperties } from 'n8n-workflow';

/**
 * n8n's declarative engine reads `requestOptions` by that exact name: `batching` spaces out the requests of a run
 * with many input items (it sends one request per item, all at once, unless told otherwise), `timeout` bounds one
 * request. There is deliberately no "ignore SSL issues" option: this node sends an API key, and it only ever talks
 * to one fixed host.
 */
export const requestOptions: INodeProperties = {
	displayName: 'Options',
	name: 'requestOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	options: [
		{
			displayName: 'Batching',
			name: 'batching',
			placeholder: 'Add Batching',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: false,
			},
			default: {
				batch: {},
			},
			options: [
				{
					displayName: 'Batching',
					name: 'batch',
					values: [
						{
							displayName: 'Items per Batch',
							name: 'batchSize',
							type: 'number',
							typeOptions: {
								minValue: -1,
							},
							default: 10,
							description:
								'Input will be split in batches to throttle requests. -1 for disabled. 0 will be treated as 1.',
						},
						{
							displayName: 'Batch Interval (Ms)',
							name: 'batchInterval',
							type: 'number',
							typeOptions: {
								minValue: 0,
							},
							default: 60000,
							description:
								'Time (in milliseconds) between each batch of requests. 0 for disabled. The free plan allows 10 requests a minute.',
						},
					],
				},
			],
		},
		{
			displayName: 'Timeout',
			name: 'timeout',
			type: 'number',
			typeOptions: {
				minValue: 1,
			},
			default: 30000,
			description:
				'Time in milliseconds to wait for the server to send a response before aborting the request',
		},
	],
};
