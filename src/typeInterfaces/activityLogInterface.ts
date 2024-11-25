import { userLocationInterface } from "./userInterface.js";

export type activityLogInterface = {
    userId: string;
    action: string;
    location: userLocationInterface;
    metadata: {
        ip: string;
        method: string;
        params: any;
        query: any;
        body: any;
    };
}