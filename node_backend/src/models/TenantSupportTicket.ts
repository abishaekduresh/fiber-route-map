export type TicketCategory = 'network' | 'fiber' | 'iptv' | 'billing' | 'account' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketImpactLevel = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'reopened';
export type TicketSenderType = 'tenant' | 'admin' | 'system';

export interface TenantSupportTicket {
  id: number;
  uuid: string;
  tenantId: number;
  tenantBusinessId: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  impactLevel: TicketImpactLevel;
  status: TicketStatus;
  assignedTo: number | null;
  assignedAt: Date | null;
  slaResponseTime: number | null;
  slaResolutionTime: number | null;
  dueAt: Date | null;
  relatedNodeId: string | null;
  relatedRouteId: string | null;
  relatedCustomerId: string | null;
  attachments: any;
  metadata: any;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TenantTicketMessage {
  id: number;
  ticketId: number;
  senderType: TicketSenderType;
  senderId: number;
  message: string;
  attachments: any;
  createdAt: string;
}

export interface TenantTicketLog {
  id: number;
  ticketId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: number | null;
  performedAt: string;
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  impactLevel?: TicketImpactLevel;
  relatedNodeId?: string | null;
  relatedRouteId?: string | null;
  relatedCustomerId?: string | null;
  attachments?: any;
  metadata?: any;
}

export interface UpdateTicketDTO {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  impactLevel?: TicketImpactLevel;
  status?: TicketStatus;
  assignedTo?: number | null;
  assignedAt?: Date | null;
  relatedNodeId?: string | null;
  relatedRouteId?: string | null;
  relatedCustomerId?: string | null;
  attachments?: any;
  metadata?: any;
  resolutionNotes?: string | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  dueAt?: Date | null;
}

// SLA times in minutes per priority
export const SLA_TIMES: Record<TicketPriority, { response: number; resolution: number }> = {
  critical: { response: 60,   resolution: 240  },
  high:     { response: 240,  resolution: 480  },
  medium:   { response: 480,  resolution: 1440 },
  low:      { response: 1440, resolution: 4320 },
};
