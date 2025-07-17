<script lang="ts">
	interface CsvRow {
		[key: string]: string;
	}

	export let filtered_data: CsvRow[] = [];
	export let csv_headers: string[] = [];

	let current_page = 1;
	const rows_per_page = 10;

	$: total_pages = Math.ceil(filtered_data.length / rows_per_page);
	$: start_index = (current_page - 1) * rows_per_page;
	$: end_index = start_index + rows_per_page;
	$: current_data = filtered_data.slice(start_index, end_index);

	function go_to_page(page: number) {
		if (page >= 1 && page <= total_pages) {
			current_page = page;
		}
	}

	function format_cell_value(value: string): string {
		if (!value) return '-';
		return value.length > 50 ? value.substring(0, 50) + '...' : value;
	}
</script>

{#if filtered_data.length === 0}
	<div class="text-center py-8">
		<div class="text-gray-400 mb-4">
			<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
		</div>
		<p class="text-gray-500">No data to display. Upload a CSV file and add regex patterns to see filtered results.</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						{#each csv_headers as header}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{header}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each current_data as row, row_index}
						<tr class="hover:bg-gray-50">
							{#each csv_headers as header}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{format_cell_value(row[header] || '')}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if total_pages > 1}
			<div class="flex items-center justify-between">
				<div class="text-sm text-gray-700">
					Showing {start_index + 1} to {Math.min(end_index, filtered_data.length)} of {filtered_data.length} results
				</div>
				<div class="flex space-x-2">
					<button
						on:click={() => go_to_page(current_page - 1)}
						disabled={current_page === 1}
						class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
					>
						Previous
					</button>
					
					{#each Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
						const page = i + 1;
						return page;
					}) as page}
						<button
							on:click={() => go_to_page(page)}
							class="px-3 py-1 text-sm border rounded-md {current_page === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}"
						>
							{page}
						</button>
					{/each}
					
					<button
						on:click={() => go_to_page(current_page + 1)}
						disabled={current_page === total_pages}
						class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
					>
						Next
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if} 