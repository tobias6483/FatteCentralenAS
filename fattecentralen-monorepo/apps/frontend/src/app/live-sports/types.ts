import { LucideIcon } from "lucide-react";

export interface EventOdds {
    teamA: string;
    draw: string;
    teamB: string;
}

export interface BaseEvent {
    id: string;
    league: string;
    teamA: string;
    teamB: string;
    odds: EventOdds;
    statsLink: string; // e.g., /live-sports/[sport]/[eventId]/stats
}

export interface LiveEvent extends BaseEvent {
    time: string; // e.g., "Live nu - 75 min" or "Starter om 01:30:00"
    score: string; // e.g., "1 - 1"
    streamingLink?: string;
}

export interface UpcomingEvent extends BaseEvent {
    date: string; // e.g., "25. maj 2025"
    time: string; // e.g., "19:00"
}

export interface Sport {
    id: string; // e.g., "football", "esports"
    name: string; // e.g., "Fodbold", "E-sport"
    icon: LucideIcon;
    liveEvents: LiveEvent[];
    upcomingEvents: UpcomingEvent[];
}

// For coupon/session creation UI (static in Phase 2)
export interface CouponSelection {
    eventId: string;
    sportKey: string;
    matchName: string;
    outcomeName: string; // e.g., "Real Madrid", "Uafgjort", "Team Vitality"
    odds: number;
}

// For the session settings modal (static in Phase 2)
export interface SessionSettings {
    sessionName: string;
    maxPlayers: number;
    isPrivate: boolean;
    password?: string;
}
