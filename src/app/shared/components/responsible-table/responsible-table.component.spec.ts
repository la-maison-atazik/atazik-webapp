import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ResponsibleTableComponent } from "./responsible-table.component";

describe("ResponsibleTableComponent", () => {
	let component: ResponsibleTableComponent;
	let fixture: ComponentFixture<ResponsibleTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ResponsibleTableComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(ResponsibleTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
