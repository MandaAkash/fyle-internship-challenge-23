import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaginationComponent],
      imports: [FormsModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total pages when totalCount changes', () => {
    component.totalCount = 20;
    component.pageSize = 5;
    component.ngOnChanges({
      totalCount: {
        previousValue: 0,
        currentValue: 20,
        isFirstChange: () => false,
        firstChange: false
      }
    });
    expect(component.totalPages).toBe(4);
  });

  it('should generate page numbers array when pageSize changes', () => {
    component.totalCount = 20;
    component.pageSize = 5;
    component.ngOnChanges({
      pageSize: {
        previousValue: 10,
        currentValue: 5,
        isFirstChange: () => false,
        firstChange: false
      }
    });
    expect(component.totalPagesArray.length).toBe(4);
    expect(component.totalPagesArray[0]).toBe(1);
    expect(component.totalPagesArray[1]).toBe(2);
    expect(component.totalPagesArray[2]).toBe(3);
    expect(component.totalPagesArray[3]).toBe(4);
  });
  it('should set current page to 1 if current page is less than 1', () => {
    component.currentPage = -1;
    component.validateCurrentPage();
    expect(component.currentPage).toEqual(1);
  });

  it('should set current page to total pages if current page is greater than total pages', () => {
    component.totalPages = 10;
    component.currentPage = 15; // Current page is greater than total pages
    component.validateCurrentPage();
    expect(component.currentPage).toEqual(component.totalPages);
  });

  it('should not change current page if it is within valid range', () => {
    component.totalPages = 10;
    component.currentPage = 5; // Current page is within valid range
    component.validateCurrentPage();
    expect(component.currentPage).toEqual(5);
  });

  it('should emit pageSizeChange event when page size changes', () => {
    const newPageSize = 20;
    spyOn(component.pageSizeChange, 'emit');
  
    component.pageSize = newPageSize;
    component.onPageSizeChange();
  
    expect(component.pageSizeChange.emit).toHaveBeenCalledWith(newPageSize);
  });

  it('should emit pageChange event when page changes', () => {
    const newPage = 1;
    spyOn(component.pageChange, 'emit');
    component.onPageChange(newPage);
    expect(component.pageChange.emit).toHaveBeenCalledWith(newPage);
  });
  
  it('should call onPageSizeChange method when page size dropdown value changes', () => {
    const spy = spyOn(component, 'onPageSizeChange').and.callThrough();
    const selectElement = fixture.nativeElement.querySelector('select');
  
    selectElement.value = '20'; // Change the value of the select element
    selectElement.dispatchEvent(new Event('change')); // Dispatch change event
  
    expect(spy).toHaveBeenCalled();
  });

  it('should call onPageChange method with correct page number when previous page button is clicked', () => {
    const spy = spyOn(component, 'onPageChange');
    const previousPageButton = fixture.nativeElement.querySelector('.pagination button:first-child');
  
    previousPageButton.click();
  
    expect(spy).toHaveBeenCalledWith(component.currentPage - 1);
  });  
  
  it('should call onPageChange method with correct page number when next page button is clicked', () => {
    const spy = spyOn(component, 'onPageChange');
    const nextPageButton = fixture.nativeElement.querySelector('.pagination button:last-child');
  
    nextPageButton.click();
  
    expect(spy).toHaveBeenCalledWith(component.currentPage + 1);
  });

  it('should handle case when totalCount is 0', () => {
    component.totalCount = 0;
    component.pageSize = 5;
    component.ngOnChanges({
      totalCount: {
        previousValue: 10,
        currentValue: 0,
        isFirstChange: () => false,
        firstChange: false
      }
    });
    expect(component.totalPages).toBe(0);
    expect(component.totalPagesArray.length).toBe(0);
  });  
});
