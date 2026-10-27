// TypeScript types matching backend schemas

export type UserRole = 'admin' | 'viewer';
export type DeviceType = 'switch' | 'light' | 'climate' | 'sensor' | 'other';
export type DeviceStatus = 'online' | 'offline' | 'unavailable' | 'unknown';
export type AnomalySeverity = 'info' | 'warning' | 'critical';
export type AnomalyStatus = 'open' | 'acknowledged' | 'resolved';
export type RecommendationStatus = 'active' | 'applied' | 'dismissed';
export type AutomationStatus = 'enabled' | 'disabled';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
}

export interface Device {
  id: number;
  name: string;
  entity_id: string;
  device_type: DeviceType;
  status: DeviceStatus;
  room_id?: number;
  room?: Room;
  is_controllable: boolean;
  has_power_monitoring: boolean;
  current_power_w?: number;
  last_seen?: string;
}

export interface CurrentPower {
  timestamp: string;
  total_power_w: number;
  total_energy_today_kwh: number;
  estimated_cost_today: number;
  currency_symbol: string;
  data_source: 'live' | 'demo' | 'stale';
  is_demo: boolean;
  last_sync?: string;
}

export interface EnergyDataPoint {
  timestamp: string;
  energy_kwh: number;
  power_w?: number;
  cost?: number;
  is_forecast: boolean;
}

export interface EnergyHistory {
  data: EnergyDataPoint[];
  total_kwh: number;
  total_cost: number;
  currency_symbol: string;
  period_start: string;
  period_end: string;
  is_demo: boolean;
}

export interface ApplianceConsumption {
  device_id: number;
  device_name: string;
  entity_id: string;
  room_name?: string;
  energy_kwh: number;
  peak_power_w?: number;
  percentage_of_total: number;
  estimated_cost: number;
  status: DeviceStatus;
}

export interface ForecastPoint {
  timestamp: string;
  predicted_kwh: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface Forecast {
  generated_at: string;
  horizon_hours: number;
  method: string;
  predictions: ForecastPoint[];
  mae?: number;
  rmse?: number;
  evaluation_period?: string;
  training_samples?: number;
  notes?: string;
  is_demo: boolean;
  insufficient_data: boolean;
}

export interface AnomalyEvent {
  id: number;
  detected_at: string;
  entity_id?: string;
  device_id?: number;
  observed_value?: number;
  baseline_value?: number;
  deviation_pct?: number;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  detection_method?: string;
  title: string;
  explanation?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  is_demo: boolean;
}

export interface Recommendation {
  id: number;
  title: string;
  description?: string;
  evidence?: string;
  suggested_action?: string;
  estimated_saving_inr_month?: number;
  saving_confidence?: string;
  priority: string;
  status: RecommendationStatus;
  device_id?: number;
  created_at: string;
  is_demo: boolean;
}

export interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  trigger: Record<string, unknown>;
  conditions?: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  schedule?: Record<string, unknown>;
  status: AutomationStatus;
  last_executed_at?: string;
  last_execution_result?: string;
  execution_count: number;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message?: string;
  severity: string;
  category?: string;
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  username?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  success: boolean;
}

export interface ServiceHealth {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  message?: string;
  latency_ms?: number;
  last_checked: string;
}

export interface SystemHealth {
  overall: string;
  services: ServiceHealth[];
  demo_mode: boolean;
  app_version: string;
}

export interface TariffConfig {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  rate_per_kwh: number;
  is_active: boolean;
}

export interface DailyRecord {
  date: string;
  total_energy_kwh: number;
  peak_power_w?: number;
  avg_power_w?: number;
  estimated_cost: number;
  active_device_count?: number;
  data_quality: string;
}

export interface EnergyAnalyticsSummary {
  total_energy_kwh: number;
  daily_avg_kwh: number;
  peak_power_w?: number;
  estimated_cost: number;
  currency_symbol: string;
  period_days: number;
  is_demo: boolean;
  records: DailyRecord[];
}

export interface HAConnectionTestResult {
  success: boolean;
  message: string;
  ha_version?: string;
  entity_count?: number;
  latency_ms?: number;
}
