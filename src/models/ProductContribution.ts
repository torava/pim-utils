import { DeepPartial } from '../utils/types';
import { CategoryShape } from './Category';
import { ProductShape } from './Product';

export interface ProductContributionShape {
	id: number;

	amount?: number;
	unit?: string;

	product?: ProductShape;
	productId?: ProductShape['id'];
	contribution?: CategoryShape;
	contributionId?: CategoryShape['id'];
}

export type ProductContributionPartialShape = DeepPartial<ProductContributionShape>;
