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
};

// Client-side data service using fetch API instead of PnP JS
class ClientDataService {
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

    private async fetchFromSharePoint(listName: string, select: string = '*'): Promise<any[]> {
        const webUrl = this.getWebUrl();
        const endpoint = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=${select}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=nometadata'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`SharePoint request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
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
                'Id,Title,Color,Icon'
            );

            return items.map(item => ({
                id: item.Id.toString(),
                name: item.Title,
                color: item.Color,
                icon: item.Icon,
            }));
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    async getCategoryById(id: string): Promise<Category | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})?$select=Id,Title,Color,Icon`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch category: ${response.statusText}`);
            }

            const item = await response.json();

            return {
                id: item.Id.toString(),
                name: item.Title,
                color: item.Color,
                icon: item.Icon,
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify({
                    __metadata: { type: `SP.Data.${SP_LISTS.TEAM_MEMBERS}ListItem` },
                    Title: teamMember.name,
                    Role: teamMember.role,
                    ProjectId: teamMember.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=nometadata',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-HTTP-Method': 'DELETE',
                        'IF-MATCH': '*'
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify({
                    __metadata: { type: `SP.Data.${SP_LISTS.FIELDS}ListItem` },
                    Type: field.type,
                    Value: field.value,
                    ProjectId: field.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=nometadata',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-HTTP-Method': 'DELETE',
                        'IF-MATCH': '*'
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete field: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error(`Error deleting fields for project ${projectId}:`, error);
            throw error;
        }
    }

    // Enhanced createProject method that also handles team members and fields
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify({
                    __metadata: { type: `SP.Data.${SP_LISTS.PROJECTS}ListItem` },
                    Title: project.title,
                    Category: project.category,
                    StartQuarter: project.startQuarter,
                    EndQuarter: project.endQuarter,
                    Description: project.description,
                    Status: project.status.toUpperCase(), // Convert to uppercase for SharePoint
                    Projektleitung: project.projektleitung,
                    Bisher: project.bisher,
                    Zukunft: project.zukunft,
                    Fortschritt: project.fortschritt,
                    GeplantUmsetzung: project.geplante_umsetzung,
                    Budget: project.budget
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to create project: ${response.statusText}`);
            }

            const result = await response.json();
            const newProjectId = result.Id.toString();

            // Then create team members if provided
            if (project.teamMembers && project.teamMembers.length > 0) {
                for (const member of project.teamMembers) {
                    if (member.name && member.role) { // Only create if name and role are provided
                        await this.createTeamMember({
                            name: member.name,
                            role: member.role,
                            projectId: newProjectId
                        });
                    }
                }
            }

            // Then create fields if provided
            if (project.fields) {
                // Process fields
                if (project.fields.process) {
                    for (const value of project.fields.process) {
                        if (value) { // Only create if value is not empty
                            await this.createField({
                                type: 'PROCESS',
                                value,
                                projectId: newProjectId
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
                                projectId: newProjectId
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
                                projectId: newProjectId
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
                                projectId: newProjectId
                            });
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
                description: project.description,
                status: project.status,
                projektleitung: project.projektleitung,
                bisher: project.bisher,
                zukunft: project.zukunft,
                fortschritt: project.fortschritt,
                geplante_umsetzung: project.geplante_umsetzung,
                budget: project.budget
            };
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
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

            const updateData: any = {
                __metadata: { type: `SP.Data.${SP_LISTS.PROJECTS}ListItem` }
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
                    'IF-MATCH': '*'
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

    // Category operations
    async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify({
                    __metadata: { type: `SP.Data.${SP_LISTS.CATEGORIES}ListItem` },
                    Title: category.name,
                    Color: category.color,
                    Icon: category.icon
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to create category: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                id: result.Id.toString(),
                name: category.name,
                color: category.color,
                icon: category.icon
            };
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    async updateCategory(id: string, category: Partial<Category>): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})`;

            const updateData: any = {
                __metadata: { type: `SP.Data.${SP_LISTS.CATEGORIES}ListItem` }
            };

            if (category.name) updateData.Title = category.name;
            if (category.color) updateData.Color = category.color;
            if (category.icon) updateData.Icon = category.icon;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*'
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify({
                    __metadata: { type: `SP.Data.${SP_LISTS.FIELD_TYPES}ListItem` },
                    Title: fieldType.name,
                    Type: fieldType.type,
                    Description: fieldType.description || ''
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

            const updateData: any = {
                __metadata: { type: `SP.Data.${SP_LISTS.FIELD_TYPES}ListItem` }
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
                    'IF-MATCH': '*'
                },
                body: JSON.stringify(updateData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
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

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete field type: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting field type ${id}:`, error);
            throw error;
        }
    }
}

// Create and export a singleton instance
export const clientDataService = new ClientDataService();    