export interface Responsible {
	uid?: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	postalCode: string;
	createdAt: Date;
	updatedAt?: Date;
	createdBy: string;
	updatedBy?: string;
}

export type PartialResponsible = Partial<Responsible>;

export type ResponsibleNoUid = Omit<Responsible, "uid">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function responsibleFromFormRegistration(form: any): ResponsibleNoUid {
	return {
		firstName: form.responsible.firstName.trim(),
		lastName: form.responsible.lastName.trim(),
		email: form.responsible.email.trim(),
		phone: form.responsible.phone.trim() || "",
		address: form.responsible.address.trim() || "",
		city: form.responsible.city.trim() || "",
		postalCode: form.responsible.postalCode.trim() || "",
		createdAt: form.audit.createdAt || new Date(),
		createdBy: form.audit.createdBy,
	};
}
