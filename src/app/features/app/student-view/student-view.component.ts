import { Component, OnInit } from "@angular/core";
import { Student } from "../../../core/models/student.model";

@Component({
	selector: "app-student-view",
	imports: [],
	templateUrl: "./student-view.component.html",
	styleUrl: "./student-view.component.scss",
})
export class StudentViewComponent implements OnInit {
	protected student?: Student;

	public ngOnInit() {
		console.log(this.student);
	}
}
