import { DeepPartial } from '../utils/types';
import CategoryShape from './Category';

export default interface CategoryContributionShape {
	id: number;

	amount?: number;
	unit?: string;

	category?: CategoryShape;
	categoryId?: CategoryShape['id'];
	contribution?: CategoryShape;
	contributionId?: CategoryShape['id'];
}

export type CategoryContributionPartialShape = DeepPartial<CategoryContributionShape>;
