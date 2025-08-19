import { Responsible } from "./responsible.model";
import { Activity } from "./activity.models";
import { PaymentMethod } from "./types/payment-method.type";
import { MeonOfPayment } from "./types/mean-of-payment.type";

export interface SubscriberAtazik {
	uid?: string;
	lastName: string;
	firstName: string;
	birthDate: Date;
	isStudentResponsible: boolean;
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

export function subscriberFromFormRegistration(
	form: any,
	subscriberId?: string,
	responsibleId?: string,
): SubscriberAtazik {
	return {
		uid: subscriberId || undefined,
		lastName: form.student.lastName,
		firstName: form.student.firstName,
		birthDate: form.student.birthDate ? new Date(form.student.birthDate) : new Date(),
		isStudentResponsible: form.responsible.isStudentResponsible,
		responsible: {
			uid: responsibleId || undefined,
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
