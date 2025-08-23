export interface Responsible {
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
