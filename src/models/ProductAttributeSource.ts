import ProductAttributeShape from './ProductAttribute';
import SourceShape from './Source';

export default interface ProductAttributeSourceShape {
	id: number;

	referenceUrl?: string;
	referenceDate?: string;
	note?: string;
	countryCode?: string;

	attribute?: ProductAttributeShape;
	attributeId?: ProductAttributeShape['id'];
	source?: SourceShape;
	sourceId?: SourceShape['id'];
}
