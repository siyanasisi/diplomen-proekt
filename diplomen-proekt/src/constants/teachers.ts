import type { TeacherSortOption } from "../types/teacher";

export const TEACHER_SUBJECTS = [
    "Български език и литература",
    "Математика",
    "Английски език",
    "История",
    "География",
    "Биология",
    "Химия",
    "Физика",
    "Информатика",
    "Философия",
] as const;

export const SORT_OPTIONS: { value: TeacherSortOption; label: string }[] = [
    { value: "rating", label: "Рейтинг" },
    { value: "name", label: "Име" },
    { value: "online_first", label: "Онлайн първо" },
];

export const RATING_FILTER_OPTIONS = [
    { value: 0, label: "Всички рейтинги" },
    { value: 4, label: "4+ звезди" },
    { value: 4.5, label: "4.5+ звезди" },
    { value: 5, label: "5 звезди" },
] as const;

export const TEACHER_CITIES = [
    "Благоевград",
    "Бургас",
    "Варна",
    "Велико Търново",
    "Видин",
    "Враца",
    "Добрич",
    "Кърджали",
    "Монтана",
    "Пазарджик",
    "Перник",
    "Плевен",
    "Пловдив",
    "Русе",
    "Силистра",
    "Сливен",
    "София",
    "Стара Загора",
    "Хасково",
    "Шумен",
    "Ямбол",
] as const;
