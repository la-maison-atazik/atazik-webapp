import { ActivityOption } from "./activity-option.model";

export interface ActivityCategory {
  id: string;
  name: string;
  options: ActivityOption[];
}
