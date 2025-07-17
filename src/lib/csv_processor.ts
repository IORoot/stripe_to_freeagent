interface BalanceTransaction {
	balance_transaction_id: string;
	created: string;
	gross: string;
	fee: string;
	reporting_category: string;
	trace_id: string;
	description: string;
	product_name: string;
}

interface PayoutTransaction {
	payout_id: string;
	effective_at: string;
	gross: string;
	trace_id: string;
}

interface FreeAgentTransaction {
	date: string;
	amount: string;
	description: string;
}

export async function process_csv_files(balance_file: File, payouts_file: File): Promise<string> {
	const balance_text = await balance_file.text();
	const payouts_text = await payouts_file.text();

	const balance_transactions = parse_balance_csv(balance_text);
	const payout_transactions = parse_payouts_csv(payouts_text);

	const freeagent_transactions = transform_to_freeagent_format(balance_transactions, payout_transactions);

	return generate_freeagent_csv(freeagent_transactions);
}

function parse_balance_csv(csv_text: string): BalanceTransaction[] {
	const lines = csv_text.split('\n');
	const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
	const transactions: BalanceTransaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = parse_csv_line(line);
		if (values.length < headers.length) continue;

		const transaction: BalanceTransaction = {
			balance_transaction_id: values[0]?.replace(/"/g, '') || '',
			created: values[2]?.replace(/"/g, '') || '',
			gross: values[6]?.replace(/"/g, '') || '',
			fee: values[7]?.replace(/"/g, '') || '',
			reporting_category: values[9]?.replace(/"/g, '') || '',
			trace_id: values[14]?.replace(/"/g, '') || '',
			description: values[11]?.replace(/"/g, '') || '',
			product_name: values[64]?.replace(/"/g, '') || ''
		};

		transactions.push(transaction);
	}

	return transactions;
}

function parse_payouts_csv(csv_text: string): PayoutTransaction[] {
	const lines = csv_text.split('\n');
	const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
	const transactions: PayoutTransaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = parse_csv_line(line);
		if (values.length < headers.length) continue;

		const transaction: PayoutTransaction = {
			payout_id: values[0]?.replace(/"/g, '') || '',
			effective_at: values[2]?.replace(/"/g, '') || '',
			gross: values[4]?.replace(/"/g, '') || '',
			trace_id: values[17]?.replace(/"/g, '') || ''
		};

		transactions.push(transaction);
	}

	return transactions;
}

function parse_csv_line(line: string): string[] {
	const result: string[] = [];
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

function transform_to_freeagent_format(
	balance_transactions: BalanceTransaction[],
	payout_transactions: PayoutTransaction[]
): FreeAgentTransaction[] {
	const freeagent_transactions: FreeAgentTransaction[] = [];

	// Process balance transactions
	for (const transaction of balance_transactions) {
		const gross_amount = parseFloat(transaction.gross);
		const fee_amount = parseFloat(transaction.fee);
		const created_date = new Date(transaction.created);

		// Format date as DD/MM/YYYY
		const date_str = created_date.toLocaleDateString('en-GB');

		// Add sale transaction (positive amount)
		if (transaction.reporting_category === 'charge') {
			freeagent_transactions.push({
				date: date_str,
				amount: gross_amount.toFixed(2),
				description: `sale | ${transaction.trace_id} | ${transaction.balance_transaction_id} | ${transaction.product_name}`
			});

			// Add fee transaction (negative amount)
			if (fee_amount > 0) {
				freeagent_transactions.push({
					date: date_str,
					amount: (-fee_amount).toFixed(2),
					description: `fee | ${transaction.trace_id} | ${transaction.balance_transaction_id} | ${transaction.product_name}`
				});
			}
		} else if (transaction.reporting_category === 'refund') {
			// Add refund transaction (negative amount - already negative in CSV)
			freeagent_transactions.push({
				date: date_str,
				amount: gross_amount.toFixed(2),
				description: `refund | ${transaction.trace_id} | ${transaction.balance_transaction_id} | ${transaction.product_name}`
			});
		}
	}

	// Process payout transactions
	for (const transaction of payout_transactions) {
		const gross_amount = parseFloat(transaction.gross);
		const effective_date = new Date(transaction.effective_at);
		const date_str = effective_date.toLocaleDateString('en-GB');

		if (gross_amount > 0) {
			// Positive payout becomes negative transfer
			freeagent_transactions.push({
				date: date_str,
				amount: (-gross_amount).toFixed(2),
				description: `transfer to bank account | ${transaction.trace_id} | ${transaction.payout_id}`
			});
		} else {
			// Negative payout becomes positive stripe direct debit
			freeagent_transactions.push({
				date: date_str,
				amount: (-gross_amount).toFixed(2),
				description: `stripe direct debit | ${transaction.trace_id} | ${transaction.payout_id}`
			});
		}
	}

	// Sort by date
	freeagent_transactions.sort((a, b) => {
		const date_a = new Date(a.date.split('/').reverse().join('-'));
		const date_b = new Date(b.date.split('/').reverse().join('-'));
		return date_a.getTime() - date_b.getTime();
	});

	return freeagent_transactions;
}

function generate_freeagent_csv(transactions: FreeAgentTransaction[]): string {
	const lines = transactions.map(t => `${t.date},${t.amount},${t.description}`);
	return lines.join('\n');
} 