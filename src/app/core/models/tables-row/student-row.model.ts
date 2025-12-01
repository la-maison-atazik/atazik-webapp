import { Student } from "../student.model";

export interface StudentRow {
  uid?: string;
  displayName: string;
  age: number;
  isStudentResponsible: boolean;
  student: Student;
}
