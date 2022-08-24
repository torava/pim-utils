import TransactionShape from './Transaction';

export default interface GroupShape {
	name?: string;
	transactions?: TransactionShape;
}
