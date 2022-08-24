import AttributeShape from "./Attribute";
import CategoryAttributeShape from "./CategoryAttribute";
import SourceShape from "./Source";

export default interface CategoryAttributeSourceShape {
	id?: number;

	referenceUrl?: string;
	referenceDate?: string;
	note?: string;
	countryCode?: string;

	attribute?: CategoryAttributeShape;
	attributeId?: AttributeShape['id'];
	source?: SourceShape;
	sourceId?: SourceShape['id'];
}
