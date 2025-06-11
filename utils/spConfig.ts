import { spfi, SPFx } from "@pnp/sp";
import { LogLevel, PnPLogging } from "@pnp/logging";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";

// This function initializes the SharePoint client
export const getSP = (context?: any) => {
  // When running in SharePoint Framework, use the provided context
  if (context) {
    // Use numeric value instead of enum
    return spfi().using(SPFx(context)).using(PnPLogging(2)); // 2 is LogLevel.Warning
  }
    // When running in standalone mode (like local dev)
  // Use conditional path based on environment
  const basePath = process.env.NODE_ENV === 'production' 
    ? 'https://spi.intranet.bs.ch/JSD/Digital/roadmapapp' 
    : 'https://spi.intranet.bs.ch/JSD/QMServices/Roadmap/roadmapapp';
  
  return spfi(basePath)
    .using(PnPLogging(2)); // 2 is LogLevel.Warning
};

// SharePoint list names - define all your lists here
export const SP_LISTS = {
  PROJECTS: "Roadmap Projects",
  CATEGORIES: "Roadmap Categories",
  FIELD_TYPES: "Roadmap FieldTypes",
  FIELDS: "Roadmap Fields",
  TEAM_MEMBERS: "Roadmap Team Members",
  USERS: "Roadmap Users",
};