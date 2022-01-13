export interface BrandShape {
	id: number;

	name?: string;
	aliases?: string[];
	factoryLocation?: string;
	headquartersLocation?: string;

	parent?: BrandShape;
}
