import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  dueDate: string;
}

// SharePoint list names
const ROADMAP_LIST = 'RoadmapItems';

export class SharePointService {
  private context: WebPartContext;
  
  constructor(context: WebPartContext) {
    this.context = context;
  }

  public async getRoadmapItems(): Promise<RoadmapItem[]> {
    try {
      const response = await this.context.spHttpClient.get(
        `$${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${ROADMAP_LIST}')/items?$$select=Id,Title,Description,Status,DueDate`,
        SPHttpClient.configurations.v1
      );
      
      const items = await response.json();
      
      return items.value.map((item: { Id: { toString: () => any; }; Title: any; Description: any; Status: any; DueDate: any; }) => ({
        id: item.Id.toString(),
        title: item.Title,
        description: item.Description || '',
        status: item.Status || 'planned',
        dueDate: item.DueDate || ''
      }));
    } catch (error) {
      console.error('Error fetching roadmap items:', error);
      return [];
    }
  }

  public async addRoadmapItem(item: Omit<RoadmapItem, 'id'>): Promise<RoadmapItem> {
    try {
      const body: string = JSON.stringify({
        Title: item.title,
        Description: item.description,
        Status: item.status,
        DueDate: item.dueDate
      });

      const response = await this.context.spHttpClient.post(
        `$${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${ROADMAP_LIST}')/items`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata=nometadata',
            'Content-type': 'application/json;odata=nometadata',
            'odata-version': ''
          },
          body: body
        }
      );

      const responseJson = await response.json();
      
      return {
        id: responseJson.Id.toString(),
        title: responseJson.Title,
        description: responseJson.Description || '',
        status: responseJson.Status || 'planned',
        dueDate: responseJson.DueDate || ''
      };
    } catch (error) {
      console.error('Error adding roadmap item:', error);
      throw error;
    }
  }

  public async updateRoadmapItem(item: RoadmapItem): Promise<RoadmapItem> {
    try {
      const body: string = JSON.stringify({
        Title: item.title,
        Description: item.description,
        Status: item.status,
        DueDate: item.dueDate
      });

      await this.context.spHttpClient.post(
        `$${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${ROADMAP_LIST}')/items($${item.id})`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata=nometadata',
            'Content-type': 'application/json;odata=nometadata',
            'odata-version': '',
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE'
          },
          body: body
        }
      );

      return item;
    } catch (error) {
      console.error('Error updating roadmap item:', error);
      throw error;
    }
  }
}

// For development and testing, keep the mock data
const mockData: RoadmapItem[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add login/signup functionality',
    status: 'planned',
    dueDate: '2023-12-15'
  },
  {
    id: '2',
    title: 'Create dashboard',
    description: 'Design and implement user dashboard',
    status: 'planned',
    dueDate: '2023-12-30'
  },
  {
    id: '3',
    title: 'API integration',
    description: 'Connect to backend services',
    status: 'in-progress',
    dueDate: '2023-11-20'
  },
  {
    id: '4',
    title: 'Project setup',
    description: 'Initialize repository and project structure',
    status: 'completed',
    dueDate: '2023-10-30'
  }
];

// Mock functions for development/testing
export const getRoadmapItems = async (): Promise<RoadmapItem[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [...mockData];
};

export const addRoadmapItem = async (item: Omit<RoadmapItem, 'id'>): Promise<RoadmapItem> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newItem: RoadmapItem = {
    ...item,
    id: Date.now().toString()
  };
  
  mockData.push(newItem);
  return newItem;
};

export const updateRoadmapItem = async (item: RoadmapItem): Promise<RoadmapItem> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockData.findIndex(i => i.id === item.id);
  if (index !== -1) {
    mockData[index] = item;
  }
  
  return item;
};