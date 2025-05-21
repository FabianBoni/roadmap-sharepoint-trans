import { AppSettings, Category, Field, Project, ProjectLink, TeamMember } from "@/types";

// SharePoint list names
const SP_LISTS = {
    PROJECTS: "RoadmapProjects",
    CATEGORIES: "RoadmapCategories",
    FIELD_TYPES: "RoadmapFieldTypes",
    FIELDS: "RoadmapFields",
    TEAM_MEMBERS: "RoadmapTeamMembers",
    USERS: "RoadmapUsers",
    SETTINGS: "RoadmapSettings",
    PROJECT_LINKS: "RoadmapProjectLinks", // Neue Liste für Projekt-Links
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

    // PROJECT OPERATIONS
    async getAllProjects(): Promise<Project[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.PROJECTS,
                'Id,Title,Category,StartQuarter,EndQuarter,Description,Status,Projektleitung,Bisher,Zukunft,Fortschritt,GeplantUmsetzung,Budget,StartDate,EndDate'
            );

            const projects = items.map(item => ({
                id: item.Id.toString(),
                title: item.Title,
                category: item.Category,
                startQuarter: item.StartQuarter,
                endQuarter: item.EndQuarter,
                description: item.Description || '',
                // Convert status to lowercase to match the expected type
                status: (item.Status?.toLowerCase() || 'planned') as 'planned' | 'in-progress' | 'completed',
                ProjectFields: item.Fields || [],
                projektleitung: item.Projektleitung || '',
                bisher: item.Bisher || '',
                zukunft: item.Zukunft || '',
                fortschritt: item.Fortschritt || 0,
                geplante_umsetzung: item.GeplantUmsetzung || '',
                budget: item.Budget || '',
                startDate: item.StartDate || '', // Neues Feld
                endDate: item.EndDate || '',     // Neues Feld
                links: [] as ProjectLink[] // Explicitly type the empty array
            }));

            // Hole Links für alle Projekte
            for (const project of projects) {
                project.links = await this.getProjectLinks(project.id);
            }

            return projects;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }
    async getProjectById(id: string): Promise<Project | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${id})?$select=Id,Title,Category,StartQuarter,EndQuarter,Description,Status,Projektleitung,Bisher,Zukunft,Fortschritt,GeplantUmsetzung,Budget,StartDate,EndDate,ProjectFields`;

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
            const teamMembers = await this.getTeamMembersForProject(item.Id.toString());

            let projectFields: string[] = [];
            if (item.ProjectFields) {
                if (typeof item.ProjectFields === 'string') {
                    if (item.ProjectFields.includes(';') || item.ProjectFields.includes(',')) {
                        projectFields = item.ProjectFields
                            .split(/[;,]/)
                            .map((field: string) => field.trim())
                            .filter(Boolean);
                    } else {
                        projectFields = [item.ProjectFields];
                    }
                } else if (Array.isArray(item.ProjectFields)) {
                    projectFields = item.ProjectFields;
                }
            }

            const project = {
                id: item.Id.toString(),
                title: item.Title,
                category: item.Category,
                startQuarter: item.StartQuarter,
                endQuarter: item.EndQuarter,
                description: item.Description || '',
                status: (item.Status?.toLowerCase() || 'planned') as 'planned' | 'in-progress' | 'completed',
                ProjectFields: projectFields || '',
                projektleitung: item.Projektleitung || '',
                projektleitungImageUrl: null as string | null,
                teamMembers: teamMembers,
                bisher: item.Bisher || '',
                zukunft: item.Zukunft || '',
                fortschritt: item.Fortschritt || 0,
                geplante_umsetzung: item.GeplantUmsetzung || '',
                budget: item.Budget || '',
                startDate: item.StartDate || '', // Neues Feld
                endDate: item.EndDate || '',     // Neues Feld
                links: await this.getProjectLinks(item.Id.toString()) // Hole Links für das Projekt
            };

            let projektLeitungMailParts = project.projektleitung.split(' ');
            let projektLeitungMail = projektLeitungMailParts[0].toLowerCase() + '.' + projektLeitungMailParts[1].toLowerCase() + '@jsd.bs.ch';

            if (project.projektleitung) {
                project.projektleitungImageUrl = await this.getUserProfilePictureUrl(projektLeitungMail);
            }

            return project;
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

            // Also delete related team members, fields, and links
            await this.deleteTeamMembersForProject(id);
            await this.deleteProjectLinks(id);
        } catch (error) {
            console.error(`Error deleting project ${id}:`, error);
            throw error;
        }
    }

    async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
        try {
            // Fetch existing project first to ensure we have all the data
            const existingProject = await this.getProjectById(id);

            if (!existingProject) {
                throw new Error(`Project with ID ${id} not found`);
            }

            // Get SharePoint environment details
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${id})`;
            const requestDigest = await this.getRequestDigest();
            const itemType = await this.getListMetadata(SP_LISTS.PROJECTS);

            // Process ProjectFields value
            let projectFieldsValue = '';

            if (projectData.ProjectFields !== undefined) {
                if (Array.isArray(projectData.ProjectFields)) {
                    projectFieldsValue = projectData.ProjectFields.join('; ');
                } else if (typeof projectData.ProjectFields === 'string') {
                    projectFieldsValue = projectData.ProjectFields;
                } else if (projectData.ProjectFields) {
                    projectFieldsValue = String(projectData.ProjectFields);
                }
            } else if (existingProject.ProjectFields) {
                // Use existing value if available
                if (Array.isArray(existingProject.ProjectFields)) {
                    projectFieldsValue = existingProject.ProjectFields.join('; ');
                } else {
                    projectFieldsValue = String(existingProject.ProjectFields);
                }
            }

            // Create a clean request body with all fields included
            const body = {
                '__metadata': { 'type': itemType },
                'Title': projectData.title || existingProject.title || '',
                'Category': projectData.category || existingProject.category || '',
                'StartQuarter': projectData.startQuarter || existingProject.startQuarter || '',
                'EndQuarter': projectData.endQuarter || existingProject.endQuarter || '',
                'Description': projectData.description || existingProject.description || '',
                'Status': projectData.status || existingProject.status || 'planned',
                'Projektleitung': projectData.projektleitung || existingProject.projektleitung || '',
                'Bisher': projectData.bisher || existingProject.bisher || '',
                'Zukunft': projectData.zukunft || existingProject.zukunft || '',
                'Fortschritt': typeof projectData.fortschritt === 'number' ? projectData.fortschritt : (existingProject.fortschritt || 0),
                'GeplantUmsetzung': projectData.geplante_umsetzung || existingProject.geplante_umsetzung || '',
                'Budget': projectData.budget || existingProject.budget || '',
                'StartDate': projectData.startDate || existingProject.startDate || '',
                'EndDate': projectData.endDate || existingProject.endDate || '',
                'ProjectFields': projectFieldsValue
            };

            console.log('Data being sent to SharePoint:', JSON.stringify(body));

            // Send the update request to SharePoint
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(body),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Enhanced error logging
                let errorDetails = '';
                try {
                    const errorText = await response.text();
                    errorDetails = errorText;
                    console.error('SharePoint Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: response.url,
                        body: errorText
                    });
                } catch (e) {
                    errorDetails = 'Could not read error details';
                }

                throw new Error(`Failed to update project: ${response.statusText}. Details: ${errorDetails}`);
            }

            // Create the updated project object to return
            const updatedProject: Project = {
                ...existingProject,
                ...projectData,
                id, // Ensure ID is preserved
            };

            // Return the updated project
            return updatedProject;
        } catch (error) {
            console.error(`Error updating project ${id}:`, error);
            throw error;
        }
    }

    async createProject(projectData: Omit<Project, 'id'>): Promise<Project> {
        try {
            // Erstellen Sie ein neues Projekt-Objekt mit einer temporären ID
            // Die tatsächliche ID wird von SharePoint beim Speichern generiert
            const newProject: Project = {
                ...projectData,
                id: 'new', // Diese ID wird von saveProject ersetzt
                links: projectData.links || []
            };

            // Die saveProject-Methode verwenden, um das neue Projekt zu speichern
            return await this.saveProject(newProject);
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    // CATEGORY OPERATIONS
    async createCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.CATEGORIES);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': categoryData.name,
                    'Color': categoryData.color,
                    'Icon': categoryData.icon,
                    'ParentCategoryId': categoryData.parentId,
                    'IsSubcategory': categoryData.isSubcategory
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to create category: ${response.statusText}`);
            }

            const newItem = await response.json();

            return {
                id: newItem.Id.toString(),
                name: categoryData.name,
                color: categoryData.color,
                icon: categoryData.icon,
                parentId: categoryData.parentId,
                isSubcategory: categoryData.isSubcategory
            };
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.CATEGORIES);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': categoryData.name,
                    'Color': categoryData.color,
                    'Icon': categoryData.icon,
                    'ParentCategoryId': categoryData.parentId,
                    'IsSubcategory': categoryData.isSubcategory
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to update category: ${response.statusText}`);
            }

            // Return the updated category
            return {
                id,
                name: categoryData.name || '',
                color: categoryData.color || '',
                icon: categoryData.icon || '',
                parentId: categoryData.parentId,
                isSubcategory: categoryData.isSubcategory
            };
        } catch (error) {
            console.error(`Error updating category ${id}:`, error);
            throw error;
        }
    }

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

    // PROJECT LINKS OPERATIONS
    async getProjectLinks(projectId: string): Promise<ProjectLink[]> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECT_LINKS}')/items?$filter=ProjectId eq '${projectId}'&$select=Id,Title,Url,ProjectId`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch project links: ${response.statusText}`);
            }

            const data = await response.json();
            const items = data.value || [];

            return items.map((item: any) => ({
                id: item.Id.toString(),
                title: item.Title,
                url: item.Url,
                projectId: item.ProjectId
            }));
        } catch (error) {
            console.error(`Error fetching links for project ${projectId}:`, error);
            return [];
        }
    }

    async deleteCategory(categoryId: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.CATEGORIES}')/items(${categoryId})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete category: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting category ${categoryId}:`, error);
            throw error;
        }
    }

    async createProjectLink(link: Omit<ProjectLink, 'id'>): Promise<ProjectLink> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECT_LINKS}')/items`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.PROJECT_LINKS);

            // SharePoint might expect ProjectId as a complex object if it's a lookup field
            // We need to examine the actual structure required

            // First, try to determine if ProjectId is a lookup field
            const isLookupField = true; // We're assuming it's a lookup field based on the error

            let requestBody;
            if (isLookupField) {
                // For lookup fields, we need to structure differently
                requestBody = {
                    '__metadata': { 'type': itemType },
                    'Title': link.title,
                    'Url': link.url,
                    // If ProjectId is a lookup field, SharePoint expects it in a different format
                    'ProjectId': link.projectId // Use ProjectId
                };
            } else {
                // Original approach for non-lookup fields
                requestBody = {
                    '__metadata': { 'type': itemType },
                    'Title': link.title,
                    'Url': link.url,
                    'ProjectId': link.projectId
                };
            }

            console.log('Creating project link with data:', JSON.stringify(requestBody));

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify(requestBody),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Enhanced error logging
                let errorDetails = '';
                try {
                    const errorText = await response.text();
                    errorDetails = errorText;
                    console.error('SharePoint Error Response for createProjectLink:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: response.url,
                        body: errorText,
                        requestBody: requestBody
                    });
                } catch (e) {
                    errorDetails = 'Could not read error details';
                }

                throw new Error(`Failed to create project link: ${response.statusText}. Details: ${errorDetails}`);
            }

            const newItem = await response.json();

            return {
                id: newItem.Id?.toString() || '',
                title: newItem.Title || link.title,
                url: newItem.Url || link.url,
                projectId: newItem.ProjectId || link.projectId
            };
        } catch (error) {
            console.error('Error creating project link:', error);
            throw error;
        }
    }

    async updateProjectLink(link: ProjectLink): Promise<ProjectLink> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECT_LINKS}')/items(${link.id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.PROJECT_LINKS);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': link.title,
                    'Url': link.url,
                    'ProjectId': link.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to update project link: ${response.statusText}`);
            }

            return link;
        } catch (error) {
            console.error(`Error updating project link ${link.id}:`, error);
            throw error;
        }
    }

    async deleteProjectLink(linkId: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECT_LINKS}')/items(${linkId})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete project link: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting project link ${linkId}:`, error);
            throw error;
        }
    }

    async deleteProjectLinks(projectId: string): Promise<void> {
        try {
            // Get all links for the project
            const links = await this.getProjectLinks(projectId);

            // Delete each link
            for (const link of links) {
                await this.deleteProjectLink(link.id);
            }
        } catch (error) {
            console.error(`Error deleting links for project ${projectId}:`, error);
            throw error;
        }
    }

    async saveProject(project: Project): Promise<Project> {
        const cleanFields = (fields: string | string[] | undefined): string => {
            if (!fields) return '';

            if (Array.isArray(fields)) {
                return fields
                    .map(field => String(field).trim())
                    .filter(Boolean)
                    .join('; ');
            }

            // If it's a string, clean it up
            const fieldStr = String(fields);

            // If it already contains semicolons or commas, assume it's already formatted
            if (fieldStr.includes(';') || fieldStr.includes(',')) {
                return fieldStr
                    .split(/[;,]/)
                    .map(item => item.trim())
                    .filter(Boolean)
                    .join('; ');
            }

            // Otherwise, treat it as a single field
            return fieldStr.trim();
        };

        try {
            const webUrl = this.getWebUrl();
            const isNewProject = !project.id || project.id === 'new';

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.PROJECTS);

            // Clone project to avoid modifying the original
            const projectData = { ...project };

            // Store links separately
            const links = projectData.links || [];
            delete projectData.links;

            // Store team members separately
            const teamMembers = projectData.teamMembers || [];
            delete projectData.teamMembers;

            // Prepare the endpoint and method
            const endpoint = isNewProject
                ? `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items`
                : `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.PROJECTS}')/items(${project.id})`;

            const method = isNewProject ? 'POST' : 'POST'; // POST for both, but with different headers for update

            // Prepare headers
            const headers: Record<string, string> = {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': requestDigest
            };

            // Add additional headers for update
            if (!isNewProject) {
                headers['X-HTTP-Method'] = 'MERGE';
                headers['IF-MATCH'] = '*';
            }

            // Prepare the request body
            const body = {
                '__metadata': { 'type': itemType },
                'Title': projectData.title,
                'Category': projectData.category,
                'StartQuarter': projectData.startQuarter,
                'EndQuarter': projectData.endQuarter,
                'Description': projectData.description,
                'Status': projectData.status,
                'Projektleitung': projectData.projektleitung,
                'Bisher': projectData.bisher,
                'Zukunft': projectData.zukunft,
                'Fortschritt': projectData.fortschritt,
                'GeplantUmsetzung': projectData.geplante_umsetzung,
                'Budget': projectData.budget,
                'StartDate': projectData.startDate,
                'EndDate': projectData.endDate,
                'ProjectFields': cleanFields(projectData.ProjectFields)
            };

            // Send the request
            const response = await fetch(endpoint, {
                method,
                headers,
                body: JSON.stringify(body),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Project Save Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: errorText
                });
                throw new Error(`Failed to save project: ${response.statusText}`);
            }

            // Get the saved project data
            let savedProject: Project;

            if (isNewProject) {
                const newItem = await response.json();
                savedProject = {
                    ...projectData,
                    id: newItem.Id.toString(),
                    links: [],
                    teamMembers: []
                };
            } else {
                savedProject = {
                    ...projectData,
                    id: project.id,
                    links: [],
                    teamMembers: []
                };
            }

            // Handle links
            if (links && links.length > 0) {
                // Delete existing links
                await this.deleteProjectLinks(savedProject.id);

                // Create new links
                for (const link of links) {
                    await this.createProjectLink({
                        title: link.title,
                        url: link.url,
                        projectId: savedProject.id
                    });
                }

                // Add links to returned project
                savedProject.links = links;
            }

            return savedProject;
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    }

    // TEAM MEMBERS OPERATIONS
    // Get user profile picture URL from SharePoint
    async getUserProfilePictureUrl(userNameOrEmail: string): Promise<string | null> {
        try {
            const webUrl = this.getWebUrl();

            // First, try to find the user account in SharePoint
            // Remove domain part if username contains it
            let accountName = userNameOrEmail;

            // If it's an email, try to format it for SharePoint
            if (userNameOrEmail.includes('@')) {
                // For SharePoint Online format (example: i:0#.f|membership|user@domain.com)
                accountName = `i:0#.f|membership|${userNameOrEmail}`;
            } else {
                // For on-premises SharePoint format (example: domain\\username)
                // You may need to adjust this based on your SharePoint configuration
                accountName = `i:0#.w|${userNameOrEmail}`;
            }

            // URL encode the account name
            const encodedAccount = encodeURIComponent(`'${accountName}'`);

            // Call the SharePoint API to get user profile
            const endpoint = `${webUrl}/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=${encodedAccount}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                console.warn(`Could not find user profile for ${userNameOrEmail}: ${response.statusText}`);
                return null;
            }

            const userData = await response.json();

            // Get the picture URL from user profile properties
            if (userData && userData.d && userData.d.PictureUrl) {
                return userData.d.PictureUrl;
            }

            // Alternative: Try to directly access the profile picture
            const pictureUrl = `${webUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(userNameOrEmail)}`;

            // Verify if the image exists by making a HEAD request
            const imageCheck = await fetch(pictureUrl, {
                method: 'HEAD',
                credentials: 'same-origin'
            });

            if (imageCheck.ok) {
                return pictureUrl;
            }

            return null;
        } catch (error) {
            console.warn(`Error getting profile picture for ${userNameOrEmail}:`, error);
            return null;
        }
    }

    async getTeamMembersForProject(projectId: string): Promise<TeamMember[]> {
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

            // Create team members with basic info
            const teamMembers = items.map((item: any) => ({
                id: item.Id?.toString() || '',
                name: item.Title || '',
                role: item.Role || 'Teammitglied',
                projectId: item.ProjectId || projectId,
                // Store the username or email for profile lookup
                userIdentifier: item.Title || '',
                imageUrl: null
            }));

            // Fetch profile pictures for each team member
            await Promise.all(teamMembers.map(async (member: TeamMember) => {
                if (member.userIdentifier) {
                    // Check if the name contains a space (indicating first and last name)
                    const mailParts = member.userIdentifier.split(' ');
                    if (mailParts.length >= 2 && mailParts[0] && mailParts[1]) {
                        const mail = mailParts[0].toLowerCase() + '.' + mailParts[1].toLowerCase() + '@jsd.bs.ch';
                        if (mail) {
                            // Try to get profile picture using their identifier
                            member.imageUrl = await this.getUserProfilePictureUrl(mail);
                        }
                    }
                }
            }));

            return teamMembers;
        } catch (error) {
            console.error(`Error fetching team members for project ${projectId}:`, error);
            return [];
        }
    }

    async deleteTeamMembersForProject(projectId: string): Promise<void> {
        try {
            // Get all team members for the project
            const teamMembers = await this.getTeamMembersForProject(projectId);

            // Delete each team member
            for (const member of teamMembers) {
                if (member.id) {
                    await this.deleteTeamMember(member.id);
                }
            }
        } catch (error) {
            console.error(`Error deleting team members for project ${projectId}:`, error);
            throw error;
        }
    }

    async createTeamMember(teamMemberData: { name: string; role: string; projectId: string }): Promise<TeamMember> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.TEAM_MEMBERS}')/items`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.TEAM_MEMBERS);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': teamMemberData.name,
                    'Role': teamMemberData.role,
                    'ProjectId': teamMemberData.projectId
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to create team member: ${response.statusText}`);
            }

            const newItem = await response.json();

            return {
                id: newItem.Id.toString(),
                name: teamMemberData.name,
                role: teamMemberData.role,
                projectId: teamMemberData.projectId
            };
        } catch (error) {
            console.error('Error creating team member:', error);
            throw error;
        }
    }

    async deleteTeamMember(memberId: string): Promise<void> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.TEAM_MEMBERS}')/items(${memberId})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete team member: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting team member ${memberId}:`, error);
            throw error;
        }
    }

    // SETTINGS OPERATIONS
    async createSetting(settingData: { key: string; value: string; description?: string }): Promise<AppSettings> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.SETTINGS);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': settingData.key,
                    'Value': settingData.value,
                    'Description': settingData.description || ''
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to create setting: ${response.statusText}`);
            }

            const newItem = await response.json();

            return {
                id: newItem.Id.toString(),
                key: settingData.key,
                value: settingData.value,
                description: settingData.description
            };
        } catch (error) {
            console.error('Error creating setting:', error);
            throw error;
        }
    }

    async getAppSettings(): Promise<AppSettings[]> {
        try {
            const items = await this.fetchFromSharePoint(
                SP_LISTS.SETTINGS,
                'Id,Title,Value,Description'
            );

            // Map SharePoint items to AppSettings format
            return items.map(item => ({
                id: item.Id.toString(),
                key: item.Title,
                value: item.Value || '',
                description: item.Description
            }));
        } catch (error) {
            console.error('Error fetching app settings:', error);
            // Return default settings if fetch fails
            return [{
                id: '1',
                key: 'defaultSettings',
                value: JSON.stringify({
                    theme: 'dark',
                    defaultView: 'quarters',
                    showCompletedProjects: true,
                    enableNotifications: false,
                    customColors: {}
                }),
                description: 'Default application settings'
            }];
        }
    }

    async getSettingByKey(key: string): Promise<AppSettings | null> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items?$filter=Title eq '${key}'&$select=Id,Title,Value,Description`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch setting: ${response.statusText}`);
            }

            const data = await response.json();
            const items = data.value || [];

            if (items.length === 0) {
                return null;
            }

            const item = items[0];
            return {
                id: item.Id.toString(),
                key: item.Title,
                value: item.Value || '',
                description: item.Description || ''
            };
        } catch (error) {
            console.error(`Error fetching setting with key ${key}:`, error);
            return null;
        }
    }

    async updateSetting(setting: AppSettings): Promise<AppSettings> {
        try {
            const webUrl = this.getWebUrl();
            const endpoint = `${webUrl}/_api/web/lists/getByTitle('${SP_LISTS.SETTINGS}')/items(${setting.id})`;

            // Get request digest for write operations
            const requestDigest = await this.getRequestDigest();

            // Get the correct metadata type
            const itemType = await this.getListMetadata(SP_LISTS.SETTINGS);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    'Title': setting.key,
                    'Value': setting.value,
                    'Description': setting.description || ''
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to update setting: ${response.statusText}`);
            }

            // Return the updated setting
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
                    'X-HTTP-Method': 'DELETE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': requestDigest
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete setting: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting setting ${id}:`, error);
            throw error;
        }
    }

    async isCurrentUserAdmin(): Promise<boolean> {
        try {
            const webUrl = this.getWebUrl();

            // Zuerst den aktuellen Benutzer abrufen
            const userEndpoint = `${webUrl}/_api/web/currentuser`;

            const userResponse = await fetch(userEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!userResponse.ok) {
                throw new Error(`Failed to get current user: ${userResponse.statusText}`);
            }

            const userData = await userResponse.json();

            // Prüfen, ob der Benutzer ein Site-Administrator ist
            // Alternativ können Sie auch eine benutzerdefinierte Berechtigungsprüfung implementieren
            if (userData.IsSiteAdmin === true) {
                return true;
            }

            // Wenn der Benutzer kein Site-Administrator ist, können Sie auch prüfen,
            // ob er Mitglied einer bestimmten SharePoint-Gruppe ist
            const groupName = 'Roadmap Administrators'; // Passen Sie den Namen an Ihre Anforderungen an
            const groupEndpoint = `${webUrl}/_api/web/sitegroups/getByName('${groupName}')/users?$filter=Id eq ${userData.Id}`;

            const groupResponse = await fetch(groupEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=nometadata'
                },
                credentials: 'same-origin'
            });

            if (!groupResponse.ok) {
                // Wenn die Gruppe nicht existiert oder ein anderer Fehler auftritt,
                // gehen wir davon aus, dass der Benutzer kein Mitglied ist
                return false;
            }

            const groupData = await groupResponse.json();

            // Wenn der Benutzer in der Ergebnismenge enthalten ist, ist er ein Mitglied der Gruppe
            return groupData.value && groupData.value.length > 0;
        } catch (error) {
            console.error('Error checking admin status:', error);
            // Im Fehlerfall false zurückgeben, um sicherzustellen, dass keine unbefugten Aktionen ausgeführt werden
            return false;
        }
    }
}

// Create a singleton instance
export const clientDataService = new ClientDataService();