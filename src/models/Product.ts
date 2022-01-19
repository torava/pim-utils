import ItemShape from './Item';
import ProductAttributeShape from './ProductAttribute';
import CategoryShape from './Category';
import ManufacturerShape from './Manufacturer';
import ProductContributionShape from './ProductContribution';
import BrandShape from './Brand';
import { DeepPartial } from '../utils/types';

export default interface ProductShape {
	id: number;
	name: string;

	contributionList?: string;
	aliases?: string[];
	productNumber?: string;
	quantity?: number;
	measure?: number;
	unit?: string;

	items?: ItemShape[];
	attributes?: ProductAttributeShape[];
	category?: CategoryShape;
	categoryId?: CategoryShape['id'];
	manufacturer?: ManufacturerShape;
	manufacturerId?: ManufacturerShape['id'];
	brand?: BrandShape;
	brandId?: BrandShape['id'];
	contributions?: ProductContributionShape[];
}

export type ProductPartialShape = DeepPartial<ProductShape>;
