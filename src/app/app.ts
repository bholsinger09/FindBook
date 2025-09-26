import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SearchPage } from './features/book-search/pages/search-page/search-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SearchPage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('FindBook');

  ngOnInit() {
    console.log('App component initialized');
  }
}
