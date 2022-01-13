import { DeepPartial } from "../utils/types";
import { CategoryAttributeShape } from "./CategoryAttribute";
import { SourceShape } from "./Source";

export interface CategoryAttributeSourceShape {
	id: number;

	referenceUrl?: string;
	referenceDate?: string;
	note?: string;
	countryCode?: string;

	attribute?: CategoryAttributeShape;
	source?: SourceShape;
}

export type CategoryAttributeSourcePartialShape = DeepPartial<CategoryAttributeSourceShape>;
