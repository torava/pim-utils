import { TransactionShape } from './Transaction';
import { ProductShape } from './Product';

export interface ItemShape {
	id: number;

	itemNumber?: string;
	text?: string;
	price?: number;
	currency?: string;
	quantity?: number;
	measure?: number;
	unit?: string;

	transaction?: TransactionShape;
	product?: ProductShape;
}
