export interface Teacher {
    id: string;
    user_id: string;
    full_name: string;
    profile_picture?: string;
    subject: string;
    description: string;
    rating: number;
    city?: string;
    is_online: boolean;
    education?: string;
    qualifications?: string;
    available_schedule?: string;
    email?: string;
    hourly_rate?: number | null;
    price_note?: string | null;
    offers_online_lessons?: boolean;
}

export interface TeacherReview {
    id: string;
    teacher_id: string;
    author_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    author_name?: string;
}

export type TeacherSortOption = "rating" | "name" | "online_first";
