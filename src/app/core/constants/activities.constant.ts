import { ActivityCategory } from "../../features/app/new-registration/new-registration.component";

export const ACTIVITIES_CATALOG: ActivityCategory[] = [
	{
		id: "adult_song",
		name: "Chant adultes",
		options: [
			{ label: "Forfait 30 cours (1h)", price: 690 },
			{ label: "Forfait 15 cours (1h)", price: 360 },

			{ label: "Cours en groupe (1h)", price: 360 },
		],
	},
	{
		id: "children_song",
		name: "Chant enfants (-12 ans)",
		options: [
			{ label: "Groupe (1h)", price: 240 },
			{ label: "Duo (1h)", price: 345 },
			{ label: "Solo (30 min)", price: 345 },
		],
	},
	{
		id: "guitar",
		name: "Guitare",
		options: [
			{ label: "30 cours (30 min)", price: 420 },
			{ label: "15 cours (30 min)", price: 225 },
			{ label: "Groupe (2 à 4 pers.) 30 cours (30 min)", price: 225 },
		],
	},
	{
		id: "batterie",
		name: "Batterie",
		options: [
			{ label: "30 cours (30 min)", price: 420 },
			{ label: "15 cours (30 min)", price: 225 },
		],
	},
	{
		id: "bass",
		name: "Basse",
		options: [
			{ label: "30 cours (30 min)", price: 420 },
			{ label: "15 cours (30 min)", price: 225 },
			{ label: "Groupe 30 cours (30 min)", price: 225 },
		],
	},
	{
		id: "piano",
		name: "Piano",
		options: [
			{ label: "30 cours (30 min)", price: 420 },
			{ label: "15 cours (30 min)", price: 225 },
		],
	},
	{
		id: "supervised_rehearsals",
		name: "Répétitions encadrées",
		options: [{ label: "30 cours (30 min)", price: 225 }],
	},
	{
		id: "choir",
		name: "Chorale",
		options: [{ label: "Forfait annuel", price: 105 }],
	},
	{
		id: "loulous_workshop",
		name: "Atelier des Loulous",
		options: [{ label: "Forfait annuel", price: 240 }],
	},
	{
		id: "theatre",
		name: "Théâtre",
		options: [
			{ label: "Enfants (1h30)", price: 140 },
			{ label: "Adultes (2h / 2 semaines)", price: 90 },
			{ label: "Arts dramatiques (1h)", price: 90 },
			{ label: "Confiance en soi (1h)", price: 90 },
		],
	},
];
