import AttributeShape from "../models/Attribute";
import RecommendationShape from "../models/Recommendation";
import { convertMeasure } from "./entities";

/**
 * Food component energy density, MJ/g
 */
const componentEnergyMap = {
  fat: 0.037,
  protein: 0.017,
  carbohydrate: 0.017,
  sugar: 0.017,
  fibre: 0.008,
};

const FOOD_UNITS_ID = 6;

// price;7;;10.1;euro;;;;;;;;male or female under 45 years living alone average
export const PRICE_RECOMMENDATION = 10.1;

export const getAttributeValue = (
  cellValue: number,
  energy: number,
  mass: number,
  recommendation: RecommendationShape,
  attribute: AttributeShape
) => {
  let value;
  if (recommendation.unit === 'percent' && recommendation.perUnit === 'energy') {
    const componentEnergy = Object.entries(componentEnergyMap).find(([component]) =>
      attribute.name['en-US'].toLocaleLowerCase().includes(component)
    )?.[1];
    value = ((cellValue * componentEnergy) / (energy / 1000)) * 100;
  } else if (recommendation.unit === 'g' && recommendation.perUnit === 'MJ') {
    value = cellValue / (energy / 1000);
  } else if (recommendation.perUnit === 'kg') {
    value = cellValue / (mass / 1000);
  } else if (recommendation.unit === 'MJ') {
    value = cellValue / 1000;
  }
  return value;
};

export const getDailyAttributeValue = (
  cellValue: number,
  energy: number,
  mass: number,
  recommendation: RecommendationShape,
  attribute: AttributeShape
) => {
  const value = getAttributeValue(cellValue, energy, mass, recommendation, attribute) || cellValue;
  console.log('daily value', value, cellValue, energy, mass, recommendation, attribute);
  return value;
};

export const getMealAttributeValue = (
  cellValue: number,
  energy: number,
  energyRecommendation: RecommendationShape,
  mass: number,
  recommendation: RecommendationShape,
  attribute: AttributeShape
) => {
  let value =
    getAttributeValue(cellValue, energy, mass, recommendation, attribute) ||
    (cellValue * energy) / convertMeasure(energyRecommendation.minValue, energyRecommendation.unit, 'kJ');
  return value;
};

export const compareAttributeToRecommendation = (value: number, recommendation: RecommendationShape) =>
  (!recommendation.minValue || value > recommendation.minValue) &&
  (!recommendation.maxValue || value < recommendation.maxValue);

export const compareMealPriceToRecommendation = (
  value: number,
  energy: number,
  energyRecommendation?: RecommendationShape
) =>
  value <
  (PRICE_RECOMMENDATION * energy) / convertMeasure(energyRecommendation?.minValue, energyRecommendation?.unit, 'kJ');

export const getRecommendation = (attribute?: AttributeShape, recommendations?: RecommendationShape[], sex?: string) => {
  if (attribute && sex && recommendations) {
    const attributeRecommendations = recommendations.filter(
      (recommendation) => recommendation.attributeId === attribute.id
    );
    const hasSex = attributeRecommendations.some((recommendation) => recommendation.sex);
    return hasSex
      ? attributeRecommendations.find((recommendation) => recommendation.sex === sex)
      : attributeRecommendations[0];
  }
  return;
};

export const getAttribute = (
  cellValue: string,
  attributes: AttributeShape[],
  recommendations: RecommendationShape[],
  sex?: string
) =>
  cellValue &&
  attributes
    .filter((attribute) => attribute.parentId !== FOOD_UNITS_ID)
    .find(
      (attribute) =>
        Object.entries(attribute.name).find(
          ([, value]) =>
            cellValue.match(/^((min|max)\.\s)?(.*)\s\((.*)\)(\s\[(.*)\])?$/i)?.[3].toLocaleLowerCase() ===
            value.toLocaleLowerCase()
        ) && getRecommendation(attribute, recommendations, sex)
    );
