import RecommendationShape from './Recommendation';
import SourceShape from './Source';

export default interface RecommendationSourceShape {
	id?: number;

	referenceUrl?: string;
	referenceDate?: string;
	note?: string;
	countryCode?: string;

	recommendation?: RecommendationShape;
	recommendationId?: RecommendationShape['id'];
	source?: SourceShape;
	sourceId?: SourceShape['id'];
}
