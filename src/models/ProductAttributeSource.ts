import { ProductAttributeShape } from './ProductAttribute';
import { SourceShape } from './Source';

export interface ProductAttributeSourceShape {
	id: number;

	referenceUrl?: string;
	referenceDate?: string;
	note?: string;
	countryCode?: string;

	attribute?: ProductAttributeShape;
	source?: SourceShape;
}
