import { injectable } from "inversify";

/**
 * Interface for a log service.
 * 
 * This service is used to for internal application logging.
 */
@injectable()
export abstract class ILogService {
    abstract log(component: string, message: string): void;
    abstract error(component: string, message: string): void;
}

/**
 * Implementation of the log service based on the console.
 */
export class ConsoleLogService implements ILogService {
    log(component: string, message: string): void {
        console.log(`${component}: ${message}`);
    }

    error(component: string, message: string): void {
        console.error(`${component}: ${message}`);
    }
}