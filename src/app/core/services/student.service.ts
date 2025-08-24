import { inject, Injectable } from "@angular/core";
import { collection, collectionData, Firestore } from "@angular/fire/firestore";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { BehaviorSubject, Observable } from "rxjs";
import { Student } from "../models/student.model";

@Injectable({
	providedIn: "root",
	deps: [Firestore],
})
export class StudentService {
	private firestore = inject(Firestore);
	private studentListSubject = new BehaviorSubject<Student[]>([]);
	studentList$ = this.studentListSubject.asObservable();

	constructor() {
		this.listenToCollection();
	}

	private listenToCollection() {
		const ref = collection(this.firestore, FirestoreCollectionsEnum.STUDENT + "/2025-2026/records");
		const studentList$: Observable<Student[]> = collectionData(ref, { idField: "uid" }) as Observable<Student[]>;

		studentList$.subscribe((studentList) => {
			this.studentListSubject.next(studentList.map((student) => ({ ...student })));
		});
	}

	get currentStudentList(): Student[] {
		return this.studentListSubject.value;
	}
}
