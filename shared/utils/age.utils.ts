import { Timestamp } from "firebase/firestore";

export function calculateAge(birthDate: Date): number {
	if (!birthDate) return 0;
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	const dayDiff = today.getDate() - birthDate.getDate();
	if (monthDiff < 0 || (monthDiff === 0 && dayDiff > 0)) {
		age--;
	}
	return age;
}

export function calculateAgeFromTimestamp(aBirthDate: Timestamp): number {
	if (!aBirthDate) return 0;
	const birthDate = (aBirthDate as Timestamp).toDate();
	return calculateAge(birthDate);
}
