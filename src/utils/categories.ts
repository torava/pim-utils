import moment from 'moment';

import AttributeShape from '../models/Attribute';
import CategoryShape from '../models/Category';
import ManufacturerShape from '../models/Manufacturer';
import { convertMeasure } from './entities';
import { getTranslation } from '../utils/entities';
import { stripName, stripDetails, getDetails } from './transactions';
import { LevenshteinDistance } from './levenshteinDistance';
import { measureRegExp } from './receipts';
import CategoryAttributeShape from '../models/CategoryAttribute';
import { Locale, NameTranslations, ObjectEntries, Token } from './types';
import CategoryContributionShape from '../models/CategoryContribution';
import { getAttributeValues, getMaxAttributeValue, getMinAttributeValue } from './attributes';
import ProductShape from '../models/Product';
import ItemShape from '../models/Item';

export const getAverageRate = (filter: {start_date: string, end_date: string}, averageRange: number) => {
  const {start_date, end_date} = filter;
  const rate = averageRange ? averageRange/moment.duration(moment(end_date).diff(moment(start_date))).asDays() : 1;
  //console.log(rate, this.state, moment(start_date));
  return rate;
};

export const aggregateCategoryPrice = (resolvedCategories: (CategoryShape & {
  price_sum: number,
  weight_sum: number,
  volume_sum: number
})[], averageRate: number) => {
  const categories = [...resolvedCategories];
  categories.reduce(function resolver(sum, category) {
    if (category.products?.length) {
      let itemPrices = 0,
          itemWeights = 0,
          itemVolumes = 0;
      category.products.map(product => {
        product.items.map(item => {
          itemPrices+= item.price;
          if (item.unit == 'l' || product.unit == 'l') {
            itemVolumes+= (product.quantity || item.quantity || 1)*(product.measure || item.measure || 0);
          }
          else {
            itemWeights+= (product.quantity || item.quantity || 1)*convertMeasure(product.measure || item.measure, product.unit || item.unit, 'kg');
          }
        });
      });
      category.price_sum = itemPrices*averageRate;
      category.weight_sum = itemWeights*averageRate;
      category.volume_sum = itemVolumes*averageRate;
    }
    if (category.children?.length) {
      const sum: {
        price_sum: number,
        weight_sum: number,
        volume_sum: number
      } = category.children.reduce(resolver, {
        price_sum: 0,
        volume_sum: 0,
        weight_sum: 0
      });
      category.price_sum = sum.price_sum;
      category.weight_sum = sum.weight_sum;
      category.volume_sum = sum.volume_sum;
    }
    return {
      price_sum: sum.price_sum+(category.price_sum || 0),
      weight_sum: sum.weight_sum+(category.weight_sum || 0),
      volume_sum: sum.volume_sum+(category.volume_sum || 0)
    };
  }, {
    price_sum: 0,
    volume_sum: 0,
    weight_sum: 0
  });
  return categories;
};

export const getCategoryById = (categories: CategoryShape[], categoryId: CategoryShape['id']) => (
  categories.find(c => c.id === categoryId)
);

export const getCategoryAttributes = (category?: CategoryShape, attributeId?: CategoryAttributeShape['id']) => (
  Object.values(category?.attributes || {}).filter(attribute => attribute.attributeId === attributeId)
);

export const getCategoryWithAttributes = (
  categories: CategoryShape[],
  categoryId: CategoryShape['id'],
  attributeId: CategoryAttributeShape['id']
): [
  CategoryShape,
  CategoryAttributeShape[]
] | undefined => {
  if (!categories.length || !categoryId || !attributeId) return;

  const category = getCategoryById(categories, categoryId);
  const attributes = getCategoryAttributes(category, attributeId);

  if (attributes.length) {
    return [category, attributes];
  } else {
    const result = getCategoryWithAttributes(categories, category?.parentId, attributeId);
    if (result) {
      const [parentCategory, parentAttributes] = result;
      return [parentCategory, parentAttributes];
    }
  }
};

export const getCategoriesWithAttributes = (
  categories: CategoryShape[],
  categoryId: CategoryShape['id'],
  attributeId: CategoryAttributeShape['id']
) => {
  if (!categoryId) return;

  const results: [CategoryShape, CategoryAttributeShape[]][] = [];
  
  const result = getCategoryWithAttributes(categories, categoryId, attributeId);
  if (result) {
    let [populatedCategory, attributes] = result;
    results.push([populatedCategory, attributes]);
    while (attributes?.length) {
      const result = getCategoryWithAttributes(categories, populatedCategory.parentId, attributeId);
      if (result) {
        [populatedCategory, attributes] = result;
        results.push([populatedCategory, attributes]);
      } else {
        attributes = undefined;
      }
    }
  }
  return results;
};

