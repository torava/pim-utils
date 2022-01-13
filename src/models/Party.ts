import TransactionShape from "./Transaction";

export default interface PartyShape {
	id: number;

	name?: string;
	vat?: string;
	streetName?: string;
	streetNumber?: string;
	postalCode?: string;
	city?: string;
	phoneNumber?: string;
	email?: string;

	transaction?: TransactionShape;
}
