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

export type ResponsibleNoUid = Omit<Responsible, "uid">;

export function responsibleFromFormRegistration(form: any): ResponsibleNoUid {
	return {
		firstName: form.responsible.firstName,
		lastName: form.responsible.lastName,
		email: form.responsible.email,
		phone: form.responsible.phone || "",
		address: form.responsible.address || "",
		city: form.responsible.city || "",
		postalCode: form.responsible.postalCode || "",
		createdAt: form.audit.createdAt || new Date(),
		createdBy: form.audit.createdBy,
	};
}
