import { Student } from "../models/student.model";
import { StudentRow } from "../models/tables-row/student-row.model";
import { calculateAgeFromTimestamp } from "@shared/utils/age.utils";
import { Timestamp } from "firebase/firestore";

export function mapStudentToRow(student: Student): StudentRow {
  return {
    uid: student.uid,
    displayName: `${student.firstName} ${student.lastName}`,
    age: calculateAgeFromTimestamp(student.birthDate as Timestamp),
    isStudentResponsible: student.isStudentResponsible,
    student: student,
  };
}

export function mapStudentsToRows(user: Student[]): StudentRow[] {
  return user.map(mapStudentToRow);
}
