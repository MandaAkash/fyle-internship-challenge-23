import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepoItemComponent } from './repo-item.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('RepoItemComponent', () => {
  let component: RepoItemComponent;
  let fixture: ComponentFixture<RepoItemComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RepoItemComponent],
      imports: [HttpClientTestingModule]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // After each test, verifying that there are no outstanding HTTP requests.
    httpTestingController.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch languages and repo properly', () => {
    // Mock data for the repo and languages
    const mockRepo = {
      name: 'Test Repo',
      languages_url: 'https://api.github.com/repos/testowner/testrepo/languages'
    };
    const mockLanguages = {
      'JavaScript': 1000,
      'TypeScript': 500
    };
    component.repo = mockRepo;
    component.ngOnInit();
    const req = httpTestingController.expectOne(mockRepo.languages_url);
    expect(req.request.method).toEqual('GET');
    req.flush(mockLanguages);
    expect(component.languages.length).toEqual(Object.keys(mockLanguages).length);
    expect(component.languages[0].name).toEqual('JavaScript');
    expect(component.languages[0].value).toEqual(1000);
    expect(component.languages[1].name).toEqual('TypeScript');
    expect(component.languages[1].value).toEqual(500);
  });
});
