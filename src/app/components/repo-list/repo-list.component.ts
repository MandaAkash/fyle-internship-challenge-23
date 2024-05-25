import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { GithubService } from 'src/app/services/github.service';

@Component({
  selector: 'app-repo-list',
  templateUrl: './repo-list.component.html',
  styleUrls: ['./repo-list.component.scss']
})
export class RepoListComponent implements OnChanges {
  errorMessage(errorMessage: any) {
    throw new Error('Method not implemented.');
  }
  @Input() repositories: any[] = [];
  @Input() loading: boolean = false;
  @Input() totalCount: number = 0;
  @Input() pageSize: number = 10;
  @Input() username: string = '';
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  currentPage: number = 1;
  avatarUrl: string = ''; 
  login: string = '';
  htmlUrl: string = '';
  location: string = '';
  twitterUserName: string = '';
  Bio: string='';
  constructor(private githubService: GithubService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['username']) {
      this.currentPage = 1;
      this.fetchRepositories(this.currentPage, this.pageSize);
      this.fetchUserDetails(); // Fetch user details when username changes
    }
  }
  fetchUserDetails() {
    this.githubService.getUserDetailsByUsername(this.username).subscribe(details => {
      this.avatarUrl = details.avatar_url;
      this.login = details.login;
      this.htmlUrl = details.html_url;
      this.location = details.location || "India";
      this.twitterUserName = details.twitterUserName || "https://x.com/JohnDOE";
    }, error => {
      this.avatarUrl = "";
      this.login = "";
      this.htmlUrl = "";
      this.location = "";
      this.twitterUserName = "";
    });
  }
  
  getArray(length: number): number[] {
    return Array(length).fill(0).map((_, index) => index);
  }

  fetchRepositories(page: number, pageSize: number) {
    this.loading = true;
    this.githubService.getRepositories(this.username, page, pageSize).subscribe(data => {
      this.repositories = data.items;
      this.totalCount = data.total_count;
      this.loading = false;
      this.cdr.detectChanges(); // Explicitly trigger change detection
    }, error => {
      this.repositories = [];
      this.loading = false;
      this.cdr.detectChanges(); // Explicitly trigger change detection
    });
  }

  onPageChange(page: number) {
    if (page < 1) {
      return; // Guard against navigating to page 0 or negative pages
    }
    this.currentPage = page;
    this.fetchRepositories(this.currentPage, this.pageSize);
    this.pageChange.emit(page); 
  }

  onPageSizeChange(newPageSize: number) {
    this.pageSize = newPageSize;
    this.currentPage = 1; // Reset to the first page when page size changes
    this.fetchRepositories(this.currentPage, this.pageSize);
  }
}
