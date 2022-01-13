import { TransactionShape } from './Transaction';

export interface GroupShape {
	name: string;
	transactions?: TransactionShape;
}
