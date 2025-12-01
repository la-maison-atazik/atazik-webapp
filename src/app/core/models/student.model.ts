import { Activity } from "./activity.models";
import { PaymentMethod } from "./types/payment-method.type";
import { MeonOfPayment } from "./types/mean-of-payment.type";
import { Timestamp } from "firebase/firestore";

export interface Student {
  uid?: string;
  lastName: string;
  firstName: string;
  birthDate: Date | Timestamp;
  isStudentResponsible: boolean;
  responsible: string;
  consents: {
    insuranceRC: boolean;
    internalRules: boolean;
    imageRight: boolean;
    helpEvent: boolean;
  };
  activities: Activity[];
  paymentMethod?: PaymentMethod;
  meanOfPayment?: MeonOfPayment[];
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function studentFromFormRegistration(form: any, responsibleUid: string): StudentNoUid {
  return {
    lastName: form.student.lastName.trim(),
    firstName: form.student.firstName.trim(),
    birthDate: form.student.birthDate ? new Date(form.student.birthDate) : new Date(),
    responsible: responsibleUid,
    isStudentResponsible: form.responsible.isStudentResponsible,
    consents: {
      insuranceRC: form.consents.insuranceRC || false,
      internalRules: form.consents.internalRules || false,
      imageRight: form.consents.imageRight || false,
      helpEvent: form.consents.helpEvent || false,
    },
    activities: form.activities || [],
    meanOfPayment: form.payment.meanOfPayment || [],
    paymentMethod: form.payment.method || "1x",
    comments: form.comments.trim() || "",
    createdAt: form.audit.createdAt || new Date(),
    createdBy: form.audit.createdBy,
  };
}

export type StudentNoUid = Omit<Student, "uid">;
