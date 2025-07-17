// Simple test to verify CSV processing logic
import { readFileSync } from 'fs';

// Mock the File API for Node.js testing
class MockFile {
	constructor(content) {
		this.content = content;
	}
	
	async text() {
		return this.content;
	}
}

// Import the processing function (we'll need to adapt it for Node.js)
async function test_csv_processing() {
	try {
		// Read the sample files
		const balance_csv = readFileSync('./samples/STRIPE_BALANCE_Itemised_balance_change_from_activity_GBP_2024-05-01_to_2025-04-30_Europe-London.csv', 'utf8');
		const payouts_csv = readFileSync('./samples/STRIPE_PAYOUTS_Itemised_payouts_GBP_2024-05-01_to_2025-04-30_Europe-London.csv', 'utf8');
		
		console.log('Sample files loaded successfully');
		console.log('Balance CSV lines:', balance_csv.split('\n').length);
		console.log('Payouts CSV lines:', payouts_csv.split('\n').length);
		
		// Test the CSV parsing logic
		const balance_lines = balance_csv.split('\n');
		const payouts_lines = payouts_csv.split('\n');
		
		console.log('First balance transaction:', balance_lines[1]);
		console.log('First payout transaction:', payouts_lines[1]);
		
	} catch (error) {
		console.error('Error testing CSV processing:', error);
	}
}

test_csv_processing(); 