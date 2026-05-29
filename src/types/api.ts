export type HealthResponse = {
  status: string;
};

export type Market = {
  id: number;
  name: string;
  county: string;
  sub_county?: string | null;
  ward?: string | null;
  market_type?: string | null;
  description?: string | null;
  is_active: boolean;
};

export type Price = {
  id: number;
  product_id: number;
  market_id?: number | null;
  county: string;
  unit: string;
  price: number;
  currency: string;
  observed_on: string;
  source_name: string;
  source_url?: string | null;
  confidence_score: number;
  notes?: string | null;
};

export type WeatherRiskSignal = {
  latitude: number;
  longitude: number;
  signal_date: string;
  heat_risk: string;
  rainfall_signal: string;
  summary: string;
  source_name: string;
};

export type StoredLocation = {
  id: number;
  location_name: string;
  normalized_name: string;
  country: string;
  latitude: number;
  longitude: number;
  source_name: string;
  source_display_name?: string | null;
  is_verified: boolean;
};