export function resolveCategories(items: CategoryShape[], locale: Locale) {
  if (!locale) return;
  let itemAttributes: CategoryAttributeShape[],
      resolvedAttributes: {[key: CategoryAttributeShape['id']]: CategoryAttributeShape},
      item;
  for (const i in items) {
    item = items[i];
    resolvedAttributes = {};
    itemAttributes = item.attributes;
    for (const n in itemAttributes) {
      if (itemAttributes[n].attribute) {
        itemAttributes[n].attribute.name = getTranslation(itemAttributes[n].attribute.name, locale);

        let parent = itemAttributes[n].attribute.parent;
        while (parent) {
          parent.name = getTranslation(parent.name, locale);
          parent = parent.parent;
        }
      }
      resolvedAttributes[itemAttributes[n].attributeId] = itemAttributes[n];
    }
    item.attributes = Object.values(resolvedAttributes);
    if (item.children) {
      resolveCategories(item.children, locale);
    }
    item.name = getTranslation(item.name, locale);

    let parent = item.parent;
    while (parent) {
      parent.name = getTranslation(parent.name, locale);
      parent = parent.parent;
    }
  }
}

export const resolveCategoryPrices = (categories: (CategoryShape & {
  priceSum?: number
})[]) => {
  categories && categories.reduce(function resolver(sum, category) {
    if (category.products?.length) {
      let itemPrices = 0;
      category.products.map(product => {
        product.items.map(item => {
          itemPrices+= item.price;
        });
      });
      category.priceSum = (category.priceSum || 0)+itemPrices; 
    }
    if (category.children?.length) {
      category.priceSum = (category.priceSum || 0)+category.children.reduce(resolver, 0);
    }
    return sum+(category.priceSum || 0);
  }, 0);
};

export const resolveCategoryContributionPrices = (
  category: CategoryShape,
  products: ProductShape[] = [],
  items: ItemShape[] = [],
  foodUnitAttribute: AttributeShape,
  contributionCoverageThreshold = 0) => {
  let categoryContributionCoverageMeasure = 0;
    
  const portionAttribute = category.attributes.find(a => a.attributeId === foodUnitAttribute.id);
  const portionMeasure = convertMeasure(portionAttribute?.value, portionAttribute?.unit, 'kg');
  
  const sum = category?.contributions.reduce(function resolver(sum, categoryContribution) {
    const convertedAmount = convertMeasure(categoryContribution.amount, categoryContribution.unit, 'kg');
    products.forEach(product => {
      if (product.categoryId === categoryContribution.contributionId) {
        const productItem = items.find(item => {
          if (item.productId === product.id) {
            if (item?.price && (item.measure || product.measure)) {
              const itemAmount = convertMeasure(item.measure || product.measure, item.unit || product.unit, 'kg');
              sum+= item.price/itemAmount*convertedAmount;
              categoryContributionCoverageMeasure+= convertedAmount;
              return true;
            }
          }
        });
        return productItem ? false : true;
      }
    });
    if (categoryContribution.contribution?.contributions?.length) {
      sum+= categoryContribution.contribution.contributions.reduce(resolver, 0);
    }
    return sum;
  }, 0);
  return categoryContributionCoverageMeasure > contributionCoverageThreshold ? sum/categoryContributionCoverageMeasure*portionMeasure : undefined;
};

export const getStrippedCategories = (categories: (CategoryShape & {
  strippedName?: NameTranslations
})[], manufacturers: ManufacturerShape[] = []) => {
  return categories.map(category => {
    const name = category.name;
    category.strippedName = stripName(name, manufacturers);
    return category;
  });
};

