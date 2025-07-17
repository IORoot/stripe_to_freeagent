<script lang="ts">
	import { onMount } from 'svelte';
	import Papa from 'papaparse';
	import CsvUploader from '$lib/components/CsvUploader.svelte';
	import RegexPatternManager from '$lib/components/RegexPatternManager.svelte';
	import CsvPreview from '$lib/components/CsvPreview.svelte';
	import CsvExporter from '$lib/components/CsvExporter.svelte';

	interface CsvRow {
		[key: string]: string;
	}

	interface RegexPattern {
		id: string;
		pattern: string;
		description: string;
		enabled: boolean;
	}

	let csv_data: CsvRow[] = [];
	let csv_headers: string[] = [];
	let filtered_data: CsvRow[] = [];
	let regex_patterns: RegexPattern[] = [];
	let selected_column = '';

	// Load sample data on mount
	onMount(() => {
		// Add some default regex patterns
		regex_patterns = [
			{
				id: '1',
				pattern: 'STRIPE',
				description: 'Match Stripe transactions',
				enabled: true
			},
			{
				id: '2',
				pattern: 'Sale',
				description: 'Match sales transactions',
				enabled: true
			},
			{
				id: '3',
				pattern: 'Fee',
				description: 'Match fee transactions',
				enabled: true
			}
		];
	});

	function handle_csv_upload(data: CsvRow[], headers: string[]) {
		csv_data = data;
		csv_headers = headers;
		selected_column = headers[0] || '';
		apply_regex_filters();
	}

	function handle_patterns_update(patterns: RegexPattern[]) {
		regex_patterns = patterns;
		apply_regex_filters();
	}

	function apply_regex_filters() {
		if (!csv_data.length || !selected_column) {
			filtered_data = [];
			return;
		}

		const enabled_patterns = regex_patterns.filter(p => p.enabled);
		if (!enabled_patterns.length) {
			filtered_data = csv_data;
			return;
		}

		filtered_data = csv_data.filter(row => {
			const cell_value = row[selected_column] || '';
			return enabled_patterns.some(pattern => {
				try {
					const regex = new RegExp(pattern.pattern, 'i');
					return regex.test(cell_value);
				} catch (error) {
					console.error(`Invalid regex pattern: ${pattern.pattern}`);
					return false;
				}
			});
		});
	}

	function handle_column_change(event: Event) {
		const target = event.target as HTMLSelectElement;
		selected_column = target.value;
		apply_regex_filters();
	}
</script>

<svelte:head>
	<title>CSV Regex Reconciler</title>
	<meta name="description" content="AI-powered CSV processing with regex pattern matching for bookkeeping automation" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<header class="text-center mb-8">
		<h1 class="text-4xl font-bold text-gray-900 mb-2">CSV Regex Reconciler</h1>
		<p class="text-lg text-gray-600">AI-powered CSV processing with regex pattern matching for bookkeeping automation</p>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Left Column: Upload and Patterns -->
		<div class="space-y-6">
			<!-- CSV Upload -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>
				<CsvUploader on:csv_uploaded={({ detail }) => handle_csv_upload(detail.data, detail.headers)} />
			</div>

			<!-- Regex Patterns -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Regex Patterns</h2>
				<RegexPatternManager 
					{regex_patterns}
					on:patterns_updated={({ detail }) => handle_patterns_update(detail)}
				/>
			</div>

			<!-- Column Selection -->
			{#if csv_headers.length > 0}
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Select Column</h2>
					<select 
						bind:value={selected_column}
						on:change={handle_column_change}
						class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each csv_headers as header}
							<option value={header}>{header}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- Right Column: Preview and Export -->
		<div class="space-y-6">
			<!-- CSV Preview -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">
					Filtered Results 
					{#if filtered_data.length > 0}
						<span class="text-sm font-normal text-gray-500">({filtered_data.length} rows)</span>
					{/if}
				</h2>
				<CsvPreview {filtered_data} {csv_headers} />
			</div>

			<!-- Export -->
			{#if filtered_data.length > 0}
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Export</h2>
					<CsvExporter {filtered_data} {csv_headers} />
				</div>
			{/if}
		</div>
	</div>
</div> 