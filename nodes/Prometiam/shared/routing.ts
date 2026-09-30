import type { INodeProperties } from 'n8n-workflow';

type Routing = NonNullable<INodeProperties['routing']>;

/**
 * Return All for the endpoints that page with `pagination.next_cursor`: keep asking with the cursor from the
 * previous answer until `pagination.has_more` is false. The paging request replaces the query string of the next
 * call as a whole, so the expression copies the current one (`$request.qs`, which holds the user's filters) and
 * changes only the cursor. 100 is the largest page the API gives.
 */
export const cursorPagination: Routing = {
	send: { paginate: '={{ $value }}' },
	operations: {
		pagination: {
			type: 'generic',
			properties: {
				continue: '={{ !!$response.body?.pagination?.has_more }}',
				request: {
					qs: '={{ Object.assign({}, $request.qs, { limit: 100, cursor: $response.body?.pagination?.next_cursor }) }}' as unknown as Record<
						string,
						string
					>,
				},
			},
		},
	},
};

/** Send one query parameter, leaving it out when the value is empty. */
export function queryString(property: string): Routing {
	return {
		send: { type: 'query', property, value: '={{ $value || undefined }}' },
	};
}

/** One item per element of the response's `data` array (or the one object it holds). */
export const dataAsItems: NonNullable<Routing['output']> = {
	postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }],
};