export const getClosestCategory = (
  name: string,
  categories: (CategoryShape & {
    strippedName?: NameTranslations
  })[],
  acceptLocale: Locale,
  strippedName?: string
): [
  CategoryShape | undefined,
  Token | undefined
] => {
  if (!name) return [undefined, undefined];

  if (!strippedName) strippedName = stripDetails(name);

  let bestToken: Token, bestCategory: CategoryShape;

  console.log('strippedName', strippedName);

  categories.forEach((category) => {
    ObjectEntries(category.strippedName).forEach(([locale, translation]) => {
      if (acceptLocale && locale !== acceptLocale) return true;
      if (translation) {
        const tokens: [Token, string, number?][] = [];
        tokens.push([LevenshteinDistance(translation.toLowerCase(), strippedName.toLowerCase(), {search: true}) as Token, translation.toLowerCase(), 0.1]);
        tokens.push([LevenshteinDistance(category.name[locale].toLowerCase(), name.toLowerCase(), {search: true}) as Token, category.name[locale].toLowerCase()]);
        category.aliases?.forEach(alias => {
          tokens.push([LevenshteinDistance(alias.toLowerCase(), strippedName.toLowerCase(), {search: true}) as Token, alias.toLowerCase(), 0.1]);
          tokens.push([LevenshteinDistance(alias.toLowerCase(), name.toLowerCase(), {search: true}) as Token, alias.toLowerCase()]);
        });
        //tokens.push([LevenshteinDistance(category.parent?.name[locale]?.toLowerCase() || '', strippedName.toLowerCase(), {search: true}), category.parent?.name[locale]?.toLowerCase() || '']);

        let token: Token;
        tokens.forEach(t => {
          t[0].accuracy = (t[0].substring.length-t[0].distance-(t[2] || 0))/name.length;
          if (t[0].distance < 1 && t[0].accuracy > 0.1 && t[0].accuracy >= (token ? token.accuracy : 0)) {
            token = t[0];
            console.log('name', name, 'translation', translation, 'token', t);
          }
        });

        if (token?.accuracy > (bestToken ? bestToken.accuracy : 0)) {
          bestCategory = category;
          bestToken = token;
        }
      }
    });
  });
  console.log(
    'closest category',
    'name', name,
    'stripped name', strippedName,
    'category name', bestCategory?.name,
    'token', bestToken
  );
  return bestToken?.substring.length ? [bestCategory, bestToken] : [undefined, undefined];
};

export const findMeasure = (text?: string) => {
  let measure = undefined,
      unit = undefined;
  if (text) {
    const measureMatch = text.match(measureRegExp);
    measure = measureMatch && parseFloat(measureMatch[1].replace(',', '.'));
    if (measure && !isNaN(measure)) {
      if (measureMatch[4]) {
        unit = 'kg';
      }
      else if (measureMatch[5]) {
        unit = 'g';
      }
      else if (measureMatch[6]) {
        unit = 'l';
      }
    }
  }
  return {measure, unit};
};

export const findFoodUnitAttribute = (text?: string, attributes: AttributeShape[] = []) => {
  let foodUnitAttribute: AttributeShape;
  if (text) {
    const {size} = getDetails();
    Object.entries(size).forEach(([code, details]) => {
      if (details.some(detail => text.match(detail))) {
        foodUnitAttribute = attributes.find(attribute => attribute.code === code);
      }
    });
  }
  return foodUnitAttribute;
};

export const getTokensFromContributionList = (list: string) => (
  list?.replace(/[([][^)\]]*[)\]]|\./g, '')
  .replace(/\s{2,}/g, ' ')
  .trim()
  .split(/,\s|\sja\s|\sand\s|\soch\s|\s?&\s?/gi)
);

export const getContributionsFromList = (
  list: string,
  contentLanguage: Locale,
  categories: CategoryShape[] = [],
  attributes: AttributeShape[] = []
) => {
  const tokens = getTokensFromContributionList(list);
  const contributions: CategoryContributionShape[] = [];
  tokens?.forEach(contributionToken => {
    const measureMatch = contributionToken.match(measureRegExp);
    const measure = measureMatch && parseFloat(measureMatch[1]);
    let foodUnitAttribute: AttributeShape;
    let unit;
    if (measure && !isNaN(measure)) {
      if (measureMatch[4]) {
        unit = 'kg';
      }
      else if (measureMatch[5]) {
        unit = 'g';
      }
      else if (measureMatch[6]) {
        unit = 'l';
      }
    }
    const {size} = getDetails();
    Object.entries(size).forEach(([code, details]) => {
      if (details.some(detail => contributionToken.match(detail))) {
        foodUnitAttribute = attributes.find(attribute => attribute.code === code);
      }
    });
    let strippedContributionToken = stripDetails(contributionToken);
    let [contributionContribution, token] = getClosestCategory(contributionToken, categories, contentLanguage, strippedContributionToken);
    let contribution: CategoryContributionShape = {
      contribution: contributionContribution,
      contributionId: contributionContribution?.id
    };
    if (contribution.contribution) {
      if (foodUnitAttribute) {
        const {value, unit} = contribution.contribution.attributes.find(attribute => attribute.attributeId === foodUnitAttribute.id) || {};
        if (value) {
          contribution.amount = value;
          contribution.unit = unit;
        }
      } else if (measure) {
        contribution.amount = measure;
        contribution.unit = unit;
      }
    }
    if (contributionToken.split(' ').length > 2) {
      while (contributionContribution && contributionToken && strippedContributionToken) {
        contributionToken = contributionToken.replace(new RegExp(token.substring, 'i'), '').trim();
        strippedContributionToken = stripDetails(contributionToken).replace(new RegExp(token.substring, 'i'), '').trim();
        contributions.push(contribution);
        [contributionContribution, token] = getClosestCategory(contributionToken, categories, contentLanguage);
        contribution = {
          contribution: contributionContribution,
          contributionId: contributionContribution?.id
        };
        if (contribution) {
          if (foodUnitAttribute) {
            const {value, unit} = contribution.contribution.attributes.find(attribute => attribute.attributeId === foodUnitAttribute.id) || {};
            if (value) {
              contribution.amount = value;
              contribution.unit = unit;
            }
          } else if (measure) {
            contribution.amount = measure;
            contribution.unit = unit;
          }
        }
      }
    } else if (contribution.contribution) {
      contributions.push(contribution);
    }
  });
  return contributions;
};

