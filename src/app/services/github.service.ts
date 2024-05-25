import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, switchMap, shareReplay, catchError, throttleTime } from 'rxjs/operators';
import { config } from '../configuration';
@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private authHeaders = new HttpHeaders({
    'Authorization': `token ${config.githubToken}`
  });
  public cache = new Map<string, Observable<any>>();
  private requestsQueue: Observable<any>[] = [];
  public RATE_LIMIT_INTERVAL = 1000; // Interval in ms (1 second)

  constructor(public http: HttpClient) {}

  public getTotalCount(url: string): Observable<number> {
    return this.http.get<any[]>(url, { headers: this.authHeaders, observe: 'response' }).pipe(
      map(response => {
        const linkHeader = response.headers.get('Link');
        if (linkHeader) {
          const lastPageLink = linkHeader.split(',').find(s => s.includes('rel="last"'));
          if (lastPageLink) {
            const lastPageUrl = new URL(lastPageLink.split(';')[0].trim().slice(1, -1));
            const totalCount = new URLSearchParams(lastPageUrl.search).get('page');
            if (totalCount && response.body) {
              return parseInt(totalCount) * response.body.length;
            }
          }
        }
        return response.body ? response.body.length : 0;
      }),
      catchError(() => of(0)) // Return 0 if there's an error or no response body
    );
  }

  public rateLimitedRequest<T>(request: Observable<T>): Observable<T> {
    this.requestsQueue.push(request);
    if (this.requestsQueue.length === 1) {
      return this.processQueue();
    } else {
      return new Observable<T>(observer => {
        const subscription = timer((this.requestsQueue.length - 1) * this.RATE_LIMIT_INTERVAL).subscribe(() => {
          this.processQueue().subscribe({
            next: value => observer.next(value),
            error: err => observer.error(err),
            complete: () => observer.complete()
          });
          subscription.unsubscribe();
        });
      });
    }
  }

  public processQueue(): Observable<any> {
    const request = this.requestsQueue.shift();
    if (request) {
      return request.pipe(
        throttleTime(this.RATE_LIMIT_INTERVAL),
        catchError(err => {
          if (err.status === 403) {
            return throwError(() => new Error('API rate limit exceeded. Please try again later.'));
          }
          return throwError(() => new Error('An error occurred. Please try again.'));
        })
      );
    } else {
      return of(null);
    }
  }

  getRepositories(username: string, page: number, pageSize: number): Observable<any> {
    if (!username.trim()) {
      return of({
        twitterUserName: '',
        location: '',
        avatar_url: '',
        login: '',
        html_url: ''
      }); // Return an empty observable if username is empty
    }

    const totalCountCacheKey = `total-${username}`;
    const pageCacheKey = `page-${username}-${page}-${pageSize}`;

    if (this.cache.has(pageCacheKey)) {
      return this.cache.get(pageCacheKey)!;
    }

    if (this.cache.has(totalCountCacheKey)) {
      const totalCountRequest = this.cache.get(totalCountCacheKey)!;

      const repositoriesRequest = totalCountRequest.pipe(
        switchMap(totalCount => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const pageToFetch = Math.min(page, totalPages); // Ensure we don't exceed totalPages
          const pageUrl = `https://api.github.com/users/${username}/repos?page=${pageToFetch}&per_page=${pageSize}`;

          return this.http.get<any[]>(pageUrl, { headers: this.authHeaders }).pipe(
            map(response => ({
              items: response || [],
              total_count: totalCount
            }))
          );
        }),
        shareReplay(1),
        catchError(error => {
          if (error.status === 403) {
            return throwError(() => new Error('API rate limit exceeded. Please try again later.'));
          }
          return throwError(() => new Error('An error occurred. Please try again.'));
        })
      );

      this.cache.set(pageCacheKey, repositoriesRequest);

      return this.rateLimitedRequest(repositoriesRequest);
    }

    const url = `https://api.github.com/users/${username}/repos?per_page=1`; // Using per_page=1 to get the total count more reliably

    const totalCountRequest = this.getTotalCount(url);

    const repositoriesRequest = totalCountRequest.pipe(
      switchMap(totalCount => {
        const totalPages = Math.ceil(totalCount / pageSize);
        const pageToFetch = Math.min(page, totalPages); // Ensure we don't exceed totalPages
        const pageUrl = `https://api.github.com/users/${username}/repos?page=${pageToFetch}&per_page=${pageSize}`;

        return this.http.get<any[]>(pageUrl, { headers: this.authHeaders }).pipe(
          map(response => ({
            items: response || [],
            total_count: totalCount
          }))
        );
      }),
      shareReplay(1),
      catchError(error => {
        if (error.status === 403) {
          return throwError(() => new Error('API rate limit exceeded. Please try again later.'));
        }
        return throwError(() => new Error('An error occurred. Please try again.'));
      })
    );

    this.cache.set(totalCountCacheKey, totalCountRequest);
    this.cache.set(pageCacheKey, repositoriesRequest);
    return this.rateLimitedRequest(repositoriesRequest);
}


getUserDetailsByUsername(username: string): Observable<{
  twitterUserName: string;
  location: string;
  avatar_url: string;
  login: string;
  html_url: string;
}> {
  if (!username.trim()) {
    return of({
      twitterUserName: '',
      location: '',
      avatar_url: '',
      login: '',
      html_url: ''
    }); // Return an empty observable if username is empty
  }
  const url = `https://api.github.com/users/${username}`;
  const userDetailsRequest = this.http.get<any>(url, { headers: this.authHeaders }).pipe(
    map(user => ({
      avatar_url: user.avatar_url,
      login: user.login,
      html_url: user.html_url,
      location: user.location,
      twitterUserName: user.twitter_username
    })),
    catchError(error => {
      if (error.status === 403) {
        return throwError(() => new Error('API rate limit exceeded. Please try again later.'));
      }
      return throwError(() => new Error('An error occurred. Please try again.'));
    })
  );
  return this.rateLimitedRequest(userDetailsRequest);
}

}
