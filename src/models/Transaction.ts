import PartyShape from './Party';
import ReceiptShape from './Receipt';
import ItemShape from './Item';
import GroupShape from './Group';

export default interface TransactionShape {
	id: number;

	totalPrice?: number;
	totalPriceRead?: number;
	date?: string;

	party?: PartyShape;
	group?: GroupShape;
	receipts?: ReceiptShape[];
	items?: ItemShape[];
}
