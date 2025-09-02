import { DynamicStructuredTool } from 'langchain/tools';
import { OverviewResult } from '../../services/DatabaseQueryService';
import { resolve } from '../../ioc/inversify.config';
import { toolNames } from '../../services/ToolRegistryService';
import { z } from "zod";
import { summarizePerspective } from './overview-helpers/PerspectiveSummarizer';
import { aggregateSummaries } from './overview-helpers/SummaryAggegator';
import { OverviewReference } from '../../state/ReferenceManagerService';

const analyzeData = async (overview: OverviewResult[], question: string) => {
    const dataPerspectives = await Promise.all(overview.map(async (x) => {
        return summarizePerspective(x, question);
    }));

    console.log({dataPerspectives});

    return aggregateSummaries(dataPerspectives, question);
}

const launchDataAnalysis = async (overviewReference: OverviewReference, overview: OverviewResult[], question: string) => {
    const thinkingManager = resolve('ThinkingIndicatorService');
    const referenceManager = resolve('ReferenceManagerService');
    const intervalId1 = setInterval(() => {
        thinkingManager.setThinking({
            message: 'Analyzing data insights...',
        });
    }, 50);

    console.time('advanced-response');

    const aggregatedSummaryStream = await analyzeData(overview, question);

    clearInterval(intervalId1);

    let llmOutput = '';

    for await (const chunk of aggregatedSummaryStream){
        llmOutput += chunk.content.toString();
        referenceManager.updateOverview(overviewReference, {
            text: llmOutput,
            finished: false,
        });
    }

    referenceManager.updateOverview(overviewReference, {
        text: llmOutput,
        finished: true,
    });

    console.timeEnd('advanced-response');
}

export class DatabaseOverviewTool extends DynamicStructuredTool {
    private cachedOverview: OverviewResult[] | null = null;

    private generateOverview = async () => {
        if (this.cachedOverview) {
            return this.cachedOverview;
        }
        // const logger = resolve('LogService');

        const databaseQueryService = resolve('DatabaseQueryService');
        const overview = await databaseQueryService.getOverview();

        // logger.log("database-overview-tool", overview);

        this.cachedOverview = overview;

        return overview;
    }

    constructor() {
        super({
            name: 'DatabaseOverviewTool' satisfies toolNames,
            description: `
Obtains a report with answers to general questions about the data contained in the BIM model database.

Is specifically designed to answer questions about cross-cutting data insights,
as oppossed to directed database queries.

The report input is a set of instructions to process and analyze the BIM model database and provide
a synthetic report of the data based on answering the provided question.`,
            schema: z.object({
                originalUserQuestion: z.string().describe("The complete original question provided by the user plus any needed extra context to carry the query."),
            }),
            func: async ({originalUserQuestion}:{originalUserQuestion:string}) => {
                await new Promise(resolve => setTimeout(resolve, 20));

                const overview = await this.generateOverview();

                console.log(overview);

                let llmOutput = '';

                const referenceManager = resolve('ReferenceManagerService');

                const overviewReference = referenceManager.storeOverview({
                    text: llmOutput,
                    finished: false,
                });

                launchDataAnalysis(overviewReference, overview, originalUserQuestion);

                const retVal = `
Return this fence block as is to the user:

\`\`\`embedded-markdown
${overviewReference}
\`\`\`

This will allow the user to see the data overview answer in the chat.
`;

                return retVal;
            }
        });
    }
}
