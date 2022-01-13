import { NameTranslations } from '../utils/types';

export interface AttributeShape {
	id: number;
	
	code?: string;
	name: NameTranslations;
	
	children?: AttributeShape[];
	parent?: AttributeShape;
	parentId?: AttributeShape['id'];
}
