import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'fyle-frontend-challenge'; // Updated title property
  username: string = '';

  onSearch(username: string) {
    this.username = username;
  }
}
