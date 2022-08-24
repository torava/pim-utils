import CategoryShape from './Category';
import ProductShape from './Product';

export default interface ProductContributionShape {
	id?: number;

	amount?: number;
	unit?: string;

	product?: ProductShape;
	productId?: ProductShape['id'];
	contribution?: CategoryShape;
	contributionId?: CategoryShape['id'];
}
