import type { QueryProviderEvent } from "$sb/app_event.ts";
import {
  applyQuery,
} from "$sb/lib/query.ts";
import { evalQueryExpression } from "$sb/lib/query_expression.ts";
import { readSecrets } from "$sb/lib/secrets_page.ts";

interface ReadwiseBook {
  id: number;
  title: string;
  author: string;
  category: string;
  source: string;
  num_highlights: number;
  last_highlight_at: string;
  updated: string;
  cover_image_url: string;
  highlights_url: string;
  source_url: string;
  asin: string | null;
  tags: string[];
}

interface ReadwiseBooksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseBook[];
}

interface ReadwiseHighlight {
  id: number;
  text: string;
  note: string;
  location: number;
  location_type: string;
  highlighted_at: string;
  updated: string;
  book_id: number;
  tags: string[];
  url: string;
  color: string;
}

interface ReadwiseHighlightsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseHighlight[];
}


interface QueryFilters {
  [key: string]: string;
}

function extractQueryFilters(query: any[]): QueryFilters {
  if (!Array.isArray(query)) return {};
  
  const filters: QueryFilters = {};
  
  // Skip the "and" at the beginning and process each filter
  const filterArray = query[0] === "and" ? query.slice(1) : query;
  
  filterArray.forEach(filter => {
    if (!Array.isArray(filter) || filter.length !== 3) return;
    
    const [operator, attrArray, valueArray] = filter;
    
    if (!Array.isArray(attrArray) || attrArray[0] !== "attr") return;
    const attribute = attrArray[1];
    
    if (!Array.isArray(valueArray)) return;
    const value = valueArray[1];
    
    switch (operator) {
      case "=":
        filters[attribute] = value;
        break;
      case ">":
        filters[`${attribute}__gt`] = value;
        break;
      case "<":
        filters[`${attribute}__lt`] = value;
        break;
    }
  });
  
  return filters;
}

export async function getBooks({ query }: QueryProviderEvent): Promise<any[]> {
  const [token] = await readSecrets(["readwiseToken"]);
  const books: ReadwiseBook[] = [];
  let nextUrl: string | null = `https://readwise.io/api/v2/books/`;
  let limit = 10000;
  if (query.limit) {
    limit = await evalQueryExpression(
      query.limit,
      {},
      {},
      {},
    );
  }
  const pageSize = Math.min(limit, 1000);
  const filters = extractQueryFilters(query.filter);

  try {
    while (nextUrl && books.length < limit) {
      const url = new URL(nextUrl);
      url.searchParams.set("page_size", pageSize.toString());
      Object.entries(filters).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: ReadwiseBooksResponse = await response.json();
      books.push(...data.results);
      nextUrl = data.next;
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
  }

  const result = applyQuery(
    query,
    books,
    {},
    {}
  );

  return result;
}

export async function getHighlights({ query }: QueryProviderEvent): Promise<any[]> {
  const [token] = await readSecrets(["readwiseToken"]);
  const highlights: ReadwiseHighlight[] = [];
  let nextUrl: string | null = `https://readwise.io/api/v2/highlights/`;
  let limit = 10000;
  if (query.limit) {
    limit = await evalQueryExpression(
      query.limit,
      {},
      {},
      {},
    );
  }
  const pageSize = Math.min(limit, 1000);
  const filters = extractQueryFilters(query.filter);

  try {
    while (nextUrl && highlights.length < limit) {
      const url = new URL(nextUrl);
      url.searchParams.set("page_size", pageSize.toString());

      // Add all filters to search params, including book_id if present
      Object.entries(filters).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${await response.text()}`);
      }

      const data: ReadwiseHighlightsResponse = await response.json();
      highlights.push(...data.results);
      nextUrl = data.next;
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching highlights: ${error.message}`);
    } else {
      console.error("An unknown error occurred while fetching highlights");
    }
  }

  const result = applyQuery(
    query,
    highlights,
    {},
    {}
  );

  return result;
}
