export type IdeaStatus =
  | "interested"
  | "shortlisted"
  | "rejected"
  | "converted";

export type IdeaSourcePlatform =
  | "alibaba"
  | "1688"
  | "shopee"
  | "tiktok"
  | "amazon"
  | "made_in_china"
  | "other";

export interface ProductIdea {
  id: string;
  productName: string;
  sourceLink: string;
  sourcePlatform: IdeaSourcePlatform;
  imageUrl: string | null;
  whyInteresting: string;
  possibleBrand: string;
  estimatedPriceRange: string;
  tags: string[];
  status: IdeaStatus;
  convertedProductId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewIdeaInput {
  productName: string;
  sourceLink: string;
  sourcePlatform: IdeaSourcePlatform;
  whyInteresting: string;
  possibleBrand: string;
  estimatedPriceRange: string;
  tags: string[];
}
