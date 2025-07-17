<script>
	import { process_csv_files } from '$lib/csv_processor';

	let balance_file = null;
	let payouts_file = null;
	let processing = false;
	let result = null;
	let error = null;
	let summary = null;

	async function handle_file_upload() {
		if (!balance_file || !payouts_file || balance_file.length === 0 || payouts_file.length === 0) {
			error = 'Please select both balance and payouts files';
			return;
		}

		processing = true;
		error = null;
		result = null;
		summary = null;

		try {
			const csv_content = await process_csv_files(balance_file[0], payouts_file[0]);
			result = csv_content;
			
			// Generate summary
			summary = generate_summary(csv_content);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while processing files';
		} finally {
			processing = false;
		}
	}

	function generate_summary(csv_content) {
		const lines = csv_content.split('\n');
		const summary = {
			sales: { count: 0, amount: 0 },
			fees: { count: 0, amount: 0 },
			refunds: { count: 0, amount: 0 },
			transfers: { count: 0, amount: 0 },
			stripe_debits: { count: 0, amount: 0 },
			total_lines: 0
		};

		for (const line of lines) {
			if (!line.trim()) continue;
			
			const values = parse_csv_line(line);
			if (values.length < 3) continue;
			
			const amount = parseFloat(values[1]);
			const description = values[2];
			
			summary.total_lines++;
			
			if (description.startsWith('sale ')) {
				summary.sales.count++;
				summary.sales.amount += amount;
			} else if (description.startsWith('fee ')) {
				summary.fees.count++;
				summary.fees.amount += amount;
			} else if (description.startsWith('refund ')) {
				summary.refunds.count++;
				summary.refunds.amount += amount;
			} else if (description.startsWith('transfer ')) {
				summary.transfers.count++;
				summary.transfers.amount += amount;
			} else if (description.startsWith('stripe direct debit ')) {
				summary.stripe_debits.count++;
				summary.stripe_debits.amount += amount;
			}
		}

		return summary;
	}

	function parse_csv_line(line) {
		const result = [];
		let current = '';
		let in_quotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			
			if (char === '"') {
				in_quotes = !in_quotes;
			} else if (char === ',' && !in_quotes) {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		
		result.push(current);
		return result;
	}

	function download_csv() {
		if (!result) return;

		const blob = new Blob([result], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'freeagent.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Stripe Reconciler</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<div class="bg-white rounded-lg shadow-lg p-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
				Stripe Reconciler
			</h1>
			
			<p class="text-gray-600 mb-8 text-center">
				Upload your Stripe balance and payouts CSV files to generate a FreeAgent-compatible reconciliation file.
			</p>

			<div class="space-y-6">
				<!-- File Upload Section -->
				<div class="grid md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<label for="balance-file" class="block text-sm font-medium text-gray-700">
							Stripe Balance CSV File
						</label>
						<input
							id="balance-file"
							type="file"
							accept=".csv"
							bind:files={balance_file}
							class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>
						<p class="text-xs text-gray-500">
							Select the Stripe balance itemised activity CSV file
						</p>
					</div>

					<div class="space-y-2">
						<label for="payouts-file" class="block text-sm font-medium text-gray-700">
							Stripe Payouts CSV File
						</label>
						<input
							id="payouts-file"
							type="file"
							accept=".csv"
							bind:files={payouts_file}
							class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>
						<p class="text-xs text-gray-500">
							Select the Stripe payouts CSV file
						</p>
					</div>
				</div>

				<!-- Process Button -->
				<div class="flex justify-center">
					<button
						on:click={handle_file_upload}
						disabled={processing || !balance_file || !payouts_file || balance_file.length === 0 || payouts_file.length === 0}
						class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{processing ? 'Processing...' : 'Process Files'}
					</button>
				</div>

				<!-- Error Display -->
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-red-800">{error}</p>
					</div>
				{/if}

				<!-- Result Display -->
				{#if result && summary}
					<div class="bg-green-50 border border-green-200 rounded-lg p-6">
						<h3 class="text-lg font-semibold text-green-800 mb-4">
							Processing Complete!
						</h3>
						
						<!-- Summary Table -->
						<div class="mb-6">
							<h4 class="text-md font-semibold text-green-800 mb-3">Transaction Summary</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full bg-white border border-gray-200 rounded-lg">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
												Item
											</th>
											<th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200">
										<tr>
											<td class="px-4 py-2 text-sm text-gray-900">
												Number of sales ({summary.sales.count})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{summary.sales.amount.toFixed(2)}
											</td>
										</tr>
										<tr>
											<td class="px-4 py-2 text-sm text-gray-900">
												Number of fees ({summary.fees.count})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{summary.fees.amount.toFixed(2)}
											</td>
										</tr>
										<tr>
											<td class="px-4 py-2 text-sm text-gray-900">
												Number of refunds ({summary.refunds.count})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{summary.refunds.amount.toFixed(2)}
											</td>
										</tr>
										<tr class="bg-blue-50 font-semibold">
											<td class="px-4 py-2 text-sm text-gray-900">
												Activity Change (Sales + Fees + Refunds)
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{(summary.sales.amount + summary.fees.amount + summary.refunds.amount).toFixed(2)}
											</td>
										</tr>
										<tr>
											<td class="px-4 py-2 text-sm text-gray-900">
												Number of transfer payouts ({summary.transfers.count})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{summary.transfers.amount.toFixed(2)}
											</td>
										</tr>
										<tr>
											<td class="px-4 py-2 text-sm text-gray-900">
												Number of stripe direct debits ({summary.stripe_debits.count})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{summary.stripe_debits.amount.toFixed(2)}
											</td>
										</tr>
										<tr class="bg-green-50 font-semibold">
											<td class="px-4 py-2 text-sm text-gray-900">
												Total Payouts (Payouts + Debits)
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{(summary.transfers.amount + summary.stripe_debits.amount).toFixed(2)}
											</td>
										</tr>
										<tr class="bg-purple-50 font-semibold">
											<td class="px-4 py-2 text-sm text-gray-900">
												Ending Balance (Activity Change + Total Payouts)
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												£{((summary.sales.amount + summary.fees.amount + summary.refunds.amount) + (summary.transfers.amount + summary.stripe_debits.amount)).toFixed(2)}
											</td>
										</tr>
										<tr class="bg-gray-50 font-semibold">
											<td class="px-4 py-2 text-sm text-gray-900">
												Total number of lines ({summary.total_lines})
											</td>
											<td class="px-4 py-2 text-sm text-right text-gray-900">
												-
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<p class="text-green-700 mb-4">
							Your FreeAgent-compatible CSV has been generated. Click the button below to download it.
						</p>
						<button
							on:click={download_csv}
							class="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
						>
							Download freeagent.csv
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main> 