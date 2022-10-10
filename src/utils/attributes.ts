import Attribute from "../models/Attribute";
import AttributeShape from "../models/Attribute";
import CategoryAttributeShape from "../models/CategoryAttribute";
import ProductAttributeShape from "../models/ProductAttribute";
import { convertMeasure, getLeafIds } from "./entities";

export const getAttributeValues = (
  unit: CategoryAttributeShape['unit'],
  measure: number,
  quantity = 1,
  price: number = undefined,
  attributeValues: ProductAttributeShape[] | CategoryAttributeShape[] = [],
  attributes: AttributeShape[] = []
) => {
  const result: [number, CategoryAttributeShape][] = [];
  for (const categoryAttribute of attributeValues) {
    const foundAttributes = attributes.filter(a => a.id === categoryAttribute.attributeId);
    foundAttributes.forEach(() => {
      const perUnit = categoryAttribute?.unit?.split('/')?.[1];
      
      let value;

      const rate = 1;

      if (perUnit === 'EUR' && !isNaN(price)) {
        value = rate*categoryAttribute.value;
      } else if (perUnit && perUnit.match(/l|g$/i)) {
        value = rate*categoryAttribute?.value*convertMeasure(measure, unit, perUnit)*quantity;
      } else if (!unit || !perUnit) {
        value = rate*categoryAttribute?.value*quantity;
      }
      if (!isNaN(value)) {
        result.push([value, categoryAttribute]);
      }
    });
  }
  return result;
};

export const getMinAttributeValue = (attributeResult: [number, CategoryAttributeShape][]): [number?, CategoryAttributeShape?] => (
  attributeResult.reduce((a, b) => a[0] < b[0] ? a : b) || [undefined, undefined]
);
export const getMaxAttributeValue = (attributeResult: [number, CategoryAttributeShape][]): [number?, CategoryAttributeShape?] => (
  attributeResult.reduce((a, b) => a[0] > b[0] ? a : b) || [undefined, undefined]
);

export const getAttributeIdsFromCodes = (attributeCodes?: string, attributes: AttributeShape[] = []) => {
  let attributeIds: number[] = [];
  attributeCodes?.split(',').forEach(code => {
    const id = attributes.find(attribute => attribute.code === code)?.id;
    if (id) {
      const ids: Attribute['id'][] = [];
      getLeafIds(attributes, id, ids);
      if (ids.length) {
        attributeIds = attributeIds.concat(ids);
      } else {
        attributeIds.push(id);
      }
    }
  });
  return attributeIds;
};

export const getFoodUnitAttributeByCode = (code?: string, attributes: AttributeShape[] = []) => {
  if (code) {
    const foodUnitParentAttribute = attributes.find(a => a.name['en-US'] === 'Food units');
    return attributes.find(attribute => (
      attribute.code === code && attribute.parentId === foodUnitParentAttribute.id
    ));
  }
};
