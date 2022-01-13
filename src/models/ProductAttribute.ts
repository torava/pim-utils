import ProductShape from './Product';
import AttributeShape from './Attribute';
import ProductAttributeSourceShape from './ProductAttributeSource';
import { DeepPartial } from '../utils/types';

export default interface ProductAttributeShape {
	id: number;
	
	value?: number;
	unit?: string;
	type?: string;

	product?: ProductShape;
	productId?: ProductShape['id'];
	attribute?: AttributeShape;
	attributeId?: AttributeShape['id'];
	sources?: ProductAttributeSourceShape[];
}

export type ProductAttributePartialShape = DeepPartial<ProductAttributeShape>;
