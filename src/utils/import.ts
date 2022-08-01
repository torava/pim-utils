import Excel from 'exceljs';

import CategoryShape from "../models/Category";
import { Locale } from "./types";

export const getDiaryExcelFineli = async (filename: string, categories: CategoryShape[] = [], locale: Locale = Locale['fi-FI']) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filename);
  const worksheet = workbook.worksheets[0];
  worksheet.eachRow(row => {
    const food = row.getCell(4).value;
    const category = categories.find(category => category.name?.['fi-FI'] === food);
    const ghgCategoryAttribute = category.attributes.find(attribute => attribute.attribute.name === 'GHG');
    console.log(food, ghgCategoryAttribute);
  });
};
