import { AppSettings } from "@/types";

// Types
export interface Project {
    id: string;
    title: string;
    category: string;
    startQuarter: string;
    endQuarter: string;
    description: string;
    status: 'planned' | 'in-progress' | 'completed';
    projektleitung: string;
    bisher: string;
    zukunft: string;
    fortschritt: number;
    geplante_umsetzung: string;
    budget: string;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    parentId?: string;      // Added for subcategories support
    isSubcategory?: boolean; // Added for easier filtering
}

export interface FieldType {
    id: string;
    name: string;
    type: string;
    description: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    projectId: string;
}

export interface Field {
    id: string;
    type: string;
    value: string;
    projectId: string;
}

// SharePoint list names
const SP_LISTS = {
    PROJECTS: "RoadmapProjects",
    CATEGORIES: "RoadmapCategories",
    FIELD_TYPES: "RoadmapFieldTypes",
    FIELDS: "RoadmapFields",
    TEAM_MEMBERS: "RoadmapTeamMembers",
    USERS: "RoadmapUsers",
    SETTINGS: "RoadmapSettings",
};

// Client-side data service using fetch API instead of PnP JS
class ClientDataService {
    // Cache for list metadata types
    private metadataCache: Record<string, string> = {};
    // Cache for request digest
    private requestDigestCache: { value: string; expiration: number } | null = null;

    private getWebUrl(): string {
        // For development/testing with a hardcoded URL that matches your environment
        if (process.env.NODE_ENV === 'development') {
            return 'https://spi-u.intranet.bs.ch/JSD/QMServices/Roadmap';
        }

        // For production, try to derive from the current URL
        // This assumes your app is deployed to the SharePoint site
        try {
            const origin = window.location.origin;
            const pathSegments = window.location.pathname.split('/');

            // Find the index of 'Roadmap' in the path
            const roadmapIndex = pathSegments.findIndex(segment =>
                segment.toLowerCase() === 'roadmap' ||
                segment.toLowerCase() === 'roadmap-app'
            );

            if (roadmapIndex !== -1) {
                // Construct the path up to and including 'Roadmap'
                const sitePath = pathSegments.slice(0, roadmapIndex + 1).join('/');
                return origin + sitePath;
            }
        } catch (error) {
            console.error('Error determining SharePoint web URL:', error);
        }

        // Fallback to the hardcoded path
        return 'https://spi-u.intranet.bs.ch/JSD/QMServices/Roadmap';
    }