export const getStrippedChildCategories = async (categories: CategoryShape[] = [], manufacturers: ManufacturerShape[] = []) => {
  //const categories = (await CategoryShape.query()
  //.withGraphFetched('[contributions, children, attributes]'));

  const childCategories = categories.filter(category => !category.children?.length);
  //const manufacturers = await ManufacturerShape.query();
  const strippedCategories = getStrippedCategories(childCategories, manufacturers);

  return strippedCategories;
};

export const getCategoryMinMaxAttributesWithMeasure = (
  category: CategoryShape,
  measure: CategoryContributionShape['amount'],
  unit: CategoryContributionShape['unit'],
  attributeId: AttributeShape['id'],
  categories: CategoryShape[] = [],
  categoryOwnAttributes: CategoryAttributeShape[] = [],
  attributes: AttributeShape[] = []
) => {
  let minAttributeValue, minCategoryAttribute, maxAttributeValue, maxCategoryAttribute;
  const result = getCategoriesWithAttributes(categories, category.id, attributeId);
  const [, categoryAttributes] = result?.[0] || [undefined, undefined];
  let attributeResult = getAttributeValues(unit, measure, 1, undefined, categoryOwnAttributes, attributes);
  if (!attributeResult.length) {
    attributeResult = getAttributeValues(unit, measure, 1, undefined, categoryAttributes, attributes);
  }
  if (attributeResult.length) {
    [minAttributeValue, minCategoryAttribute] = getMinAttributeValue(attributeResult);
    [maxAttributeValue, maxCategoryAttribute] = getMaxAttributeValue(attributeResult);
  }
  if (!minAttributeValue && !maxAttributeValue && category.contributions?.length) {
    category.contributions.forEach(contributionContribution => {
      const result = getCategoriesWithAttributes(categories, contributionContribution.contributionId, Number(attributeId));
      const [, categoryAttributes] = result?.[0] || [undefined, undefined];
      let attributeResult = getAttributeValues(unit, measure, 1, undefined, categoryOwnAttributes, attributes);
      if (!attributeResult.length) {
        attributeResult = getAttributeValues(unit, measure, 1, undefined, categoryAttributes, attributes);
      }
      if (attributeResult.length) {
        [minAttributeValue, minCategoryAttribute] = getMinAttributeValue(attributeResult);
        [maxAttributeValue, maxCategoryAttribute] = getMaxAttributeValue(attributeResult);
      }
    });
  }
  return {minAttributeValue, minCategoryAttribute, maxAttributeValue, maxCategoryAttribute};
};

export const getCategoryMinMaxAttributes = (
  category: CategoryShape,
  contribution: CategoryContributionShape,
  foodUnitAttribute: AttributeShape,
  attributeId: AttributeShape['id'],
  categories: CategoryShape[] = [],
  categoryOwnAttributes: CategoryAttributeShape[] = [],
  attributes: AttributeShape[] = []
) => {
  let unit: CategoryContributionShape['unit'],
      measure: CategoryContributionShape['amount'],
      portionAttribute;
  
  if (foodUnitAttribute) {
    portionAttribute = category.attributes.find(a => a.attributeId === foodUnitAttribute.id);
  }
  if (contribution?.amount) {
    measure = contribution.amount;
    unit = contribution.unit;
  } else if (portionAttribute) {
    measure = portionAttribute.value;
    unit = portionAttribute.unit;
  } else {
    return;
  }
  
  return getCategoryMinMaxAttributesWithMeasure(category, measure, unit, attributeId, categories, categoryOwnAttributes, attributes);
};

