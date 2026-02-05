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
}

export type TeacherSortOption = "rating" | "name" | "online_first";
