// Shared types between frontend and backend

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  occupation?: string;
  company_name?: string;
  phone?: string;
  pic?: string;
  language: string;
  is_admin: boolean;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// WebRTC & CRM Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  price_range?: string;
  delivery_date?: string;
  address?: string;
  docs_url?: string;
  faq_json?: any;
  docs_json?: any;
  created_at: string;
}

export interface Lead {
  id: number;
  project_id?: number;
  full_name: string;
  phone_e164?: string;
  source?: string;
  consent_kvkk: boolean;
  consent_text?: string;
  utm?: any;
  created_at: string;
  project?: Project;
}

export interface Call {
  id: number;
  lead_id?: number;
  session_id: string;
  status: 'created' | 'connecting' | 'in-progress' | 'completed' | 'failed';
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
  transcript_text?: string;
  summary_json?: any;
  sentiment?: 'positive' | 'neutral' | 'negative';
  score_hotness?: number;
  lead?: Lead;
}

export interface Appointment {
  id: number;
  lead_id?: number;
  type: 'office' | 'zoom';
  start_ts: string;
  end_ts: string;
  location?: string;
  gcal_event_id?: string;
  zoom_join_url?: string;
  lead?: Lead;
}

export interface Message {
  id: number;
  lead_id?: number;
  channel: 'whatsapp' | 'sms' | 'email';
  template_key: string;
  payload_json?: any;
  status: 'queued' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  lead?: Lead;
}

export interface Integration {
  id: number;
  type: string;
  credentials_json?: any;
  created_at: string;
}

// WebRTC Session Types
export interface WebRTCSession {
  call_id: number;
  session_id: string;
  session_url: string;
  expires_in: number;
}

export interface WebRTCToken {
  token: string;
  expires_in: number;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  [key: string]: any;
}

export interface ClientOfferMessage extends WSMessage {
  type: 'client-offer';
  call_id: number;
  sdp: string;
}

export interface ClientICEMessage extends WSMessage {
  type: 'client-ice';
  candidate: any;
}

export interface GatewayAnswerMessage extends WSMessage {
  type: 'gateway-answer';
  sdp: string;
}

export interface GatewayICEMessage extends WSMessage {
  type: 'gateway-ice';
  candidate: any;
}

export interface StatusMessage extends WSMessage {
  type: 'status';
  status: string;
}

export interface TranscriptDeltaMessage extends WSMessage {
  type: 'transcript.delta';
  text: string;
}

export interface TranscriptFinalMessage extends WSMessage {
  type: 'transcript.final';
  text: string;
}

export interface AudioDataMessage extends WSMessage {
  type: 'audio.data';
  audio: string; // base64 encoded audio
  text: string;
}

export interface SummaryReadyMessage extends WSMessage {
  type: 'summary.ready';
  summary: any;
  sentiment: string;
  score_hotness: number;
}

export interface ErrorMessage extends WSMessage {
  type: 'error';
  message: string;
}
