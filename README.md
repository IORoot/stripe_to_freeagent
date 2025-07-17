# Stripe Reconciler

A SvelteKit SaaS application that processes Stripe CSV files and generates FreeAgent-compatible reconciliation data.

## Features

- Upload Stripe balance and payouts CSV files
- Process and transform data according to FreeAgent requirements
- Generate a downloadable CSV file with three columns: date, amount, and description
- Modern, responsive UI built with Tailwind CSS

## Data Processing Rules

### Stripe Balance File Processing
- **Sales**: Creates a positive line for each sale gross amount
- **Fees**: Creates a negative line for each fee amount
- **Refunds**: Creates a negative line for refund amounts
- **Description Format**: `{category} {trace_id} {balance_transaction_id}`

### Stripe Payouts File Processing
- **Positive Payouts**: Converts to negative "transfer" amounts
- **Negative Payouts**: Converts to positive "stripe debit" amounts
- **Description Format**: `{category} {trace_id} {payout_id}`

### Output Format
The generated CSV file contains exactly three columns:
1. **Date**: DD/MM/YYYY format
2. **Amount**: Positive for additions, negative for deductions
3. **Description**: Complete transaction description

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Getting Reports from Stripe

Before using this tool, you need to download the required CSV reports from your Stripe dashboard:

1. **Go to Reports > Balance Summary**
2. **Change dates to your financial year** (e.g., 2024-05-01 to 2025-04-30)
3. **Download the full (all columns) "Balance change from Activity" Report**
4. **Download the full (all columns) "Payouts" Report**

## Usage

1. Upload your Stripe balance CSV file (itemised activity)
2. Upload your Stripe payouts CSV file
3. Click "Process Files" to generate the FreeAgent-compatible CSV
4. Download the generated `freeagent.csv` file

## Sample Files

The `samples/` directory contains example CSV files for testing:
- `STRIPE_BALANCE_Itemised_balance_change_from_activity_GBP_2024-05-01_to_2025-04-30_Europe-London.csv`
- `STRIPE_PAYOUTS_Itemised_payouts_GBP_2024-05-01_to_2025-04-30_Europe-London.csv`

## Technical Details

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **File Processing**: Client-side CSV parsing and transformation

## CSV Format Requirements

### Input Files
- **Balance File**: Must contain columns for balance_transaction_id, created, gross, fee, reporting_category, trace_id, and description
- **Payouts File**: Must contain columns for payout_id, effective_at, gross, and trace_id

### Output File
- No header row
- Three columns: date, amount, description
- Chronologically sorted by date
- FreeAgent-compatible format

## Development

To run the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Testing

The `samples/` directory contains example CSV files for testing the application functionality. 