export interface ReceiptShape {
	id: number;

	file?: string;
	locale?: string;
	text?: string;

	transaction?: TransactionShape;
}
