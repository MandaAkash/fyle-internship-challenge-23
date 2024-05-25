import { Component, Input, OnInit } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { config } from 'src/app/configuration';
@Component({
  selector: 'app-repo-item',
  templateUrl: './repo-item.component.html',
  styleUrls: ['./repo-item.component.scss']
})
export class RepoItemComponent implements OnInit {
  @Input() repo: any;
  private authHeaders = new HttpHeaders({
    'Authorization': `token ${config.githubToken}`
  });
  languages: { name: string, value: number }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchLanguages();
  }

  fetchLanguages(): void {
    if (this.repo && this.repo.languages_url) {
      this.http.get<{ [key: string]: number }>(this.repo.languages_url, { headers: this.authHeaders }).subscribe((data: { [key: string]: number }) => {
        this.languages = Object.keys(data).map(key => ({ name: key, value: data[key] }));
      });
    }
  }
}
