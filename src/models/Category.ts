import ProductShape from './Product';
import CategoryAttributeShape from './CategoryAttribute';
import CategoryContributionShape from './CategoryContribution';
import { DeepPartial, NameTranslations } from '../utils/types';

// https://dev.to/tylerlwsmith/using-a-typescript-interface-to-define-model-properties-in-objection-js-1231
export default interface CategoryShape {
	id?: number;
	
	name?: NameTranslations;
	aliases?: string[];

	products?: ProductShape[];
	attributes?: CategoryAttributeShape[];
	contributions?: CategoryContributionShape[];
	children?: CategoryShape[];
	parent?: CategoryShape;
	parentId?: number;
}

export type CategoryPartialShape = DeepPartial<CategoryShape>;
