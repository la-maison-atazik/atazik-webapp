import { Component, inject, OnInit } from "@angular/core";
import { StudentService } from "../../../core/services/student.service";
import { StudentRow } from "../../../core/models/tables-row/student-row.model";
import { mapStudentsToRows } from "../../../core/mappers/student-to-row.mapper";
import { TableModule, TableRowSelectEvent, TableRowUnSelectEvent } from "primeng/table";
import { Router } from "@angular/router";
import { Button } from "primeng/button";
import { Ripple } from "primeng/ripple";
import { Card } from "primeng/card";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Toolbar } from "primeng/toolbar";

@Component({
  selector: "app-student-table",
  imports: [TableModule, Button, Ripple, Card, IconField, InputIcon, InputText, Toolbar],
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
    this.studentService.studentList$.subscribe((responsibleList) => {
      this.data = mapStudentsToRows(responsibleList);
    });
  }

  protected goToNewRegistration() {
    this.router.navigate(["/app/new-registration"]);
  }

  protected onRowSelect($event: TableRowSelectEvent<StudentRow>) {
    this.selectedRow = $event.data as StudentRow;
  }

  protected onRowUnselect($event: TableRowUnSelectEvent<StudentRow>) {
    this.unSelectedRow = $event.data as StudentRow;
    this.selectedRow = undefined;
    this.router.navigate([`/app/student-view/${this.unSelectedRow.student.uid}`]);
  }

  protected viewStudent(studentRow: StudentRow): void {
    this.router.navigate([`/app/student-view/${studentRow.student.uid}`]);
  }
}
