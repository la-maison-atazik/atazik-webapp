import { inject, Injectable } from "@angular/core";
import { collection, collectionData, Firestore } from "@angular/fire/firestore";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { BehaviorSubject, Observable } from "rxjs";
import { PartialResponsible, Responsible } from "../models/responsible.model";

@Injectable({
	providedIn: "root",
	deps: [Firestore],
})
export class ResponsibleService {
	private firestore = inject(Firestore);
	private responsibleListSubject = new BehaviorSubject<Responsible[]>([]);
	responsibleList$ = this.responsibleListSubject.asObservable();

	constructor() {
		this.listenToCollection();
	}

	private listenToCollection() {
		const ref = collection(this.firestore, FirestoreCollectionsEnum.RESPONSIBLE);
		const responsibleList$: Observable<Responsible[]> = collectionData(ref, { idField: "uid" }) as Observable<
			Responsible[]
		>;

		responsibleList$.subscribe((responsibleList) => {
			this.responsibleListSubject.next(responsibleList);
		});
	}

	get currentResponsibleList(): Responsible[] {
		return this.responsibleListSubject.value;
	}

	public researchPossibleResponsible(partialResponsible: PartialResponsible): Responsible[] {
		return this.currentResponsibleList.filter((responsible) => {
			let isMatch = true;
			if (partialResponsible.firstName) {
				isMatch = isMatch && responsible.firstName.toLowerCase().includes(partialResponsible.firstName.toLowerCase());
			}
			if (partialResponsible.lastName) {
				isMatch = isMatch && responsible.lastName.toLowerCase().includes(partialResponsible.lastName.toLowerCase());
			}
			if (partialResponsible.email) {
				isMatch = isMatch && responsible.email.toLowerCase().includes(partialResponsible.email.toLowerCase());
			}
			if (partialResponsible.phone) {
				isMatch = isMatch && responsible.phone.toLowerCase().includes(partialResponsible.phone.toLowerCase());
			}
			if (partialResponsible.address) {
				isMatch = isMatch && responsible.address.toLowerCase().includes(partialResponsible.address.toLowerCase());
			}
			if (partialResponsible.city) {
				isMatch = isMatch && responsible.city.toLowerCase().includes(partialResponsible.city.toLowerCase());
			}
			if (partialResponsible.postalCode) {
				isMatch = isMatch && responsible.postalCode.toLowerCase().includes(partialResponsible.postalCode.toLowerCase());
			}
			return isMatch;
		});
	}

	getById(responsible: string) {
		return this.currentResponsibleList.find((resp) => resp.uid === responsible);
	}
}
