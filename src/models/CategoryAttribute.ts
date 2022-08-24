import CategoryShape from './Category';
import AttributeShape from './Attribute';
import CategoryAttributeSourceShape from './CategoryAttributeSource';

export default interface CategoryAttributeShape {
	id?: number;

	value?: number;
	unit?: string;
	type?: string;

	category?: CategoryShape;
	categoryId?: CategoryShape['id'];
	attribute?: AttributeShape;
	attributeId?: AttributeShape['id'];
	sources?: CategoryAttributeSourceShape[];
}
