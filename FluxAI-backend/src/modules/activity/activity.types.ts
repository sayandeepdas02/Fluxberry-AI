export interface ListActivityQuery {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    actorType?: string;
}

export interface ActivityFilter {
    organizationId: string;
    entityType?: string;
    entityId?: string;
    actorType?: string;
}
