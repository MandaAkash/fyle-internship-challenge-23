import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepoListComponent } from './repo-list.component';
import { GithubService } from 'src/app/services/github.service';
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppModule } from 'src/app/app.module';
import { By } from '@angular/platform-browser';
import { PaginationComponent } from '../pagination/pagination.component';
describe('RepoListComponent', () => {
  let component: RepoListComponent;
  let fixture: ComponentFixture<RepoListComponent>;
  let githubService: jasmine.SpyObj<GithubService>;

  beforeEach(async () => {
    const githubServiceSpy = jasmine.createSpyObj('GithubService', ['getUserDetailsByUsername', 'getRepositories']);
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ RepoListComponent ],
      providers: [
        { provide: GithubService, useValue: githubServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    githubService = TestBed.inject(GithubService) as jasmine.SpyObj<GithubService>;

    // Mock the return value of getUserDetailsByUsername to return an observable
    githubService.getUserDetailsByUsername.and.returnValue(of({
      avatar_url: 'testAvatarUrl',
      login: 'Test User',
      html_url: 'testHtmlUrl',
      location: 'Test Location',
      twitterUserName: 'testTwitter'
    }));
    
    githubService.getRepositories.and.returnValue(of({
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //Test1
  it('should fetch user details when username changes', () => {              
    const userDetails = {
      avatar_url: "https://avatars.githubusercontent.com/u/92689183?v=4",
      login: "MandaAkash",
      html_url: "https://github.com/MandaAkash",
      location: "India",
      twitterUserName: "https://x.com/JohnDOE"
    };
    
    // Mocking the service method to return observable
    githubService.getUserDetailsByUsername.and.returnValue(of(userDetails));
    
    component.username = 'MandaAkash';
    // Manually calling ngOnChanges as it won't be called automatically in tests
    component.ngOnChanges({ username: { currentValue: 'MandaAkash', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    
    fixture.detectChanges(); // Ensure Angular processes the changes

    // Check if the service method was called with the correct argument
    expect(githubService.getUserDetailsByUsername).toHaveBeenCalledWith('MandaAkash');
    // Check if the component properties are updated with the mocked data
    expect(component.avatarUrl).toBe("https://avatars.githubusercontent.com/u/92689183?v=4");
    expect(component.login).toBe("MandaAkash");
    expect(component.htmlUrl).toBe("https://github.com/MandaAkash");
    expect(component.location).toBe("India");
    expect(component.twitterUserName).toBe("https://x.com/JohnDOE");
  });

  //Test2
  it('should fetch repositories when username changes', () => {          
    const repositories = {
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    };
    githubService.getRepositories.and.returnValue(of(repositories));

    component.username = 'MandaAkash';
    component.ngOnChanges({ username: { currentValue: 'MandaAkash', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges(); // Ensure Angular processes the changes

    expect(githubService.getRepositories).toHaveBeenCalledWith('MandaAkash', 1, 10);
    expect(component.repositories.length).toBe(2);
    expect(component.totalCount).toBe(2);
  });
  //Test3
  it('should change page when onPageChange is called', () => {      
    const repositories = {
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    };
    githubService.getRepositories.and.returnValue(of(repositories));

    component.username = 'MandaAkash';
    component.onPageChange(2);
    fixture.detectChanges(); // Ensure Angular processes the changes

    expect(githubService.getRepositories).toHaveBeenCalledWith('MandaAkash', 2, 10);
    expect(component.currentPage).toBe(2);
  });
  //Test4
  it('should change page size and reset page when onPageSizeChange is called', () => {
    const repositories = {
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    };
    githubService.getRepositories.and.returnValue(of(repositories));

    component.username = 'MandaAkash';
    component.onPageSizeChange(20);
    fixture.detectChanges(); // Ensure Angular processes the changes

    expect(githubService.getRepositories).toHaveBeenCalledWith('MandaAkash', 1, 20);
    expect(component.pageSize).toBe(20);
    expect(component.currentPage).toBe(1);
  });

   //Test5
  it('should render the component', () => {               
    expect(component).toBeTruthy();
  });
  
  //Test6
  it('should show skeleton loader during loading state', () => { 
    component.username = 'testUser';
    component.loading = true;
    fixture.detectChanges();
    const skeletonLoaderElement = fixture.nativeElement.querySelector('.repo-item-skeleton');
    expect(skeletonLoaderElement).toBeTruthy();
    const skeletonLoaderElements = fixture.nativeElement.querySelectorAll('.repo-item-skeleton');
    expect(skeletonLoaderElements.length).toEqual(10); // Assuming 10 skeleton loaders are rendered
  });
  
  //Test7
  it('should handle error when fetching user details', () => {   
    // Mock the service method to return an error
    githubService.getUserDetailsByUsername.and.returnValue(throwError('Error fetching user details'));
  
    component.username = 'invalidusername';
    component.ngOnChanges({ username: { currentValue: 'invalidusername', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges(); // Ensure Angular processes the changes
  
    expect(component.avatarUrl).toBe('');
    expect(component.login).toBe("");
    expect(component.htmlUrl).toBe("");
    expect(component.location).toBe("");
    expect(component.twitterUserName).toBe("");
  });
  
  //Test8
  it('should handle error when fetching repositories', () => {   
    // Mock the service method to return an error
    githubService.getRepositories.and.returnValue(throwError('Error fetching repositories'));
  
    component.username = 'invalidusername';
    component.ngOnChanges({ username: { currentValue: 'invalidusername', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges(); // Ensure Angular processes the changes
  
    expect(component.repositories.length).toBe(0);
    expect(component.totalCount).toBe(0);
  });

  //Test9
  it('should display no message when repositories are empty', () => {    
    // Mock the service method to return an empty list of repositories
    githubService.getRepositories.and.returnValue(of({ items: [], total_count: 0 }));

    component.username = 'MandaAkash';
    component.ngOnChanges({
      username: {
        currentValue: 'MandaAkash',
        previousValue: undefined,
        isFirstChange: () => true,
        firstChange: true
      }
    });
    fixture.detectChanges(); // Ensure Angular processes the changes

    // Check if the no repositories message is displayed
    const noRepositoriesMessage = fixture.nativeElement.querySelector('div.flex.items-center.justify-center.h-full.w-full p');
    expect(noRepositoriesMessage).toBeTruthy();
    expect(noRepositoriesMessage.textContent).toBe('');
  });
  
  
  //Test10
  it('should display user details when username and repositories are present', () => {   //Test10
    component.username = 'MandaAkash';
    component.ngOnChanges({ username: { currentValue: 'MandaAkash', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges(); // Ensure Angular processes the changes
  
    const avatarElement = fixture.nativeElement.querySelector('img');
    const loginElement = fixture.nativeElement.querySelector('h2');
    const htmlUrlElement = fixture.nativeElement.querySelector('a');
    const Bio=fixture.nativeElement.querySelector('p');
    const location=fixture.nativeElement.querySelector('p')
    const twitterLinkElement = fixture.nativeElement.querySelector('p a');
    expect(twitterLinkElement).toBeTruthy();
    expect(location).toBeTruthy();
    expect(Bio).toBeTruthy();
    expect(avatarElement).toBeTruthy();
    expect(loginElement).toBeTruthy();
    expect(htmlUrlElement).toBeTruthy();
  });

  //Test11
  it('should emit pageChange event when onPageChange is called', () => {    //Test11
    spyOn(component.pageChange, 'emit');
  
    component.onPageChange(2);
    fixture.detectChanges(); // Ensure Angular processes the changes
  
    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });
  
  //Test12
  it('should interact correctly with pagination component', () => {  
    // Mock dependencies
    const githubServiceSpy = jasmine.createSpyObj('GithubService', ['getUserDetailsByUsername', 'getRepositories']);
    // Mock user details and repositories
    const userDetails = {
      avatar_url: "https://avatars.githubusercontent.com/u/92689183?v=4",
      login: "MandaAkash",
      html_url: "https://github.com/MandaAkash",
      location: "India",
      twitterUserName: "https://twitter.com/testuser"
    };
    const repositories = {
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    };
    githubServiceSpy.getUserDetailsByUsername.and.returnValue(of(userDetails));
    githubServiceSpy.getRepositories.and.returnValue(of(repositories));
    // Set username
    component.username = 'MandaAkash';
    // Trigger ngOnChanges manually
    component.ngOnChanges({ username: { currentValue: 'MandaAkash', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges();
    // Simulate pagination events
    spyOn(component, 'onPageChange');
    spyOn(component, 'onPageSizeChange');
  
    // Retrieve pagination component instance
    const paginationComponent = fixture.debugElement.query(By.directive(PaginationComponent)).componentInstance;
  
    // Trigger page change event
    paginationComponent.pageChange.emit(2);
    fixture.detectChanges();
  
    // Assert that onPageChange method is called with the correct page number
    expect(component.onPageChange).toHaveBeenCalledWith(2);
  
    // Trigger page size change event
    paginationComponent.pageSizeChange.emit(20);
    fixture.detectChanges();
  
    // Assert that onPageSizeChange method is called with the correct page size
    expect(component.onPageSizeChange).toHaveBeenCalledWith(20);
  });
  
  //Test13
  it('should display list of repositories with correct number of items', () => {   //Test14
    const repositories = {
      items: [{ name: 'repo1' }, { name: 'repo2' }],
      total_count: 2
    };
    githubService.getRepositories.and.returnValue(of(repositories));
  
    component.username = 'MandaAkash';
    component.ngOnChanges({ username: { currentValue: 'MandaAkash', previousValue: undefined, isFirstChange: () => true, firstChange: true } });
    fixture.detectChanges(); // Ensure Angular processes the changes
  
    const repoItems = fixture.nativeElement.querySelectorAll('app-repo-item');
    expect(repoItems.length).toBe(2); // Assuming 2 repositories are fetched
  });
  
  //Test14
  it('should prompt user to input a username when username is empty or null', () => {
    component.username = '';
    fixture.detectChanges();
    const promptMessage = fixture.nativeElement.querySelector('.flex.items-center.justify-center.mt-12');
    expect(promptMessage).toBeTruthy();
    expect(promptMessage.textContent.trim()).toBe('See Your Git Repositories Here By Searching 👆');
  });
  
  //Test15
  it('should navigate to the first page when navigating to a page before the first page', () => {
    component.onPageChange(0);
    fixture.detectChanges();
  
    expect(component.currentPage).toBe(1);
  });
  
  //Test16
  it('should navigate to the last page when navigating to a page beyond the available data', () => {
    const totalCount = 20;
    const pageSize = 5; 
    const totalPages = Math.ceil(totalCount / pageSize);
    component.totalCount = totalCount;
    component.onPageChange(totalPages);
    fixture.detectChanges();
    expect(component.currentPage).toBe(totalPages);
  });
  
});
