import { QueryExecResult } from "sql.js";
import { naturalLanguageToSqlitePrompt } from "../prompts/naturalLanguageToSqlitePrompt";
import { IReferenceManagerService } from "../state/ReferenceManagerService";
import { IDatabaseService } from "./DatabaseService";
import { ILogService } from "./LogService";
import { IOpenaiLlmService } from "./OpenaiLlmService";
import { inject, injectable } from "inversify";
import { TYPES } from "../ioc/types";
import { HeatMapCell } from "../react/components/HeatMap";

/**
 * Above this number of results in the DB query,
 * pass the table through to the next stage via the {@link IReferenceManagerService}.
 */
const TABLE_PASS_THRU_THRESHOLD = 15;

// class to process natural language queries into sql and execute them in the DB
export interface QueryProps {
  /**
   * The natural language question originally provided by the user.
   */
  originalUserQuestion: string;
  /**
   * The data query to execute. Focuses on the data that is being queried.
   * 
   * It is based in the question, but it is more specific to the data being queried.
   */
  modelDatabaseQuery: string;
  /**
   * Whether to only return the ids of the results.
   */
  onlyNeedListOfIds?: boolean;
  /**
   * Whether the query involves property names.
   */
  involvesModelData?: boolean;
  /**
   * When querying for a table, whether to pass the table through to the next stage via the {@link IReferenceManagerService}.
   */
  willPassThruAsTable?: boolean;
  /**
   * Whether to return just the 1st column of the 1st row of the result set.
   */
  onlyNeedASingleValue?: boolean;
  /**
   * Whether to return a heat map.
   */
  wantHeatMap?: boolean;
}

export interface OverviewResult {
  /**
   * The title of the overview.
   */
  title: string;
  /**
   * The description of the overview.
   */
  description: string;
  /**
   * The content of the overview.
   */
  content: string;
  /**
   * The time it took to generate the overview.
   */
  time: number;
}

/**
 * Interface for a database query service.
 * 
 * This service is used to process natural language queries into the model database.
 */
@injectable()
export abstract class IDatabaseQueryService {
  /**
   * Perform a natural language query into the model database.
   * 
   * @param cfg - The query configuration.
   * @returns The result of the query.
   */
  abstract executeQuery(cfg: QueryProps): Promise<string>;

  /**
   * Get genreal insights from the model database.
   * 
   * @returns The insights.
   */
  abstract getOverview(): Promise<OverviewResult[]>;
}

export class DatabaseQueryService implements IDatabaseQueryService {
  constructor(
    @inject(TYPES.DatabaseService) private databaseService: IDatabaseService,
    @inject(TYPES.OpenaiLlmService) private llm: IOpenaiLlmService,
    @inject(TYPES.ReferenceManagerService) private referenceManager: IReferenceManagerService,
    @inject(TYPES.LogService) private logger: ILogService
  ) {}

  async executeQuery(cfg: QueryProps): Promise<string> {
    const storeyNames = await this.getStoreyNames();

    const { propertyCaption, propertyNames } = await this.getPropertyNames(cfg);

    const prompt = naturalLanguageToSqlitePrompt(
      cfg.originalUserQuestion,
      cfg.modelDatabaseQuery,
      storeyNames,
      propertyCaption,
      propertyNames
    );

    const result = await this.llm.getResponse(prompt);

    let sql = result.content.toString();

    // Sanitize the sql
    sql = (sql.substring(7, sql.length - 4) + ";").split("\n").join(" ");

    this.logger.log("natural-language-query-processor", sql);

    // Execute a read-only query
    let sqlResult: QueryExecResult[];

    try {
      sqlResult = await this.databaseService.execute(sql);
    } catch (err) {
      this.logger.error(
        "natural-language-query-processor",
        (err as Error)?.toString()
      );
      return "There was en error querying the data";
    }

    this.logger.log(
      "natural-language-query-processor",
      `Num DB results: ${sqlResult.length} x ${sqlResult[0].values.length}`
    );

    if (cfg.onlyNeedASingleValue) {
      return `The single value is ${sqlResult[0].values[0][0]!.toString()}`;
    }

    if (cfg.onlyNeedListOfIds) {
      const index = sqlResult[0].columns.indexOf("id");

      if (sqlResult[0].values.length == 0) {
        return "No results found";
      }

      if (sqlResult[0].values.length == 1) {
        return `The id of the object found is ${sqlResult[0].values[0][index]!.toString()}`;
      }

      const uid = this.referenceManager.storeIdList(
        sqlResult[0].values.map((x) => x[index]!.toString())
      );

      this.logger.log(
        "natural-language-query-processor",
        `Will use uid ${uid} containing ${sqlResult[0].values.length} id's`
      );

      return `The single id is ${uid}`;
    }

    return this.convertResultToPlainText(sqlResult, cfg);
  }

