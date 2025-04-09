export interface Project {
    id: string;
    title: string;
    category: string;
    startQuarter: string;
    endQuarter: string;
    description?: string;
    status?: string;
    teamMembers?: string[];
    fields?: {
        process?: string[];
        technology?: string[];
        service?: string[];
        data?: string[];
    };
}

export interface Category {
    id: string;
    name: string;
    color: string;
    icon?: string;
    parentId?: string; // Reference to parent category
    isSubcategory?: boolean; // Flag to easily identify subcategories
}  