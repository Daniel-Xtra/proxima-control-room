/**
 * Transport layer. The backend responds with a `{ message, data }` envelope.
 * Until the admin API is wired in, features resolve their data through `simulate`,
 * which mimics latency and the error shape so the UI states can be exercised.
 */
export interface Envelope<T> {
  message: string;
  data: T;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function simulate<T>(produce: () => T, delay = 350): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error instanceof ApiError ? error : new ApiError(500, "Unexpected error"));
      }
    }, delay);
  });
}

export function paginate<T>(rows: T[], page: number, limit: number): Page<T> {
  const start = (page - 1) * limit;
  return { items: rows.slice(start, start + limit), total: rows.length, page, limit };
}
