export type InterestType = "Owner-occupier" | "Investor" | "Developer" | "Agent";
export type EnquiryStatus = "new" | "contacted" | "closed";

export interface Profile {
  id: string;
  full_name: string | null;
  interest_type: InterestType | null;
  is_circle_member: boolean;
  is_admin: boolean;
  joined_at: string;
}

export interface CircleSignup {
  id: string;
  full_name: string;
  email: string;
  interest_type: InterestType | null;
  source: string | null;
  created_at: string;
}

export interface Enquiry {
  id: string;
  development_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  buyer_type: InterestType | null;
  notes: string | null;
  status: EnquiryStatus;
  created_at: string;
}

export interface DeveloperLead {
  id: string;
  contact_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  development_name: string;
  suburb: string | null;
  state: string | null;
  residence_count: number | null;
  expected_completion: string | null;
  notes: string | null;
  status: EnquiryStatus;
  created_at: string;
}