  private async getStoreyNames(): Promise<string> {
    const storeysSql =
      "select distinct storey from object where length(storey) > 0;";

    const storeyResult = await this.databaseService.execute(storeysSql);

    return storeyResult[0].values.map((x) => x.toString()).join("|");
  }

  private async getPropertyNames(
    cfg: QueryProps
  ): Promise<{ propertyCaption: string; propertyNames: string }> {
    if (!(cfg.involvesModelData || cfg.wantHeatMap)) {
      return { propertyCaption: "", propertyNames: "" };
    }

    const fullPropertyNamesSql =
      'select distinct property_group || "." || name from object_properties where length(value) > 0;';

    const fullPropertyNamesResult = await this.databaseService.execute(fullPropertyNamesSql);

    const singlePropertyNamesSql =
      'select distinct name from object_properties where length(value) > 0;';

    const singlePropertyNamesResult = await this.databaseService.execute(singlePropertyNamesSql);

    const propertyCaption = `- **Map property names**: When asked to filter based in property groups/names, make sure to map the properties provided by the user into the most similar ones as defined in the instructions in the **Property access instructions** section below.`;

    const propertyNames = `
# Property access instructions

When accessing properties, you can choose to use the full property name or the single property name:

- When using the full property name, you can access the property by using both the property group name and the property name:

  (both accessors refer to the \`object_properties\` table)

  - The property group name, in the \`property_group\` column
  - The property name, in the \`name\` column

- When using the single property name, you can access the property by using the property name:

  (the accessor refers to the \`object_properties\` table)

  - The property name, in the \`name\` column

## Full property names available in the model

Here are the full property names available in the model in the format of \`{property_group}.{name}\`:

${fullPropertyNamesResult[0].values.map((x) => " - " + x.toString()).join("\n")}

## Single property names available in the model

Here are the single property names available in the model in the format of \`{name}\`:

${singlePropertyNamesResult[0].values.map((x) => " - " + x.toString()).join("\n")}
`;

    this.logger.log("natural-language-query-processor", `LLM property section length: ${propertyNames.length}`);

    return { propertyCaption, propertyNames };
  }

  private convertResultToPlainText(
    sqlResult: QueryExecResult[],
    cfg: QueryProps
  ): string {
    if (cfg.wantHeatMap) {
      return this.convertResultToHeatMap(cfg, sqlResult);
    }

    // Process the result
    let plainTextResult =
      "| " +
      sqlResult[0].columns.join(" | ") +
      " |" +
      "\n" +
      "| " +
      sqlResult[0].columns.map(() => "---").join(" | ") +
      " | " +
      "\n" +
      "| " +
      sqlResult[0].values.map((v) => v.join(" | ")).join(" |\n| ") +
      " |\n";

    if (sqlResult[0].values.length > 100 && !cfg.willPassThruAsTable) {
      return `The data search returned ${sqlResult[0].values.length} results, which is more than the recommended 100 results.
        
Instruct the user with kind words to restrict a bit more the search term.`;
    }

    if (cfg.willPassThruAsTable && sqlResult[0].values.length > TABLE_PASS_THRU_THRESHOLD) {
      if (sqlResult[0].values.length == 1) {
        plainTextResult =
          "| Property | Value |\n| --- | --- |\n" +
          "| " +
          sqlResult[0].columns
            .map((c, i) => `${c} | ${sqlResult[0].values[0][i]}`)
            .join(" |\n| ") +
          " |\n";
      }

      this.logger.log("natural-language-query-processor", plainTextResult);

      return this.referenceManager.storeTable(plainTextResult);
    }

    return plainTextResult;
  }

  private convertResultToHeatMap(cfg: QueryProps, sqlResult: QueryExecResult[]): string {
    let use2Columns = false;
    // Check that there are three columns in the resuklt set
    if (sqlResult[0].columns.length != 3) {
      if (sqlResult[0].columns.length == 2) {
        use2Columns = true;
      } else {
        debugger;
        return "Error: the result set must have three columns in order to be converted to a heat map.";
      }
    }

    let values : HeatMapCell[];

    try {
      values = sqlResult[0].values.map((v) => ({
        x: v[0]?.toString() ?? "",
        y: use2Columns ? "" : v[1]?.toString() ?? "",
        value: use2Columns ? Number(v[1]) : Number(v[2])
      }));
    } catch (err) {
      return "Error: the result set must have three columns in order to be converted to a heat map.";
    }

    let labels = {
      x: sqlResult[0].columns[0].toString(),
      y: use2Columns ? "" : sqlResult[0].columns[1].toString(),
      value: sqlResult[0].columns[use2Columns ? 1 : 2].toString()
    }

    this.logger.log("database-query-service", `Heat map values: ${JSON.stringify({labels, values}, null, 2)}`);

    const reference = this.referenceManager.storeHeatMap(JSON.stringify({labels, values}));

    return `Return this answer as is:

\`\`\`heat-map
${reference}
\`\`\``
;
  }

