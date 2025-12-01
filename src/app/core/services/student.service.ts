import { inject, Injectable } from "@angular/core";
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
} from "@angular/fire/firestore";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { BehaviorSubject, Observable } from "rxjs";
import { Student, StudentNoUid } from "../models/student.model";

@Injectable({
  providedIn: "root",
  deps: [Firestore],
})
export class StudentService {
  private firestore = inject(Firestore);
  private studentListSubject = new BehaviorSubject<Student[]>([]);
  studentList$ = this.studentListSubject.asObservable();

  public selectedStudent?: Student;

  constructor() {
    this.listenToCollection();
  }

  private listenToCollection() {
    const ref = collection(this.firestore, FirestoreCollectionsEnum.STUDENT + "/2025-2026/records");
    const studentList$: Observable<Student[]> = collectionData(ref, {
      idField: "uid",
    }) as Observable<Student[]>;

    studentList$.subscribe((studentList) => {
      this.studentListSubject.next(studentList.map((student) => ({ ...student })));
    });
  }

  get currentStudentList(): Student[] {
    return this.studentListSubject.value;
  }

  async update(uid: string, payload: StudentNoUid) {
    try {
      if (!uid) {
        throw new Error("Student UID is required for update.");
      }
      const ref = collection(
        this.firestore,
        FirestoreCollectionsEnum.STUDENT + "/2025-2026/records",
      );
      const docRef = doc(ref, uid).withConverter({
        toFirestore: (data: StudentNoUid) => data,
        fromFirestore: (snap) => snap.data() as Student,
      });
      await updateDoc(docRef, payload);
    } catch (e) {
      console.error(e);
    }
  }

  async delete(uid: string) {
    try {
      if (!uid) {
        throw new Error("Student UID is required for delete.");
      }
      const ref = collection(
        this.firestore,
        FirestoreCollectionsEnum.STUDENT + "/2025-2026/records",
      );
      const docRef = doc(ref, uid);
      await deleteDoc(docRef);
    } catch (e) {
      console.error(e);
    }
  }
}
