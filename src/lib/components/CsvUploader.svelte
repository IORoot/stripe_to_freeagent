<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Papa from 'papaparse';

	const dispatch = createEventDispatcher();

	interface CsvRow {
		[key: string]: string;
	}

	let file_input: HTMLInputElement;
	let is_dragging = false;
	let upload_status = '';

	function handle_file_select(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			process_csv_file(file);
		}
	}

	function handle_drag_over(event: DragEvent) {
		event.preventDefault();
		is_dragging = true;
	}

	function handle_drag_leave() {
		is_dragging = false;
	}

	function handle_drop(event: DragEvent) {
		event.preventDefault();
		is_dragging = false;
		
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
				process_csv_file(file);
			} else {
				upload_status = 'Please select a valid CSV file.';
			}
		}
	}

	function process_csv_file(file: File) {
		upload_status = 'Processing CSV file...';
		
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					upload_status = `Error parsing CSV: ${results.errors[0].message}`;
					return;
				}

				const data = results.data as CsvRow[];
				const headers = results.meta.fields || [];
				
				upload_status = `Successfully loaded ${data.length} rows with ${headers.length} columns.`;
				
				dispatch('csv_uploaded', {
					data,
					headers
				});
			},
			error: (error) => {
				upload_status = `Error reading file: ${error.message}`;
			}
		});
	}

	function trigger_file_input() {
		file_input?.click();
	}
</script>

<div class="space-y-4">
	<div 
		class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors {is_dragging ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}"
		on:dragover={handle_drag_over}
		on:dragleave={handle_drag_leave}
		on:drop={handle_drop}
	>
		<div class="space-y-4">
			<div class="text-gray-400">
				<svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
					<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
			<div>
				<button 
					type="button"
					on:click={trigger_file_input}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Choose CSV file
				</button>
				<p class="mt-2 text-sm text-gray-600">or drag and drop</p>
			</div>
			<p class="text-xs text-gray-500">CSV files only</p>
		</div>
	</div>

	<input 
		bind:this={file_input}
		type="file" 
		accept=".csv,text/csv"
		on:change={handle_file_select}
		class="hidden"
	/>

	{#if upload_status}
		<div class="text-sm text-gray-600">
			{upload_status}
		</div>
	{/if}
</div> 