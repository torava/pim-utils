import { DeepPartial } from '../utils/types';

export interface SourceShape {
	id: number;
	
	name?: string;
	authors?: string;
	publicationUrl?: string;
	publicationDate?: string;
	countryCode?: string;
}

export type SourcePartialShape = DeepPartial<SourceShape>;
