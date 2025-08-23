import { inject, Injectable } from "@angular/core";
import { collection, collectionData, Firestore } from "@angular/fire/firestore";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { BehaviorSubject, Observable } from "rxjs";
import { Responsible } from "../models/responsible.model";

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
		const responsibleList$: Observable<Responsible[]> = collectionData(ref) as Observable<Responsible[]>;

		responsibleList$.subscribe((responsibleList) => {
			this.responsibleListSubject.next(responsibleList);
		});
	}

	get currentResponsibleList(): Responsible[] {
		return this.responsibleListSubject.value;
	}
}
