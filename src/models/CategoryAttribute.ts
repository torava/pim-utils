import CategoryShape from './Category';
import AttributeShape from './Attribute';
import CategoryAttributeSourceShape from './CategoryAttributeSource';
import { DeepPartial } from '../utils/types';

export default interface CategoryAttributeShape {
	id: number;

	value?: number;
	unit?: string;
	type?: string;

	category?: CategoryShape;
	categoryId?: CategoryShape['id'];
	attribute?: AttributeShape;
	attributeId?: AttributeShape['id'];
	sources?: CategoryAttributeSourceShape[];
}

export type CategoryAttributePartialShape = DeepPartial<CategoryAttributeShape>;
