import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {
  @Input() totalCount: number = 0;
  @Input() pageSize: number = 10;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageSizes = [5, 10, 15, 20,30,50,100];
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes)
    if (changes['totalCount'] || changes['pageSize']) {
      this.calculateTotalPages();
      this.validateCurrentPage();
      this.generatePageNumbersArray();
    }
  }
  generatePageNumbersArray() {
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }


  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
  }

  validateCurrentPage() {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(this.currentPage);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }
}