export const getCategoryPortionMeasure = (
  category: CategoryShape,
  foodUnitAttribute: AttributeShape,
) => {
  const portionAttribute = category.attributes.find(a => a.attributeId === foodUnitAttribute.id);
  return convertMeasure(portionAttribute?.value, portionAttribute?.unit, 'kg');
};

export const getCategoryMeasure = (
  category: CategoryShape,
  foodUnitAttribute: AttributeShape,
  categories: CategoryShape[] = [],
) => {
  if (foodUnitAttribute) {   
    if (category.attributes) {
      return getCategoryPortionMeasure(category, foodUnitAttribute);
    } else {
      return category.contributions?.reduce((total, productContribution) => {
        const contribution = categories.find(category => category.id === productContribution.contributionId);
        return total+getCategoryPortionMeasure(contribution, foodUnitAttribute);
      }, 0);
    }
  }
};


export const resolveCategoryAttributes = (
  category: CategoryShape,
  attributeIds: AttributeShape['id'][],
  foodUnitAttribute: AttributeShape,
  categories: CategoryShape[] = [],
  attributes: AttributeShape[] = [],
  contributionCoverageThreshold = 0
) => {
  const measure = getCategoryMeasure(category, foodUnitAttribute, categories);
  const portionMeasure = getCategoryPortionMeasure(category, foodUnitAttribute);
  const categoryAttributes: CategoryAttributeShape[] = [];

  attributeIds.forEach(attributeId => {
    let minValue = 0,
        maxValue = 0,
        unit = 'kg',
        categoryContributionCoverageMeasure = 0,
        categoryContributionTotalMeasure = 0;

    const initialProductAttributes = category.attributes?.filter(productAttribute => productAttribute.attributeId === attributeId);
    
    category.contributions?.forEach(categoryContribution => {
      const contribution = categories.find(category => category.id === categoryContribution.contributionId);
      const result = getCategoryMinMaxAttributes(
        contribution,
        categoryContribution,
        foodUnitAttribute,
        attributeId,
        categories,
        initialProductAttributes,
        attributes
      );
      categoryContributionTotalMeasure+= convertMeasure(categoryContribution.amount, categoryContribution.unit, 'kg');
      if (result?.minCategoryAttribute) {
        const {minAttributeValue, minCategoryAttribute, maxAttributeValue} = result;
        minValue+= minAttributeValue;
        maxValue+= maxAttributeValue;
        unit = minCategoryAttribute.unit.split('/')[0];
        categoryContributionCoverageMeasure+= convertMeasure(categoryContribution.amount, categoryContribution.unit, 'kg');
      } else {
        return true;
      }
    });

    minValue*= portionMeasure/categoryContributionTotalMeasure || 1;
    maxValue*= portionMeasure/categoryContributionTotalMeasure || 1;

    const result = getCategoryMinMaxAttributes(
      { ...category, contributions: [] },
      undefined,
      foodUnitAttribute,
      attributeId,
      categories,
      initialProductAttributes,
      attributes
    );
    console.log(
      categoryContributionCoverageMeasure, '/', categoryContributionTotalMeasure, '=',
      categoryContributionCoverageMeasure/categoryContributionTotalMeasure, contributionCoverageThreshold
    );
    if (result?.minCategoryAttribute) {
      const {minCategoryAttribute} = result;
      minValue = result.minAttributeValue;
      maxValue = result.maxAttributeValue;
      unit = minCategoryAttribute.unit.split('/')[0];
    } else if (categoryContributionCoverageMeasure/categoryContributionTotalMeasure <= contributionCoverageThreshold) {
      console.log('insufficient contributions skipped');
      return true;
    }
    
    const attribute = attributes.find(a => a.id === attributeId);
    if (minValue === maxValue) {
      categoryAttributes.push({
        value: minValue,
        unit,
        attribute
      });
    } else {
      categoryAttributes.push({
        value: minValue,
        type: 'MIN_VALUE',
        unit,
        attribute
      });
      categoryAttributes.push({
        value: maxValue,
        type: 'MAX_VALUE',
        unit,
        attribute
      });
    }
  });

  return { categoryAttributes, measure };
};
