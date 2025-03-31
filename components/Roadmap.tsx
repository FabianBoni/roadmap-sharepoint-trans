import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';

// Define interfaces for our types
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  dueDate: string;
}

interface RoadmapColumn {
  id: string;
  title: string;
  items: RoadmapItem[];
}

export const Roadmap: React.FC = () => {
  const [columns, setColumns] = useState<{[key: string]: RoadmapColumn}>({
    planned: {
      id: 'planned',
      title: 'Planned',
      items: []
    },
    inProgress: {
      id: 'inProgress',
      title: 'In Progress',
      items: []
    },
    completed: {
      id: 'completed',
      title: 'Completed',
      items: []
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newItem, setNewItem] = useState<Partial<RoadmapItem>>({
    title: '',
    description: '',
    dueDate: ''
  });

  // Simulate loading data from an API
  useEffect(() => {
    const fetchData = async () => {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockData = {
        planned: {
          id: 'planned',
          title: 'Planned',
          items: [
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
            }
          ]
        },
        inProgress: {
          id: 'inProgress',
          title: 'In Progress',
          items: [
            {
              id: '3',
              title: 'API integration',
              description: 'Connect to backend services',
              status: 'in-progress',
              dueDate: '2023-11-20'
            }
          ]
        },
        completed: {
          id: 'completed',
          title: 'Completed',
          items: [
            {
              id: '4',
              title: 'Project setup',
              description: 'Initialize repository and project structure',
              status: 'completed',
              dueDate: '2023-10-30'
            }
          ]
        }
      };
      
      setColumns(mockData as any);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Moving between columns
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      
      // Update the status when moving between columns
      const updatedItem: RoadmapItem = {
        ...removed,
        status: destination.droppableId === 'inProgress' 
          ? 'in-progress' 
          : (destination.droppableId as 'planned' | 'completed')
      };
      
      destItems.splice(destination.index, 0, updatedItem);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems
        }
      });
    } else {
      // Moving within the same column
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems
        }
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.title) return;
    
    const item: RoadmapItem = {
      id: Date.now().toString(),
      title: newItem.title || '',
      description: newItem.description || '',
      status: 'planned',
      dueDate: newItem.dueDate || format(new Date(), 'yyyy-MM-dd')
    };
    
    setColumns({
      ...columns,
      planned: {
        ...columns.planned,
        items: [...columns.planned.items, item]
      }
    });
    
    setNewItem({
      title: '',
      description: '',
      dueDate: ''
    });
    
    setDialogVisible(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-200">Loading roadmap...</span>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto bg-gray-900 text-white">
      <div className="mb-5">
        <h1 className="text-4xl font-bold mb-5">Project Roadmap</h1>
        <button 
          onClick={() => setDialogVisible(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
        >
          Add New Item
        </button>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex justify-between gap-5">
          {Object.values(columns).map(column => (
            <div key={column.id} className="bg-gray-800 rounded p-3 w-1/3">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-700 pb-2">
                {column.title} ({column.items.length})
              </h2>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[300px]"
                  >
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-gray-700 p-3 mb-2 rounded shadow-md"
                          >
                            <h3 className="text-base font-medium">{item.title}</h3>
                            <p className="text-gray-300 text-sm">{item.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Dialog for adding new items */}
      {dialogVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Roadmap Item</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input 
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea 
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
              <input 
                type="date"
                value={newItem.dueDate}
                onChange={(e) => setNewItem({...newItem, dueDate: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setDialogVisible(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;