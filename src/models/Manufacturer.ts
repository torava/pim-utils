export interface ManufacturerShape {
	id: number;

	name?: string;
	aliases?: string[];
	factoryLocation?: string[];
	headquartersLocation?: string[];

	parent?: ManufacturerShape;
}
