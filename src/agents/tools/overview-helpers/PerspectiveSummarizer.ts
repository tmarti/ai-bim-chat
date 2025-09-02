import { resolve } from "../../../ioc/inversify.config";
import { OverviewResult } from "../../../services/DatabaseQueryService";

const createPerspectiveAnalysisPrompt = (
    perspective: OverviewResult,
    question: string
) => {
    return `
    **System/Assistant Directive**: You are a BIM Data Analysis Extractor Assistant.
    
    Your purpose is to exmaine the following data overview and extract from it the most relevant data aspects
    based in the user question:
    
    - Pay attention the user question and in case it puts the focus on a specific aspect of the data,
    such as a specific property, specific type of data, specific type of object, storey, etc... then focus
    on that aspect and ignore the rest of the data.
    
    - In case no data is relevant to the user question, then just return an string indicating that no data is relevant
    to the user question.
    
    - In case the user is asking for a general overview of the data, then just return a general overview of the data
    formatted according to the user question.
    
    Your feedback will further processed and aggregated with other feedback to provide a final summary of the data.
    
    # Title and description of the data overview
    
    **${perspective.title}**: ${perspective.description}
    
    # Data Overview
    
    ${perspective.content}
    
    # User Question
    
    ${question}
`;
}

export const summarizePerspective = async (perspective: OverviewResult, question: string) => {
    const openaiLlmService = resolve('OpenaiLlmService');
    const prompt = createPerspectiveAnalysisPrompt(perspective, question);
    console.log(prompt);
    const summary = await openaiLlmService.getSimpleResponseFromTextPromiseFriendly(prompt);

    return {
        summary,
        title: perspective.title
    };
}