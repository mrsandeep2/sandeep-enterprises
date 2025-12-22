// Product category configuration with dynamic sub-categories and weight options

export interface WeightOption {
  value: string;
  label: string;
}

export interface SubCategoryOption {
  value: string;
  label: string;
  weights?: WeightOption[];
}

export interface CategoryConfig {
  value: string;
  label: string;
  subCategories?: SubCategoryOption[];
  weights?: WeightOption[];
}

export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  {
    value: "chawal",
    label: "Chawal",
    subCategories: [
      { value: "parmal_chawal", label: "Parmal Chawal" },
      { value: "kataranj_chawal", label: "Kataranj Chawal" },
      { value: "basmati_chawal", label: "Basmati Chawal" },
      { value: "sona_masoori", label: "Sona Masoori" },
      { value: "biryani_rice", label: "Biryani Rice" },
    ],
  },
  {
    value: "atta",
    label: "Atta",
    weights: [
      { value: "5kg", label: "5 KG" },
      { value: "10kg", label: "10 KG" },
      { value: "15kg", label: "15 KG" },
      { value: "25kg", label: "25 KG" },
    ],
  },
  {
    value: "kapila",
    label: "Kapila",
    subCategories: [
      {
        value: "special_kapila",
        label: "Special Kapila",
        weights: [
          { value: "25kg", label: "25 KG" },
          { value: "50kg", label: "50 KG" },
        ],
      },
      {
        value: "bypass_kapila",
        label: "By-Pass Kapila",
        weights: [
          { value: "25kg", label: "25 KG" },
          { value: "50kg", label: "50 KG" },
        ],
      },
    ],
  },
  {
    value: "chokar",
    label: "Chokar",
    weights: [
      { value: "35kg", label: "35 KG" },
      { value: "44kg", label: "44 KG" },
      { value: "48kg", label: "48 KG" },
    ],
  },
];

export const getCategoryByValue = (value: string): CategoryConfig | undefined => {
  return PRODUCT_CATEGORIES.find((cat) => cat.value === value);
};

export const getSubCategoryByValue = (
  category: string,
  subCategory: string
): SubCategoryOption | undefined => {
  const cat = getCategoryByValue(category);
  return cat?.subCategories?.find((sub) => sub.value === subCategory);
};

export const getWeightOptions = (
  category: string,
  subCategory?: string
): WeightOption[] => {
  const cat = getCategoryByValue(category);
  
  if (!cat) return [];
  
  // If category has sub-categories with weights (like Kapila)
  if (subCategory && cat.subCategories) {
    const sub = cat.subCategories.find((s) => s.value === subCategory);
    if (sub?.weights) return sub.weights;
  }
  
  // If category has direct weights (like Atta, Chokar)
  if (cat.weights) return cat.weights;
  
  return [];
};

export const generateProductName = (
  category: string,
  subCategory?: string,
  weight?: string
): string => {
  const cat = getCategoryByValue(category);
  if (!cat) return "";
  
  let name = cat.label;
  
  if (subCategory) {
    const sub = getSubCategoryByValue(category, subCategory);
    if (sub) name = sub.label;
  }
  
  if (weight) {
    const weightLabel = weight.toUpperCase().replace("KG", " KG");
    name = `${name} - ${weightLabel}`;
  }
  
  return name;
};
