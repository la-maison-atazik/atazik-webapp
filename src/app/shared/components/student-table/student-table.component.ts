import { Component, inject, OnInit } from "@angular/core";
import { StudentService } from "../../../core/services/student.service";
import { StudentRow } from "../../../core/models/tables-row/student-row.model";
import { mapStudentsToRows } from "../../../core/mappers/student-to-row.mapper";
import { TableModule, TableRowSelectEvent, TableRowUnSelectEvent } from "primeng/table";

@Component({
	selector: "app-student-table",
	imports: [TableModule],
	templateUrl: "./student-table.component.html",
	styleUrl: "./student-table.component.scss",
})
export class StudentTableComponent implements OnInit {
	private studentService = inject(StudentService);
	protected data: StudentRow[] = [];
	protected loading = false;

	protected selectedRow?: StudentRow;

	private unSelectedRow?: StudentRow;

	public ngOnInit(): void {
		this.unSelectedRow = undefined;
		this.selectedRow = undefined;
		this.studentService.studentList$.subscribe((responsibleList) => {
			this.data = mapStudentsToRows(responsibleList);
		});
	}

	onRowSelect($event: TableRowSelectEvent<StudentRow>) {
		this.selectedRow = $event.data as StudentRow;
	}

	onRowUnselect($event: TableRowUnSelectEvent<StudentRow>) {
		this.unSelectedRow = $event.data as StudentRow;
		this.selectedRow = undefined;
	}
}