    private async getRequestDigest(): Promise<string> {
        // Check if we have a cached digest that's still valid
        const now = Date.now();
        if (this.requestDigestCache && this.requestDigestCache.expiration > now) {
            return this.requestDigestCache.value;
        }

        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/contextinfo`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Request Digest Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to get request digest: ${response.statusText}`);
            }

            const data = await response.json();
            const digestValue = data.FormDigestValue;
            const expiresIn = data.FormDigestTimeoutSeconds * 1000;

            // Cache the digest
            this.requestDigestCache = {
                value: digestValue,
                expiration: now + expiresIn - 60000 // Subtract 1 minute for safety
            };

            return digestValue;
        } catch (error) {
            console.error('Error getting request digest:', error);
            throw error;
        }
    }

    private async fetchFromSharePoint(listName: string, select: string = '*'): Promise<any[]> {
        const webUrl = this.getWebUrl();
        const endpoint = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=${select}`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('SharePoint API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`SharePoint request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.value || [];
        } catch (error) {
            console.error(`Error fetching from SharePoint list ${listName}:`, error);
            throw error;
        }
    }

    // Helper method to get the correct metadata type for a list
    private async getListMetadata(listName: string): Promise<string> {
        // Check if we have the metadata type cached
        if (this.metadataCache[listName]) {
            return this.metadataCache[listName];
        }

        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${listName}')?$select=ListItemEntityTypeFullName`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('List Metadata Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to get list metadata: ${response.statusText}`);
            }

            const data = await response.json();
            const metadataType = data.ListItemEntityTypeFullName;

            // Cache the result
            this.metadataCache[listName] = metadataType;

            return metadataType;
        } catch (error) {
            console.error(`Error getting metadata for list ${listName}:`, error);
            // Fallback to the standard format
            const fallbackType = `SP.Data.${listName}ListItem`;
            this.metadataCache[listName] = fallbackType;
            return fallbackType;
        }
    }

    // Added method to convert list names to their expected type format
    private getListItemType(listName: string): string {
        // Sanitize the list name for use in the type name
        const sanitizedName = listName.replace(/\s/g, '_x0020_');
        return `SP.Data.${sanitizedName}ListItem`;
    }

    // PROJECT OPERATIONS
    async getAllProjects(): Promise<Project[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.PROJECTS,
                'Id,Title,Category,StartQuarter,EndQuarter,Description,Status,Projektleitung,Bisher,Zukunft,Fortschritt,GeplantUmsetzung,Budget'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                title: item.Title,
                category: item.Category,
                startQuarter: item.StartQuarter,
                endQuarter: item.EndQuarter,
                description: item.Description || '',
                // Convert status to lowercase to match the expected type
                status: (item.Status?.toLowerCase() || 'planned') as 'planned' | 'in-progress' | 'completed',
                projektleitung: item.Projektleitung || '',
                bisher: item.Bisher || '',
                zukunft: item.Zukunft || '',
                fortschritt: item.Fortschritt || 0,
                geplante_umsetzung: item.GeplantUmsetzung || '',
                budget: item.Budget || '',
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }

    async getProjectById(id: string): Promise<Project | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${id})?$select=Id,Title,Category,StartQuarter,EndQuarter,Description,Status,Projektleitung,Bisher,Zukunft,Fortschritt,GeplantUmsetzung,Budget`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Project Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch project: ${response.statusText}`);
            }

            const item = await response.json();

            return {
                id: item.Id.toString(),
                title: item.Title,
                category: item.Category,
                startQuarter: item.StartQuarter,
                endQuarter: item.EndQuarter,
                description: item.Description || '',
                status: (item.Status?.toLowerCase() || 'planned') as 'planned' | 'in-progress' | 'completed',
                projektleitung: item.Projektleitung || '',
                bisher: item.Bisher || '',
                zukunft: item.Zukunft || '',
                fortschritt: item.Fortschritt || 0,
                geplante_umsetzung: item.GeplantUmsetzung || '',
                budget: item.Budget || '',
            };
        } catch (error) {
            console.error(`Error fetching project ${id}:`, error);
            return null;
        }
    }

    async deleteProject(id: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Project Delete Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to delete project: ${response.statusText}`);
            }

            // Also delete related team members and fields
            await this.deleteTeamMembersForProject(id);
            await this.deleteFieldsForProject(id);
        } catch (error) {
            console.error(`Error deleting project ${id}:`, error);
            throw error;
        }
    }

    // CATEGORY OPERATIONS
    async getAllCategories(): Promise<Category[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.CATEGORIES,
                'Id,Title,Color,Icon,ParentCategoryId,IsSubcategory'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                name: item.Title,
                color: item.Color,
                icon: item.Icon || '',
                parentId: item.ParentCategoryId ? item.ParentCategoryId.toString() : undefined,
                isSubcategory: item.IsSubcategory === true
            }));
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    async getCategoryById(id: string): Promise<Category | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})?$select=Id,Title,Color,Icon,ParentCategoryId,IsSubcategory`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Category Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch category: ${response.statusText}`);
            }

            const item = await response.json();

            return {
                id: item.Id.toString(),
                name: item.Title,
                color: item.Color,
                icon: item.Icon || '',
                parentId: item.ParentCategoryId ? item.ParentCategoryId.toString() : undefined,
                isSubcategory: item.IsSubcategory === true
            };
        } catch (error) {
            console.error(`Error fetching category ${id}:`, error);
            return null;
        }
    }

    // FIELD TYPE OPERATIONS
    async getAllFieldTypes(): Promise<FieldType[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.FIELD_TYPES,
                'Id,Title,Type,Description'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                name: item.Title,
                type: item.Type,
                description: item.Description || '',
            }));
        } catch (error) {
            console.error('Error fetching field types:', error);
            return [];
        }
    }

    async getFieldTypeById(id: string): Promise<FieldType | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELD_TYPES}')/items(${id})?$select=Id,Title,Type,Description`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Field Type Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch field type: ${response.statusText}`);
            }

            const item = await response.json();

            return {
                id: item.Id.toString(),
                name: item.Title,
                type: item.Type,
                description: item.Description || '',
            };
        } catch (error) {
            console.error(`Error fetching field type ${id}:`, error);
            return null;
        }
    }

    // TEAM MEMBER OPERATIONS
    async getTeamMembersByProjectId(projectId: string): Promise<TeamMember[]> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.TEAM_MEMBERS}')/items?$filter=ProjectId eq '${projectId}'&$select=Id,Title,Role,ProjectId`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Team Members Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch team members: ${response.statusText}`);
            }

            const data = await response.json();
            const items = data.value || [];

            return items.map((item: { Id: { toString: () => any; }; Title: any; Role: any; ProjectId: any; }) => ({
                id: item.Id.toString(),
                name: item.Title,
                role: item.Role,
                projectId: item.ProjectId,
            }));
        } catch (error) {
            console.error(`Error fetching team members for project ${projectId}:`, error);
            return [];
        }
    }

    async createTeamMember(teamMember: Omit<TeamMember, 'id'>): Promise<TeamMember> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.TEAM_MEMBERS}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.TEAM_MEMBERS);
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Title: teamMember.name,
                    Role: teamMember.role,
                    ProjectId: teamMember.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Team Member Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to create team member: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                ...teamMember,
                id: result.Id.toString()
            };
        } catch (error) {
            console.error('Error creating team member:', error);
            throw error;
        }
    }

    async deleteTeamMembersForProject(projectId: string): Promise<void> {
        try {
            const teamMembers = await this.getTeamMembersByProjectId(projectId);

            for (const member of teamMembers) {
                const webUrl = this.getWebUrl();
                const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.TEAM_MEMBERS}')/items(${member.id})`;

                // Get request digest for write operations
                const requestDigest = await this.getRequestDigest();

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=nometadata',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-HTTP-Method': 'DELETE',
                        'IF-MATCH': '*',
                        'X-RequestDigest': requestDigest
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    // Try to get the response text for better error messages
                    const errorText = await response.text();
                    console.error('Team Member Delete Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: response.url,
                        body: errorText
                    });
                    throw new Error(`Failed to delete team member: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error(`Error deleting team members for project ${projectId}:`, error);
            throw error;
        }
    }

    // FIELD OPERATIONS
    async getFieldsByProjectId(projectId: string): Promise<Field[]> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELDS}')/items?$filter=ProjectId eq '${projectId}'&$select=Id,Type,Value,ProjectId`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Fields Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch fields: ${response.statusText}`);
            }

            const data = await response.json();
            const items = data.value || [];

            return items.map((item: { Id: { toString: () => any; }; Type: any; Value: any; ProjectId: any; }) => ({
                id: item.Id.toString(),
                type: item.Type,
                value: item.Value,
                projectId: item.ProjectId,
            }));
        } catch (error) {
            console.error(`Error fetching fields for project ${projectId}:`, error);
            return [];
        }
    }

    async createField(field: Omit<Field, 'id'>): Promise<Field> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELDS}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.FIELDS);
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Type: field.type,
                    Value: field.value,
                    ProjectId: field.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Field Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        Type: field.type,
                        Value: field.value,
                        ProjectId: field.projectId
                    })
                });
                throw new Error(`Failed to create field: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                ...field,
                id: result.Id.toString()
            };
        } catch (error) {
            console.error('Error creating field:', error);
            throw error;
        }
    }

    async deleteFieldsForProject(projectId: string): Promise<void> {
        try {
            const fields = await this.getFieldsByProjectId(projectId);

            for (const field of fields) {
                const webUrl = this.getWebUrl();
                const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELDS}')/items(${field.id})`;

                // Get request digest for write operations
                const requestDigest = await this.getRequestDigest();

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=nometadata',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-HTTP-Method': 'DELETE',
                        'IF-MATCH': '*',
                        'X-RequestDigest': requestDigest
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    // Try to get the response text for better error messages
                    const errorText = await response.text();
                    console.error('Field Delete Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: response.url,
                        body: errorText
                    });
                    throw new Error(`Failed to delete field: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error(`Error deleting fields for project ${projectId}:`, error);
            throw error;
        }
    }

    // Category operations
    async createCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
        const webUrl = this.getWebUrl();
        const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items`;

        // Get the correct metadata type and request digest
        const listMetadata = await this.getListMetadata(SP_LISTS.CATEGORIES);
        const requestDigest = await this.getRequestDigest();

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': requestDigest,
                'X-HTTP-Method': 'POST'
            },
            body: JSON.stringify({
                __metadata: { type: listMetadata },
                Title: categoryData.name,
                Color: categoryData.color,
                Icon: categoryData.icon || '',
                ParentCategoryId: categoryData.parentId || null,
                IsSubcategory: categoryData.parentId ? true : false
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create category: ${response.statusText}`);
        }

        const data = await response.json();
        return this.mapCategoryFromSharePoint(data.d);
    }

    // Update the mapCategoryFromSharePoint method to include parent category info
    private mapCategoryFromSharePoint(item: any): Category {
        return {
            id: item.ID?.toString() || item.Id?.toString(),
            name: item.Title,
            color: item.Color || '#000000',
            icon: item.Icon || '',
            parentId: item.ParentCategoryId ? item.ParentCategoryId.toString() : undefined,
            isSubcategory: item.IsSubcategory === true
        };
    }

    async updateCategory(id: string, category: Partial<Category>): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.CATEGORIES);
            const requestDigest = await this.getRequestDigest();

            const updateData: any = {
                __metadata: { type: listMetadata }
            };

            if (category.name) updateData.Title = category.name;
            if (category.color) updateData.Color = category.color;
            if (category.icon !== undefined) updateData.Icon = category.icon;
            if (category.parentId !== undefined) {
                updateData.ParentCategoryId = category.parentId || null;
                updateData.IsSubcategory = !!category.parentId;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Category Update Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify(updateData)
                });
                throw new Error(`Failed to update category: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error updating category ${id}:`, error);
            throw error;
        }
    }

    async deleteCategory(id: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Category Delete Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to delete category: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting category ${id}:`, error);
            throw error;
        }
    }

    // Field type operations
    async createFieldType(fieldType: Omit<FieldType, 'id'>): Promise<FieldType> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELD_TYPES}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.FIELD_TYPES);
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Title: fieldType.name,
                    Type: fieldType.type,
                    Description: fieldType.description || ''
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Field Type Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        Title: fieldType.name,
                        Type: fieldType.type,
                        Description: fieldType.description || ''
                    })
                });
                throw new Error(`Failed to create field type: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                id: result.Id.toString(),
                name: fieldType.name,
                type: fieldType.type,
                description: fieldType.description || ''
            };
        } catch (error) {
            console.error('Error creating field type:', error);
            throw error;
        }
    }

    async updateFieldType(id: string, fieldType: Partial<FieldType>): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELD_TYPES}')/items(${id})`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.FIELD_TYPES);
            const requestDigest = await this.getRequestDigest();

            const updateData: any = {
                __metadata: { type: listMetadata }
            };

            if (fieldType.name) updateData.Title = fieldType.name;
            if (fieldType.type) updateData.Type = fieldType.type;
            if (fieldType.description !== undefined) updateData.Description = fieldType.description;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Field Type Update Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify(updateData)
                });
                throw new Error(`Failed to update field type: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error updating field type ${id}:`, error);
            throw error;
        }
    }

    async deleteFieldType(id: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.FIELD_TYPES}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Field Type Delete Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to delete field type: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting field type ${id}:`, error);
            throw error;
        }
    }

    async createProject(project: Omit<Project, 'id'> & {
        teamMembers?: { name: string; role: string }[];
        fields?: {
            process: string[];
            technology: string[];
            services: string[];
            data: string[];
        }
    }): Promise<Project> {
        try {
            // First create the project
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.PROJECTS);
            const requestDigest = await this.getRequestDigest();

            // Convert Fortschritt to a proper double format
            const fortschrittValue = parseFloat(project.fortschritt.toString());

            console.log("Creating project with data:", {
                Title: project.title,
                Category: project.category,
                StartQuarter: project.startQuarter,
                EndQuarter: project.endQuarter,
                Description: project.description || '',
                Status: project.status.toUpperCase(),
                Projektleitung: project.projektleitung || '',
                Bisher: project.bisher || '',
                Zukunft: project.zukunft || '',
                Fortschritt: fortschrittValue,
                GeplantUmsetzung: project.geplante_umsetzung || '',
                Budget: project.budget || ''
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Title: project.title,
                    Category: project.category,
                    StartQuarter: project.startQuarter,
                    EndQuarter: project.endQuarter,
                    Description: project.description || '',
                    Status: project.status.toUpperCase(),
                    Projektleitung: project.projektleitung || '',
                    Bisher: project.bisher || '',
                    Zukunft: project.zukunft || '',
                    Fortschritt: fortschrittValue, // Explicitly formatted as a double
                    GeplantUmsetzung: project.geplante_umsetzung || '',
                    Budget: project.budget || ''
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Project Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        Title: project.title,
                        Category: project.category,
                        StartQuarter: project.startQuarter,
                        EndQuarter: project.endQuarter,
                        Description: project.description || '',
                        Status: project.status.toUpperCase(),
                        Projektleitung: project.projektleitung || '',
                        Bisher: project.bisher || '',
                        Zukunft: project.zukunft || '',
                        Fortschritt: fortschrittValue,
                        GeplantUmsetzung: project.geplante_umsetzung || '',
                        Budget: project.budget || ''
                    })
                });
                throw new Error(`Failed to create project: ${response.statusText}`);
            }

            // Log the full response for debugging
            const result = await response.json();
            console.log("Project creation result:", JSON.stringify(result, null, 2));

            // Handle different response formats
            let newProjectId;
            if (result.d && result.d.Id) {
                newProjectId = result.d.Id.toString();
            } else if (result.Id) {
                newProjectId = result.Id.toString();
            } else if (result.id) {
                newProjectId = result.id.toString();
            } else {
                console.error("Unexpected response format:", result);
                // Try to find an ID property at any level
                const findId = (obj: any): string | null => {
                    if (!obj || typeof obj !== 'object') return null;
                    if (obj.Id) return obj.Id.toString();
                    if (obj.id) return obj.id.toString();
                    for (const key in obj) {
                        const found = findId(obj[key]);
                        if (found) return found;
                    }
                    return null;
                };

                newProjectId = findId(result);
                if (!newProjectId) {
                    throw new Error("Could not find project ID in response");
                }
            }

            console.log("Using project ID:", newProjectId);

            // Then create team members if provided
            if (project.teamMembers && project.teamMembers.length > 0) {
                for (const member of project.teamMembers) {
                    if (member.name && member.role) { // Only create if name and role are provided
                        try {
                            await this.createTeamMember({
                                name: member.name,
                                role: member.role,
                                projectId: newProjectId
                            });
                        } catch (error) {
                            console.error(`Error creating team member ${member.name}:`, error);
                            // Continue with other team members even if one fails
                        }
                    }
                }
            }

            // Then create fields if provided
            if (project.fields) {
                // Process fields
                if (project.fields.process) {
                    for (const value of project.fields.process) {
                        if (value) { // Only create if value is not empty
                            try {
                                await this.createField({
                                    type: 'PROCESS',
                                    value,
                                    projectId: newProjectId
                                });
                            } catch (error) {
                                console.error(`Error creating process field ${value}:`, error);
                                // Continue with other fields even if one fails
                            }
                        }
                    }
                }

                // Technology fields
                if (project.fields.technology) {
                    for (const value of project.fields.technology) {
                        if (value) {
                            try {
                                await this.createField({
                                    type: 'TECHNOLOGY',
                                    value,
                                    projectId: newProjectId
                                });
                            } catch (error) {
                                console.error(`Error creating technology field ${value}:`, error);
                            }
                        }
                    }
                }

                // Service fields
                if (project.fields.services) {
                    for (const value of project.fields.services) {
                        if (value) {
                            try {
                                await this.createField({
                                    type: 'SERVICE',
                                    value,
                                    projectId: newProjectId
                                });
                            } catch (error) {
                                console.error(`Error creating service field ${value}:`, error);
                            }
                        }
                    }
                }

                // Data fields
                if (project.fields.data) {
                    for (const value of project.fields.data) {
                        if (value) {
                            try {
                                await this.createField({
                                    type: 'DATA',
                                    value,
                                    projectId: newProjectId
                                });
                            } catch (error) {
                                console.error(`Error creating data field ${value}:`, error);
                            }
                        }
                    }
                }
            }

            return {
                id: newProjectId,
                title: project.title,
                category: project.category,
                startQuarter: project.startQuarter,
                endQuarter: project.endQuarter,
                description: project.description || '',
                status: project.status,
                projektleitung: project.projektleitung || '',
                bisher: project.bisher || '',
                zukunft: project.zukunft || '',
                fortschritt: project.fortschritt,
                geplante_umsetzung: project.geplante_umsetzung || '',
                budget: project.budget || ''
            };
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    async getCurrentUser(): Promise<any> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/currentuser?$select=Id,Title,Email,IsSiteAdmin,LoginName,UserPrincipalName`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Current User Fetch Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch current user: ${response.statusText}`);
            }

            const data = await response.json();
            return data.d;
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    }

    // Method to check if current user is an admin
    async isCurrentUserAdmin(): Promise<boolean> {
        try {
            // First check if user is a site admin
            const currentUser = await this.getCurrentUser();

            if (currentUser.IsSiteAdmin) {
                return true;
            }

            // If not a site admin, check if they're in our admin list
            const adminUsers = await this.getAdminUsers();
            return adminUsers.some(admin =>
                admin.email.toLowerCase() === currentUser.Email.toLowerCase() ||
                admin.loginName === currentUser.LoginName
            );
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    // Get list of admin users from our custom list
    async getAdminUsers(): Promise<{ id: string, email: string, loginName: string }[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.USERS,
                'Id,Email,LoginName,Role'
            );

            return items
                .filter(item => item.Role === 'admin')
                .map(item => ({
                    id: item.Id.toString(),
                    email: item.Email,
                    loginName: item.LoginName || ''
                }));
        } catch (error) {
            console.error('Error fetching admin users:', error);
            return [];
        }
    }

    // Enhanced updateProject method that also handles team members and fields
    async updateProject(id: string, project: Partial<Project> & {
        teamMembers?: { name: string; role: string }[];
        fields?: {
            process: string[];
            technology: string[];
            services: string[];
            data: string[];
        }
    }): Promise<void> {
        try {
            // First update the project
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${id})`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.PROJECTS);
            const requestDigest = await this.getRequestDigest();

            const updateData: any = {
                __metadata: { type: listMetadata }
            };

            if (project.title) updateData.Title = project.title;
            if (project.category) updateData.Category = project.category;
            if (project.startQuarter) updateData.StartQuarter = project.startQuarter;
            if (project.endQuarter) updateData.EndQuarter = project.endQuarter;
            if (project.description !== undefined) updateData.Description = project.description;
            if (project.status) updateData.Status = project.status.toUpperCase();
            if (project.projektleitung !== undefined) updateData.Projektleitung = project.projektleitung;
            if (project.bisher !== undefined) updateData.Bisher = project.bisher;
            if (project.zukunft !== undefined) updateData.Zukunft = project.zukunft;
            if (project.fortschritt !== undefined) updateData.Fortschritt = project.fortschritt;
            if (project.geplante_umsetzung !== undefined) updateData.GeplantUmsetzung = project.geplante_umsetzung;
            if (project.budget !== undefined) updateData.Budget = project.budget;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Project Update Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify(updateData)
                });
                throw new Error(`Failed to update project: ${response.statusText}`);
            }

            // Then update team members if provided
            if (project.teamMembers) {
                // Delete existing team members
                await this.deleteTeamMembersForProject(id);

                // Create new team members
                for (const member of project.teamMembers) {
                    if (member.name && member.role) { // Only create if name and role are provided
                        await this.createTeamMember({
                            name: member.name,
                            role: member.role,
                            projectId: id
                        });
                    }
                }
            }

            // Then update fields if provided
            if (project.fields) {
                // Delete existing fields
                await this.deleteFieldsForProject(id);

                // Create new fields
                // Process fields
                if (project.fields.process) {
                    for (const value of project.fields.process) {
                        if (value) { // Only create if value is not empty
                            await this.createField({
                                type: 'PROCESS',
                                value,
                                projectId: id
                            });
                        }
                    }
                }

                // Technology fields
                if (project.fields.technology) {
                    for (const value of project.fields.technology) {
                        if (value) {
                            await this.createField({
                                type: 'TECHNOLOGY',
                                value,
                                projectId: id
                            });
                        }
                    }
                }

                // Service fields
                if (project.fields.services) {
                    for (const value of project.fields.services) {
                        if (value) {
                            await this.createField({
                                type: 'SERVICE',
                                value,
                                projectId: id
                            });
                        }
                    }
                }

                // Data fields
                if (project.fields.data) {
                    for (const value of project.fields.data) {
                        if (value) {
                            await this.createField({
                                type: 'DATA',
                                value,
                                projectId: id
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error updating project ${id}:`, error);
            throw error;
        }
    }

    // User operations for authentication
    async getUserByEmail(email: string): Promise<any | null> {
        try {
            const webUrl = this.getWebUrl();
            const encodedEmail = encodeURIComponent(email);
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.USERS}')/items?$filter=Email eq '${encodedEmail}'&$select=Id,Title,Email,Role,Password`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('User Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch user: ${response.statusText}`);
            }

            const data = await response.json();
            const users = data.value || [];

            if (users.length === 0) {
                return null;
            }

            return {
                id: users[0].Id.toString(),
                username: users[0].Email,
                displayName: users[0].Title,
                role: users[0].Role || 'user',
                password: users[0].Password // Note: In a real app, passwords should be hashed
            };
        } catch (error) {
            console.error(`Error fetching user by email ${email}:`, error);
            return null;
        }
    }

    async createUser(user: { username: string; displayName: string; role: string; password: string }): Promise<any> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.USERS}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.USERS);
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Title: user.displayName,
                    Email: user.username,
                    Role: user.role,
                    Password: user.password // Note: In a real app, passwords should be hashed
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('User Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        Title: user.displayName,
                        Email: user.username,
                        Role: user.role,
                        Password: '********' // Masked for security
                    })
                });
                throw new Error(`Failed to create user: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                id: result.Id.toString(),
                username: user.username,
                displayName: user.displayName,
                role: user.role
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getAllUsers(): Promise<any[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.USERS,
                'Id,Title,Email,Role'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                username: item.Email,
                displayName: item.Title,
                role: item.Role || 'user'
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async updateUser(id: string, user: Partial<{ username: string; displayName: string; role: string; password: string }>): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.USERS}')/items(${id})`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.USERS);
            const requestDigest = await this.getRequestDigest();

            const updateData: any = {
                __metadata: { type: listMetadata }
            };

            if (user.displayName) updateData.Title = user.displayName;
            if (user.username) updateData.Email = user.username;
            if (user.role) updateData.Role = user.role;
            if (user.password) updateData.Password = user.password; // Note: In a real app, passwords should be hashed

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('User Update Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        ...updateData,
                        Password: updateData.Password ? '********' : undefined // Masked for security
                    })
                });
                throw new Error(`Failed to update user: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error updating user ${id}:`, error);
            throw error;
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.USERS}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('User Delete Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to delete user: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);
            throw error;
        }
    }

    async getAllSettings(): Promise<AppSettings[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.SETTINGS,
                'Id,Title,Value,Description'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                key: item.Title,
                value: item.Value || '',
                description: item.Description || '',
            }));
        } catch (error) {
            console.error('Error fetching settings:', error);
            return [];
        }
    }

    async getSettingByKey(key: string): Promise<AppSettings | null> {
        try {
            const webUrl = this.getWebUrl();
            const encodedKey = encodeURIComponent(key);
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items?$filter=Title eq '${encodedKey}'&$select=Id,Title,Value,Description`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Setting Fetch Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to fetch setting: ${response.statusText}`);
            }

            const data = await response.json();
            const items = data.value || [];

            if (items.length === 0) {
                return null;
            }

            return {
                id: items[0].Id.toString(),
                key: items[0].Title,
                value: items[0].Value || '',
                description: items[0].Description || '',
            };
        } catch (error) {
            console.error(`Error fetching setting by key ${key}:`, error);
            return null;
        }
    }

    async createSetting(setting: Omit<AppSettings, 'id'>): Promise<AppSettings> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.SETTINGS);
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    __metadata: { type: listMetadata },
                    Title: setting.key,
                    Value: setting.value,
                    Description: setting.description || ''
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Setting Create Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify({
                        Title: setting.key,
                        Value: setting.value,
                        Description: setting.description || ''
                    })
                });
                throw new Error(`Failed to create setting: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                id: result.Id.toString(),
                key: setting.key,
                value: setting.value,
                description: setting.description || ''
            };
        } catch (error) {
            console.error('Error creating setting:', error);
            throw error;
        }
    }

    async updateSetting(setting: AppSettings): Promise<AppSettings> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items(${setting.id})`;

            // Get the correct metadata type and request digest
            const listMetadata = await this.getListMetadata(SP_LISTS.SETTINGS);
            const requestDigest = await this.getRequestDigest();

            const updateData: any = {
                __metadata: { type: listMetadata },
                Title: setting.key,
                Value: setting.value,
                Description: setting.description || ''
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Setting Update Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText,
                    requestBody: JSON.stringify(updateData)
                });
                throw new Error(`Failed to update setting: ${response.statusText}`);
            }

            return setting;
        } catch (error) {
            console.error(`Error updating setting ${setting.id}:`, error);
            throw error;
        }
    }

    async deleteSetting(id: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Try to get the response text for better error messages
                const errorText = await response.text();
                console.error('Setting Delete Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to delete setting: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting setting ${id}:`, error);
            throw error;
        }
    }
}

// Create and export a singleton instance
export const clientDataService = new ClientDataService();