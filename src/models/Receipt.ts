import TransactionShape from './Transaction';

export default interface ReceiptShape {
	id: number;

	file?: string;
	locale?: string;
	text?: string;

	transaction?: TransactionShape;
	transactionId?: TransactionShape['id'];
}