  async getOverview(): Promise<OverviewResult[]> {
    try {
      const retVal: OverviewResult[] = [];
      
      let t0 = performance.now();

      const objectCountSql = `
  select type, count(1) from object group by 1 order by count(1) desc
  `;

      const objectCountResult = await this.databaseService.execute(objectCountSql);
      
      this.logger.log("database-query-service", `Object count query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Object count",
        description: "This is the count of objects of each type:",
        content: objectCountResult[0].values.map((x) => `- ${x[0]}: ${x[1]}`).join("\n"),
        time: performance.now() - t0
      });

      const propertyCountSql = `
    WITH property_count as (
          select o.type,
                count(1) as cnt
            from object o, object_properties op
          where op.object_id = o.id
          group by 1
      ), 
        object_count as (
          select o.type,
                count(1) as cnt
            from object o
          group by 1
        )
  SELECT object_count.type as 'Object type',
        property_count.cnt as 'Total properties',
        property_count.cnt / object_count.cnt as 'Average num. of properties per object'
    FROM object_count, property_count
  WHERE object_count.type = property_count.type
  `;

      t0 = performance.now();

      const propertyCountResult = await this.databaseService.execute(propertyCountSql);

      this.logger.log("database-query-service", `Property count query execution time: ${performance.now() - t0} ms`);

      let tmpText =
        "| " +
        propertyCountResult[0].columns.join(" | ") +
        " |" +
        "\n" +
        "| " +
        propertyCountResult[0].columns.map(() => "---").join(" | ") +
        " | " +
        "\n" +
        "| " +
        propertyCountResult[0].values.map((v) => v.join(" | ")).join(" |\n| ") +
        " |\n";

        retVal.push({
          title: "Property count",
          description: "This is the count of properties of each object type:",
          content: tmpText,
          time: performance.now() - t0
        });

      const distinctPropertyNamesSql = `
  SELECT o.type, GROUP_CONCAT(DISTINCT op.name) 
    FROM object o, object_properties op
  WHERE o.id = op.object_id GROUP BY o.type
  `;

      t0 = performance.now();

      const distinctPropertyNamesResult = await this.databaseService.execute(distinctPropertyNamesSql);

      this.logger.log("database-query-service", `Distinct property names query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Distinct property names",
        description: `This is the list of distinct property names of each object type.

Next to each object type, you can see the list of distinct property names that are available for that object type separated by commas.`,
        content: distinctPropertyNamesResult[0].values.map((x) => `- ${x[0]}: ${x[1]}`).join("\n"),
        time: performance.now() - t0
      });

      const valueRepetitionRatioSql = `
  SELECT op.name, count(1) / count(distinct op.value) as "Value repetition ratio"
    FROM object_properties op
  GROUP BY op.name;
      `;

      t0 = performance.now();

      const valueRepetitionRatioResult = await this.databaseService.execute(valueRepetitionRatioSql);

      this.logger.log("database-query-service", `Value repetition ratio query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Value repetition ratio",
        description: `This is the value repetition ratio of each property.

  It can be used to identify properties that have a high or low number of different values,
  which can be a sign of a problem in the data, and can be reflected into a low MMI score.`,
        content: valueRepetitionRatioResult[0].values.map((x) => `- ${x[0]}: ${x[1]}`).join("\n"),
        time: performance.now() - t0
      });

      const propertySetUsageSql = `
  SELECT op.property_group,
         count(distinct(object_id)), 
         group_concat(distinct(object_type)) 
    FROM object_properties op, object o 
  WHERE o.id = op.object_id 
  GROUP BY 1 
  ORDER BY 1;
      `;

      t0 = performance.now();

      const propertySetUsageResult = await this.databaseService.execute(propertySetUsageSql);

      this.logger.log("database-query-service", `Property set usage query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Property set usage",
        description: `This is the count of objects and the list of object types that have each property set.

  It can be used to identify property sets that are extensively used by a vast different set of object types,
  which can give additional insights into the data.

  Specifically, it shows what type of "data templates" (if we consider the property sets to the be the data templates)
  are applied to each object type.`,
        content: propertySetUsageResult[0].values.map((x) => `- ${x[0]}: used by ${x[1]} objects
  - used by the following object types: ${x[2]}`).join("\n"),
        time: performance.now() - t0
      });

