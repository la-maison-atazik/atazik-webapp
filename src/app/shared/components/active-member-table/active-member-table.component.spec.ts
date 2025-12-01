import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActiveMemberTableComponent } from "./active-member-table.component";

describe("ResponsibleTableComponent", () => {
  let component: ActiveMemberTableComponent;
  let fixture: ComponentFixture<ActiveMemberTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveMemberTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveMemberTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
