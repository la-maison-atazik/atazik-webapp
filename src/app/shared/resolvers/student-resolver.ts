import { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { Student } from "../../core/models/student.model";
import { StudentService } from "../../core/services/student.service";
import { inject } from "@angular/core";
import { filter, map, take } from "rxjs/operators";

export const studentResolver: ResolveFn<Student | undefined> = (route: ActivatedRouteSnapshot) => {
  const studentService = inject(StudentService);

  const uid = route.paramMap.get("uid");
  if (!uid) return undefined;

  // If already loaded in memory, return immediately
  const existing = studentService.currentStudentList.find((s) => s.uid === uid);
  if (existing) {
    return existing;
  }

  // Otherwise wait until the list contains the student and return it (resolver will wait)
  return studentService.studentList$.pipe(
    map((list) => list.find((s) => s.uid === uid)),
    filter((s): s is Student => !!s),
    take(1),
    map((s) => {
      return s;
    }),
  );
};