  const topPropertyValuesSql = `
SELECT name,
       value,
       count(1)
  FROM object_properties
 GROUP BY 1, 2
 ORDER BY count(1) DESC
 LIMIT 100;
`;

      t0 = performance.now();

      const topPropertyValuesResult = await this.databaseService.execute(topPropertyValuesSql);

      this.logger.log("database-query-service", `Top property values query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Top property values",
        description: `This is the list of the top 100 most frequent used BIM property values:

  It can be used to identify the most recurring property values, which can be at same time a sign of a
  problem in the data (in case of a high repetition of invalid or placeholder values) or a sign of good data
  health (in case of a good usage of data normalization for sensible values).`,
        content: topPropertyValuesResult[0].values.map((x) => `- ${x[0]}: the value '${x[1]}' appears ${x[2]} times`).join("\n"),
        time: performance.now() - t0
      });

//   const propertySetCombinationCountSql = `
// WITH sorted_groups AS (
//     -- 1) For each object, select distinct property_group sorted in ascending order
//     SELECT 
//         object_id,
//         property_group
//     FROM object_properties
//     GROUP BY object_id, property_group
//     ORDER BY object_id, property_group
// ),
// combined AS (
//     -- 2) For each object_id, build a comma-separated string of property_group’s
//     SELECT 
//         object_id,
//         GROUP_CONCAT(property_group, ',') AS property_groups
//     FROM sorted_groups
//     GROUP BY object_id
// )
// -- 3) Count how many objects share that exact set of property_group's
// SELECT 
//     property_groups,
//     COUNT(*) AS number_of_objects
// FROM combined
// GROUP BY property_groups
// ORDER BY number_of_objects DESC, property_groups;
// `;

//       const propertySetCombinationCountResult = await this.databaseService.execute(propertySetCombinationCountSql);

//       resultText += `

//   # Property set combination count

//   This is the count of objects that have each property set combination:

//   It can be used to identify what property sets are used together, indicating that they are related, and can reveal that some property sets are used together more often than others, which can give additional insights into the data.

//   It also might reveal some improper combinations of property sets, or sensible usages or property set combinations, which can be reflected into the MMI score.

//   ${propertySetCombinationCountResult[0].values.map((x) => `- ${x[1]} objects use this property set combination: ${x[0]}`).join("\n")}
//   `;

  const storeyUsageCountSql = `
SELECT storey, count(1), group_concat(distinct type) 
  FROM object 
 GROUP BY 1;
`;

      t0 = performance.now();

      const storeyUsageCountResult = await this.databaseService.execute(storeyUsageCountSql);

      this.logger.log("database-query-service", `Storey usage count query execution time: ${performance.now() - t0} ms`);

      retVal.push({
        title: "Storey type count",
        description: `This is the count of objects of each type for each storey:

This is the count of objects of each type for each storey:

This can be used to identity the level of detail of the model for each storey,
indicating that the model might contain more or less detail for each storey.

It is relevant information to the user in order to understand the model and the data,
in case there is some storey sets with more or less objects than some other storey sets.
  `,
        time: performance.now() - t0,
        content: storeyUsageCountResult[0].values.map((x) => `- ${x[0]}: ${x[1]} objects with combinations of types: ${x[2]}`).join("\n"),
      });

//       const identityDataSql = `
// SELECT DISTINCT name,
//                 value
//            FROM object_properties
//           WHERE object_id in (SELECT id FROM object WHERE type IN ('IfcProject', 'IfcSite', 'IfcProject'));`

//       t0 = performance.now();

//       const identityDataResult = await this.databaseService.execute(identityDataSql);

//       this.logger.log("database-query-service", `Identity data query execution time: ${performance.now() - t0} ms`);

//       if (false &&identityDataResult.length > 0) {
//         resultText += `

//   ## Identity data

//   This is the list of distinct property groups, names and values of the objects of type IfcProject and IfcSite:

//   This can help you identify the identity of the model, including the project location and some further insights on the type of the project, including its discipline and category/type.

//   This can be a random collection of properties, so it might contain some unneeded noise, but pay special attention to the property names and values that might give you additional insights on the type of the project, including its location, discipline and category/type.

//         ${identityDataResult[0].values.map((x) => `- ${x[0]}: ${x[1]}`).join("\n")}
//         `;
//       }

      return retVal;
    } catch (err) {
      this.logger.error(
        "database-query-service",
        (err as Error)?.toString()
      );
      throw err;
    }
  }
}