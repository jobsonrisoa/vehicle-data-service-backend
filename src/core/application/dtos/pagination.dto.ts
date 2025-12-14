export interface PaginationOptions {
  readonly first?: number;
  readonly after?: string | null;
}

export interface PageInfo {
  readonly hasNextPage: boolean;
  readonly endCursor: string | null;
}

export interface PaginatedResult<T> {
  readonly edges: T[];
  readonly pageInfo: PageInfo;
  readonly totalCount: number;
}

