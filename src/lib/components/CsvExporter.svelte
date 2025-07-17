<script lang="ts">
	import Papa from 'papaparse';

	interface CsvRow {
		[key: string]: string;
	}

	export let filtered_data: CsvRow[] = [];
	export let csv_headers: string[] = [];

	let export_filename = 'filtered_data.csv';

	function download_csv() {
		if (filtered_data.length === 0) return;

		// Convert data to CSV format
		const csv_string = Papa.unparse({
			fields: csv_headers,
			data: filtered_data
		});

		// Create blob and download
		const blob = new Blob([csv_string], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', export_filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	function download_freeagent_format() {
		if (filtered_data.length === 0) return;

		// Convert to FreeAgent format: Date, Amount, Description
		const freeagent_data = filtered_data.map(row => {
			// Try to find date column
			const date_column = csv_headers.find(header => 
				header.toLowerCase().includes('date') || 
				header.toLowerCase().includes('transaction date')
			);
			
			// Try to find amount column
			const amount_column = csv_headers.find(header => 
				header.toLowerCase().includes('amount') || 
				header.toLowerCase().includes('credit') ||
				header.toLowerCase().includes('debit')
			);
			
			// Try to find description column
			const description_column = csv_headers.find(header => 
				header.toLowerCase().includes('description') || 
				header.toLowerCase().includes('transaction description')
			);

			const date = date_column ? row[date_column] : '';
			const amount = amount_column ? row[amount_column] : '';
			const description = description_column ? row[description_column] : '';

			return {
				Date: date,
				Amount: amount,
				Description: description
			};
		});

		const csv_string = Papa.unparse({
			fields: ['Date', 'Amount', 'Description'],
			data: freeagent_data
		});

		const blob = new Blob([csv_string], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', 'freeagent_export.csv');
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center space-x-4">
		<input
			type="text"
			bind:value={export_filename}
			class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			placeholder="Export filename"
		/>
		<button
			on:click={download_csv}
			class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
		>
			Download CSV
		</button>
	</div>

	<div class="border-t pt-4">
		<h4 class="text-sm font-medium text-gray-900 mb-2">FreeAgent Export</h4>
		<p class="text-xs text-gray-600 mb-3">
			Export in FreeAgent-compatible format with Date, Amount, and Description columns.
		</p>
		<button
			on:click={download_freeagent_format}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
		>
			Download FreeAgent CSV
		</button>
	</div>

	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
		<h4 class="text-sm font-medium text-yellow-900 mb-1">Export Info:</h4>
		<ul class="text-xs text-yellow-800 space-y-1">
			<li>• Standard CSV: Exports all columns as-is</li>
			<li>• FreeAgent CSV: Exports in DD/MM/YYYY, Amount, Description format</li>
			<li>• Amounts should be negative for deductions, positive for additions</li>
			<li>• File will be automatically downloaded to your default downloads folder</li>
		</ul>
	</div>
</div> 