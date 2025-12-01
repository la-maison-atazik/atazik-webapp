import { Component, inject, OnInit } from "@angular/core";
import { StudentService } from "../../../core/services/student.service";
import { StudentRow } from "../../../core/models/tables-row/student-row.model";
import { mapStudentsToRows } from "../../../core/mappers/student-to-row.mapper";
import { TableModule, TableRowSelectEvent, TableRowUnSelectEvent } from "primeng/table";
import { Router } from "@angular/router";
import { Button } from "primeng/button";
import { Ripple } from "primeng/ripple";

@Component({
  selector: "app-student-table",
  imports: [TableModule, Button, Ripple],
  templateUrl: "./student-table.component.html",
  styleUrl: "./student-table.component.scss",
})
export class StudentTableComponent implements OnInit {
  private studentService = inject(StudentService);
  private router = inject(Router);
  protected data: StudentRow[] = [];
  protected loading = false;

  protected selectedRow?: StudentRow;

  private unSelectedRow?: StudentRow;

  public ngOnInit(): void {
    this.unSelectedRow = undefined;
    this.selectedRow = undefined;
    this.studentService.selectedStudent = undefined;
    this.studentService.studentList$.subscribe((responsibleList) => {
      this.data = mapStudentsToRows(responsibleList);
    });
  }

  protected onRowSelect($event: TableRowSelectEvent<StudentRow>) {
    this.selectedRow = $event.data as StudentRow;
  }

  protected onRowUnselect($event: TableRowUnSelectEvent<StudentRow>) {
    this.unSelectedRow = $event.data as StudentRow;
    this.selectedRow = undefined;
    this.studentService.selectedStudent = this.unSelectedRow.student;
    this.router.navigate(["/app/student-view"]);
  }

  protected viewStudent(studentRow: StudentRow): void {
    this.studentService.selectedStudent = studentRow.student;
    this.router.navigate(["/app/student-view"]);
  }
}
