import { Database, QueryExecResult, SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js";
import { injectable } from "inversify";

/**
 * Database service interface.
 * 
 * This interface is able to load a database from a file and execute queries on it.
 */
@injectable()
export abstract class IDatabaseService {
  /**
   * Initialize the database service.
   * 
   * This method is used to initialize the database service and load the needed runtime library dependencies.
   */
  abstract initialize(): Promise<void>;

  /**
   * Load a database from a given source  .
   * 
   * @param src - The source of the database to load.
   */
  abstract loadDatabase(src: string): Promise<void>;

  /**
   * Execute a query on the loaded database.
   * 
   * @param query - The query to execute.
   */
  abstract execute(query: string): Promise<QueryExecResult[]>;
}

/**
 * An implementation of the IDatabaseService interface that uses SQLite.
 */
export class SqliteDatabaseService implements IDatabaseService {
  private sqlJsStatic: SqlJsStatic | null = null;
  private db: Database | null = null;

  constructor() {}

  async initialize() {
    // Initialize sql.js
    this.sqlJsStatic = await initSqlJs({
      locateFile: () => `/sql-wasm.wasm`,
    });
  }

  async loadDatabase(src: string) {
    const dbFileArrayBuffer = await fetch(src).then((res) => res.arrayBuffer());
    this.db = new this.sqlJsStatic!.Database(new Uint8Array(dbFileArrayBuffer));
  }

  async execute(query: string): Promise<QueryExecResult[]> {
    return this.db!.exec(query);
  }
}
