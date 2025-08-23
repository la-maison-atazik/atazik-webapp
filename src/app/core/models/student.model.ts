import { Responsible } from "./responsible.model";
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
	currentYear: string;
	responsible: Responsible;
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
	createdAt: Date;
	updatedAt?: Date;
	createdBy: string;
	updatedBy?: string;
}

export function studentFromFormRegistration(form: any): StudentNoUid {
	return {
		lastName: form.student.lastName,
		firstName: form.student.firstName,
		birthDate: form.student.birthDate ? new Date(form.student.birthDate) : new Date(),
		isStudentResponsible: form.responsible.isStudentResponsible,
		currentYear: form.currentYear,
		responsible: {
			firstName: form.responsible.firstName,
			lastName: form.responsible.lastName,
			email: form.responsible.email,
			phone: form.responsible.phone,
			address: form.responsible.address,
			city: form.responsible.city,
			postalCode: form.responsible.postalCode,
			createdAt: form.audit.createdAt || new Date(),
			createdBy: form.audit.createdBy,
		},
		consents: {
			insuranceRC: form.consents.insuranceRC || false,
			internalRules: form.consents.internalRules || false,
			imageRight: form.consents.imageRight || false,
			helpEvent: form.consents.helpEvent || false,
		},
		activities: form.activities || [],
		meanOfPayment: form.payment.meanOfPayment || [],
		paymentMethod: form.payment.method || "1x",
		comments: form.comments || "",
		createdAt: form.audit.createdAt || new Date(),
		createdBy: form.audit.createdBy,
	};
}

export type StudentNoUid = Omit<Student, "uid">;
