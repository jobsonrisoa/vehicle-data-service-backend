export interface PaginationOptions {
  readonly first?: number;
  readonly after?: string;
}

export interface Edge<T> {
  readonly node: T;
  readonly cursor: string;
}

export interface PageInfo {
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly startCursor: string | null;
  readonly endCursor: string | null;
}

export interface PaginatedResult<T> {
  readonly edges: Edge<T>[];
  readonly pageInfo: PageInfo;
  readonly totalCount: number;
}
