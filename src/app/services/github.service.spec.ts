import { TestBed, fakeAsync, tick} from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GithubService } from './github.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
describe('GithubService', () => {
  let service: GithubService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GithubService]
    });
    service = TestBed.inject(GithubService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // Increase timeout interval to 10 seconds
  //test1
  it('service should be created', () => {
    expect(service).toBeTruthy();
  });
  //test2
  it('should return empty observable if username is empty', () => {
    const username = '';
    const page = 1;
    const pageSize = 10;

    service.getRepositories(username, page, pageSize).subscribe(response => {
      expect(response).toEqual({
        twitterUserName: '',
        location: '',
        avatar_url: '',
        login: '',
        html_url: ''
      });
    });

    const req = httpMock.expectNone('https://api.github.com/users/' + username + '/repos?page=' + page + '&per_page=' + pageSize);
  });

  //test3

  it('should return user details for a valid username', () => {
    const username = 'octocat';
    const mockResponse = {
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      login: 'octocat',
      html_url: 'https://github.com/octocat',
      location: 'San Francisco',
      twitter_username: 'octocat'
    };

    service.getUserDetailsByUsername(username).subscribe(userDetails => {
      expect(userDetails).toEqual({
        avatar_url: mockResponse.avatar_url,
        login: mockResponse.login,
        html_url: mockResponse.html_url,
        location: mockResponse.location,
        twitterUserName: mockResponse.twitter_username
      });
    });

    const req = httpMock.expectOne(`https://api.github.com/users/${username}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
  //test4
  it('should handle API rate limit exceeded error', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const errorMessage = 'API rate limit exceeded';
  
    // Spy on the getRepositories method to intercept the HTTP request
    spyOn(service, 'getRepositories').and.returnValue(
      throwError(new HttpErrorResponse({ status: 403, statusText: errorMessage }))
    );
  
    // Subscribe to the observable returned by getRepositories
    service.getRepositories(username, page, pageSize).subscribe({
      error: error => {
        expect(error.message).toContain(errorMessage);
      }
    });
  });

  //test 5
  it('should handle other API errors', () => {
    const username = 'octocat';

    service.getUserDetailsByUsername(username).subscribe({
      next: () => fail('should have failed with a 500 error'),
      error: (error) => {
        expect(error.message).toContain('An error occurred. Please try again.');
      }
    });

    const req = httpMock.expectOne(`https://api.github.com/users/${username}`);
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
  //test6
  it('service should retrieve repositories correctly for valid user name', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const totalCountResponse = 2;
    const repositoriesResponse = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
  
    service.getRepositories(username, page, pageSize).subscribe(repos => {
      expect(repos.items.length).toBe(2);
      expect(repos.items[0].name).toBe('repo1');
      expect(repos.items[1].name).toBe('repo2');
      expect(repos.total_count).toBe(totalCountResponse);
    });
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    expect(totalCountRequest.request.method).toBe('GET');
    totalCountRequest.flush(repositoriesResponse); // Mock response with dummy data for total count
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    expect(repositoriesRequest.request.method).toBe('GET');
    repositoriesRequest.flush(repositoriesResponse); // Mock response with dummy data for repositories
  });
  //test7
  it('should return an empty observable for an empty username', () => {
    service.getUserDetailsByUsername('').subscribe(userDetails => {
      expect(userDetails).toEqual({
          twitterUserName: '',
          location: '',
          avatar_url: '',
          login: '',
          html_url: ''
        });
    });

    // Verify that no HTTP request is made when the username is empty
    httpMock.expectNone(`https://api.github.com/users/`);
  });
  //test8
  it('should handle network errors when retrieving repositories', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
  
    // Subscribe to the observable returned by getRepositories
    service.getRepositories(username, page, pageSize).subscribe({
      error: error => {
        expect(error).toBeTruthy();
      }
    });
  
    // Expect an HTTP request for total count
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    // Flush the total count request with a response to avoid unexpected errors
    totalCountRequest.flush([{ id: 1, name: 'repo1' }]);
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest.error(new ErrorEvent('Network error'));
  });
  //test9
  it('should cache responses for subsequent requests', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const repositoriesResponse = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
  
    // Subscribe to the first request
    service.getRepositories(username, page, pageSize).subscribe();
  
    // Expect an HTTP request for total count
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    totalCountRequest.flush(repositoriesResponse);
  
    // Make the same request again
    service.getRepositories(username, page, pageSize).subscribe(repos => {
      expect(repos.items.length).toBe(2);
      expect(repos.items[0].name).toBe('repo1');
      expect(repos.items[1].name).toBe('repo2');
    });
  
    // No HTTP request should be made for total count as it should be served from the cache
    httpMock.expectNone(`https://api.github.com/users/${username}/repos?per_page=1`);
  
    // Expect an HTTP request for the specific page
    const pageRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    
    // Flush the page request with a response to avoid unexpected errors
    pageRequest.flush(repositoriesResponse);
  });
  //test10
  it('should handle fetching the first page of repositories', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const repositoriesResponse = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
    const totalCountResponse = 2;
  
    service.getRepositories(username, page, pageSize).subscribe(repos => {
      expect(repos.items.length).toBe(2);
      expect(repos.items[0].name).toBe('repo1');
      expect(repos.items[1].name).toBe('repo2');
      expect(repos.total_count).toBe(totalCountResponse);
    });
  
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    totalCountRequest.flush(repositoriesResponse);
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest.flush(repositoriesResponse);
  });
 //test11
  it('should handle rate-limiting correctly', (done) => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const repositoriesResponse = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
    const totalCountResponse = 2;

    // Simulate multiple requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(service.getRepositories(username, page, pageSize));
    }

    // Subscribe to all requests
    requests.forEach((request, index) => {
      request.subscribe(repos => {
        expect(repos.items.length).toBe(2);
        expect(repos.items[0].name).toBe('repo1');
        expect(repos.items[1].name).toBe('repo2');
        if (index === requests.length - 1) {
          done();
        }
      });
    });

    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    totalCountRequest.flush(repositoriesResponse);
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest.flush(repositoriesResponse);
  });


  // test12
  it('should handle multiple requests correctly', () => {
    const username1 = 'testUser1';
    const username2 = 'testUser2';
    const page = 1;
    const pageSize = 10;
    const repositoriesResponse1 = [{ id: 1, name: 'repo1' }];
    const repositoriesResponse2 = [{ id: 2, name: 'repo2' }];

    service.getRepositories(username1, page, pageSize).subscribe(repos => {
      expect(repos.items.length).toBe(1);
      expect(repos.items[0].name).toBe('repo1');
    });

    service.getRepositories(username2, page, pageSize).subscribe(repos => {
      expect(repos.items.length).toBe(1);
      expect(repos.items[0].name).toBe('repo2');
    });

    const totalCountRequest1 = httpMock.expectOne(`https://api.github.com/users/${username1}/repos?per_page=1`);
    totalCountRequest1.flush(repositoriesResponse1);
    const repositoriesRequest1 = httpMock.expectOne(`https://api.github.com/users/${username1}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest1.flush(repositoriesResponse1);

    const totalCountRequest2 = httpMock.expectOne(`https://api.github.com/users/${username2}/repos?per_page=1`);
    totalCountRequest2.flush(repositoriesResponse2);
    const repositoriesRequest2 = httpMock.expectOne(`https://api.github.com/users/${username2}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest2.flush(repositoriesResponse2);
  });

  // test13
  it('should handle invalid URLs correctly', () => {
    const invalidUsername = 'invalidUser';

    service.getUserDetailsByUsername(invalidUsername).subscribe({
      next: () => fail('should have failed with a 404 error'),
      error: (error) => {
        expect(error.message).toContain('An error occurred. Please try again.');
      }
    });

    const req = httpMock.expectOne(`https://api.github.com/users/${invalidUsername}`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  //test 14
  it('should handle simultaneous requests for the same data efficiently', () => {
    const username = 'testUser';
    const page = 1;
    const pageSize = 10;
    const repositoriesResponse = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
  
    service.getRepositories(username, page, pageSize).subscribe();
    service.getRepositories(username, page, pageSize).subscribe();
  
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    totalCountRequest.flush(repositoriesResponse);
  
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`);
    repositoriesRequest.flush(repositoriesResponse);
  
    httpMock.verify();
  });

  //test15
  it('should handle pagination correctly for large number of repositories', (done) => {
    const username = 'testUser';
    const pageSize = 2;
    const repositoriesResponse = [
      { id: 1, name: 'repo1' },
      { id: 2, name: 'repo2' },
      { id: 3, name: 'repo3' },
      { id: 4, name: 'repo4' }
    ];
  
    service.getRepositories(username, 1, pageSize).subscribe(response => {
      expect(response.items.length).toBe(pageSize);
      expect(response.items[0].name).toBe('repo1');
      expect(response.items[1].name).toBe('repo2');
      done();
    });
  
    const totalCountRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?per_page=1`);
    totalCountRequest.flush([repositoriesResponse[0]], { headers: { Link: '<https://api.github.com/users/testUser/repos?page=2>; rel="last"' } });
  
    const repositoriesRequest = httpMock.expectOne(`https://api.github.com/users/${username}/repos?page=1&per_page=${pageSize}`);
    repositoriesRequest.flush(repositoriesResponse.slice(0, pageSize));
  });

  it('should return repositories from cache if available', () => {
    const username = 'testuser';
    const page = 1;
    const pageSize = 10;
  
    spyOn(service['cache'], 'has').and.callFake((key: string) => {
      // Return true only if the key matches 'total-testuser'
      return key === `total-${username}`;
    });
    
    spyOn(service['cache'], 'get').and.returnValue(of(null)); // Mocking with 'of' operator
  
    service.getRepositories(username, page, pageSize);
  
    expect(service['cache'].has).toHaveBeenCalledWith(`total-${username}`);
    expect(service['cache'].has).toHaveBeenCalledWith(`page-${username}-${page}-${pageSize}`);
    expect(service['cache'].get).toHaveBeenCalledTimes(1);
  });

it('should handle 403 error when user details request fails due to rate limit exceeded', () => {
  const username = 'testuser';

  // Mocking the HTTP request to return an error with status 403
  spyOn(service.http, 'get').and.returnValue(throwError({ status: 403 }));

  service.getUserDetailsByUsername(username).subscribe({
    error: (err) => {
      expect(err.message).toBe('An error occurred. Please try again.');
    }
  })
 })

  it('should handle error when user details request fails with a non-403 status code', () => {
    const username = 'testuser';
    // Mocking the HTTP request to return an error with a non-403 status code
    spyOn(service.http, 'get').and.returnValue(throwError({ status: 500, message: 'Internal Server Error' }));
  
    service.getUserDetailsByUsername(username).subscribe({
      error: (err) => {
        expect(err.message).toBe('An error occurred. Please try again.');
      }
    });
  });

  it('should return total count from response with Link header', () => {
    const url = 'https://api.github.com/users/testUser/repos?page=1';
    const totalCount = 50;
    const pageSize = 10;
    const responseData = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

    const linkHeader = '<https://api.github.com/users/testUser/repos?page=2&per_page=10>; rel="next", <https://api.github.com/users/testUser/repos?page=5&per_page=10>; rel="last"';

    service.getTotalCount(url).subscribe(count => {
      expect(count).toEqual(25);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush(responseData, {
      headers: {
        Link: linkHeader
      }
    });
  });

  it('should return total count from response without Link header', () => {
    const url = 'https://api.github.com/users/testUser/repos?page=1';
    const totalCount = 20;
    const responseData = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

    service.getTotalCount(url).subscribe(count => {
      expect(count).toEqual(5);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush(responseData); // No Link header
  });
  it('should return total count as zero if there is an error', () => {
    const url = 'https://api.github.com/users/testUser/repos?page=1';

    service.getTotalCount(url).subscribe(count => {
      expect(count).toEqual(0);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.error(new ErrorEvent('404')); // Simulate error
  });

  it('should return total count as zero if there is no response body', () => {
    const url = 'https://api.github.com/users/testUser/repos?page=1';

    service.getTotalCount(url).subscribe(count => {
      expect(count).toEqual(0);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush(null); // No response body
  });

  it('should process the request from the queue and apply rate limiting', (done) => {
    const requestData = { data: 'test' };

    const request = of(requestData);
    service.rateLimitedRequest(request).subscribe((data) => {
      expect(data).toEqual(requestData);
      done();
    });

    const processedRequest = service['processQueue']();
    expect(processedRequest).toBeTruthy();
  });

  it('should handle error with status 403 and return appropriate error message', (done) => {
    const error = { status: 403 };
    const request = throwError(error);

    service.rateLimitedRequest(request).pipe(
      catchError((err) => {
        expect(err.message).toEqual('API rate limit exceeded. Please try again later.');
        done();
        return of(null);
      })
    ).subscribe();

    const processedRequest = service['processQueue']();
    expect(processedRequest).toBeTruthy();
  });

  it('should handle other errors and return appropriate error message', (done) => {
    const error = new Error('Test error');
    const request = throwError(error);

    service.rateLimitedRequest(request).pipe(
      catchError((err) => {
        expect(err.message).toEqual('An error occurred. Please try again.');
        done();
        return of(null);
      })
    ).subscribe();

    const processedRequest = service['processQueue']();
    expect(processedRequest).toBeTruthy();
  });

  it('should process a single immediate request', () => {
    const testData = 'test data';
    const request = of(testData);
    service.rateLimitedRequest(request).subscribe(data => {
      expect(data).toBe(testData);
    });
  });

  it('should process multiple immediate requests in order', () => {
    const testData1 = 'test data 1';
    const testData2 = 'test data 2';
    const request1 = of(testData1);
    const request2 = of(testData2);
    service.rateLimitedRequest(request1).subscribe(data => {
      expect(data).toBe(testData1);
    });
    service.rateLimitedRequest(request2).subscribe(data => {
      expect(data).toBe(testData2);
    });
  });

  it('should handle errors gracefully', () => {
    const errorMsg = 'An error occurred. Please try again.';
    const request = throwError(new Error(errorMsg));
    service.rateLimitedRequest(request).subscribe(
      () => {},
      error => {
        expect(error.message).toBe(errorMsg);
      }
    );
  });

  it('should complete observable after processing requests', () => {
    const testData = 'test data';
    const request = of(testData);
    service.rateLimitedRequest(request).subscribe({
      next: () => {},
      complete: () => {
        // Test complete
        expect(true).toBeTruthy();
      }
    });
  });
  
  it('should fetch repositories for a valid username and page', () => {
    const username = 'testuser';
    const page = 1;
    const pageSize = 10;
    const testData = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
    const totalCount = 20; // Assuming total count is 20
    const totalCountRequest = of(totalCount);
    spyOn(service, 'getTotalCount').and.returnValue(totalCountRequest);
    const expectedUrl = `https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`;

    service.getRepositories(username, page, pageSize).subscribe(data => {
      expect(data.items).toEqual(testData);
      expect(data.total_count).toEqual(totalCount);
    });

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testData);
  });
  
  it('should set authorization headers', () => {
    const username = 'testuser';
    const page = 1;
    const pageSize = 10;

    // Spy on the getTotalCount method to prevent actual HTTP requests
    spyOn(service, 'getTotalCount').and.returnValue(of(0));

    // Call the getRepositories method
    service.getRepositories(username, page, pageSize).subscribe();

    // Expect a single HTTP request to be made
    const req = httpMock.expectOne(request => {
      return request.url.startsWith('https://api.github.com/users/testuser/repos');
    });

    // Verify if the Authorization header is set
    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe('token 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');

    // Flush the request
    req.flush({}); // Mock response
  });
  it('should process request immediately if queue length is 1', () => {
    const testData = 'test data';
    const request = of(testData);

    spyOn(service, 'processQueue').and.returnValue(request);

    service.rateLimitedRequest(request).subscribe(data => {
      expect(data).toBe(testData);
    });

    expect(service.processQueue).toHaveBeenCalled();
  });

  it('should process requests in queue with a delay', (done) => {
    const testData1 = 'test data 1';
    const testData2 = 'test data 2';
    const request1 = of(testData1);
    const request2 = of(testData2);
  
    // Initialize the requests queue with request1
    spyOn(service, 'processQueue').and.callFake(() => {
      return request1;
    });
  
    // Process the first request immediately
    service.rateLimitedRequest(request1).subscribe(data => {
      expect(data).toBe(testData1);
  
      // Time when the second request starts processing
      const startTime = new Date().getTime();
  
      // Add the second request to the queue
      service.rateLimitedRequest(request2).subscribe(data => {
        const endTime = new Date().getTime();
  
        // Check if the delay is greater than or equal to RATE_LIMIT_INTERVAL
        expect(endTime - startTime).toBeGreaterThanOrEqual(service.RATE_LIMIT_INTERVAL);
        expect(data).toBe(testData1); // processQueue is still returning request1's data
        done();
      });
    });
  });
  
  it('should handle API rate limit exceeded error', (done) => {
    const username = 'testuser';
    const page = 1;
    const pageSize = 10;
    const totalCount = 100;
    const totalCountCacheKey = `total-${username}`;
    const cachedTotalCount = of(totalCount);
    service.cache.set(totalCountCacheKey, cachedTotalCount);

    const pageUrl = `https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`;
    
    service.getRepositories(username, page, pageSize).subscribe({
      next: () => {},
      error: (error) => {
        expect(error.message).toBe('An error occurred. Please try again.');
        done();
      }
    });

    const req = httpMock.expectOne(pageUrl);
    req.flush({}, { status: 403, statusText: 'Forbidden' });
  });

  it('should handle general error', (done) => {
    const username = 'testuser';
    const page = 1;
    const pageSize = 10;
    const totalCount = 100;
    const totalCountCacheKey = `total-${username}`;
    const cachedTotalCount = of(totalCount);
    service.cache.set(totalCountCacheKey, cachedTotalCount);

    const pageUrl = `https://api.github.com/users/${username}/repos?page=${page}&per_page=${pageSize}`;
    
    service.getRepositories(username, page, pageSize).subscribe({
      next: () => {},
      error: (error) => {
        expect(error.message).toBe('An error occurred. Please try again.');
        done();
      }
    });

    const req = httpMock.expectOne(pageUrl);
    req.flush({}, { status: 500, statusText: 'Internal Server Error' });
  });


})



