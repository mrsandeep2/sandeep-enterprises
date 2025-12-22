// Product category configuration with flexible sub-categories and weight options

export interface WeightOption {
  value: string;
  label: string;
}

export interface SubCategoryOption {
  value: string;
  label: string;
}

export interface CategoryConfig {
  value: string;
  label: string;
}

// Main product categories
export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  { value: "chawal", label: "Chawal" },
  { value: "atta", label: "Atta" },
  { value: "kapila", label: "Kapila" },
  { value: "chokar", label: "Chokar" },
];

// Predefined sub-categories/varieties (available for all categories)
export const SUB_CATEGORIES: SubCategoryOption[] = [
  { value: "parmal_chawal", label: "Parmal Chawal" },
  { value: "kataranj_chawal", label: "Kataranj Chawal" },
  { value: "basmati_chawal", label: "Basmati Chawal" },
  { value: "sona_masoori", label: "Sona Masoori" },
  { value: "biryani_rice", label: "Biryani Rice" },
  { value: "special_kapila", label: "Special Kapila" },
  { value: "bypass_kapila", label: "By-Pass Kapila" },
];

// Unified weight options (available for all categories)
export const WEIGHT_OPTIONS: WeightOption[] = [
  { value: "5kg", label: "5 KG" },
  { value: "10kg", label: "10 KG" },
  { value: "15kg", label: "15 KG" },
  { value: "25kg", label: "25 KG" },
  { value: "35kg", label: "35 KG" },
  { value: "44kg", label: "44 KG" },
  { value: "48kg", label: "48 KG" },
  { value: "50kg", label: "50 KG" },
];

export const getCategoryByValue = (value: string): CategoryConfig | undefined => {
  return PRODUCT_CATEGORIES.find((cat) => cat.value === value);
};

export const getSubCategoryByValue = (value: string): SubCategoryOption | undefined => {
  return SUB_CATEGORIES.find((sub) => sub.value === value);
};

export const getWeightByValue = (value: string): WeightOption | undefined => {
  return WEIGHT_OPTIONS.find((w) => w.value === value);
};

export const formatWeight = (weight: string): string => {
  if (!weight) return "";
  return weight.toUpperCase().replace("KG", " KG");
};

export const generateProductName = (
  category: string,
  subCategory?: string,
  weight?: string
): string => {
  const parts: string[] = [];
  
  // Add category
  const cat = getCategoryByValue(category);
  if (cat) {
    parts.push(cat.label);
  }
  
  // Add sub-category if provided
  if (subCategory) {
    // Check if it's a predefined sub-category
    const sub = getSubCategoryByValue(subCategory);
    if (sub) {
      parts.push(sub.label);
    } else {
      // Custom sub-category - use as is
      parts.push(subCategory);
    }
  }
  
  // Add weight if provided
  if (weight) {
    parts.push(formatWeight(weight));
  }
  
  return parts.join(" – ");
};
