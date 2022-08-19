export default interface ConversionShape {
	id?: number;

	fromLocale?: string;
	fromCurrency?: string;
	toLocale?: string;
	toCurrency?: string;
	rate?: number;
}
