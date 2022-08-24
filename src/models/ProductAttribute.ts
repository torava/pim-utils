import ProductShape from './Product';
import AttributeShape from './Attribute';
import ProductAttributeSourceShape from './ProductAttributeSource';
export default interface ProductAttributeShape {
	id?: number;
	
	value?: number;
	unit?: string;
	type?: string;

	product?: ProductShape;
	productId?: ProductShape['id'];
	attribute?: AttributeShape;
	attributeId?: AttributeShape['id'];
	sources?: ProductAttributeSourceShape[];
}
