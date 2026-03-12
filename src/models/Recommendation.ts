/* eslint-disable no-unused-vars */
import AttributeShape from './Attribute';
import RecommendationSourceShape from './RecommendationSource';

enum Sex {
	Male = 'male',
	Female = 'female',
}

enum Type {
	MinimumValue = 'minimum_value',
	MaximumValue = 'maximum_value',
}

export default interface RecommendationShape {
	id: number;
	minValue: number;
	maxValue: number;
  unit: string;
	perUnit: string;
	minimumAge?: number;
	maximumAge?: number;
	sex?: Sex;
	weight?: number;
	pav?: boolean;
	pal?: number;
	note?: string;

	attribute?: AttributeShape;
	attributeId: AttributeShape['id'];
  sources?: RecommendationSourceShape[];
}
