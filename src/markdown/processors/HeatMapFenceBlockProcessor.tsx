import MarkdownIt from "markdown-it";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import { generateThinkingHtmlBlock } from "./util";
import HeatMap, { HeatMapCell, HeatMapProps } from "../../react/components/HeatMap";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HeatMapReference } from "../../state/ReferenceManagerService";

const HeatMapComponent = ({data}: {data: HeatMapProps}) => {
    return <HeatMap {...data} />
}

const generateHeatContainer = (data: HeatMapProps) => {
  // 1. Create an off-screen container
  const container = document.createElement('div');

  // 2. Render the React component into that container
  createRoot(container).render(<HeatMapComponent data={data} />);

  // 3. Return the container
  return container;
}

export class HeatMapFenceBlockProcessor extends IFenceBlockProcessor {

    process(type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {

        if (env.isStreaming) {
            return {
                async: false,
                content: generateThinkingHtmlBlock(`Generating chart...`)
            };
        }

        const reference = block.trim().replace("```heatmap\n", "").replace("\n```", "") as HeatMapReference;

        const data = env.referenceManager.getHeatMap(reference);

        if (!data) {
            return {
                async: false,
                content: generateThinkingHtmlBlock(`Generating chart...`)
            };
        }

        const parsedData = JSON.parse(data) as {
            labels: {
                x: string;
                y: string;
                value: string;
            };
            values: HeatMapCell[];
        };

        console.log("parsedData", JSON.stringify(parsedData, null, 2));

        const container = generateHeatContainer({
          title: "Heat Map",
          values: parsedData.values,
          labels: parsedData.labels
        });

        return {
            async: true,
            content: new Promise(async (resolve) => {
                while (!container.innerHTML) {
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                resolve(container.innerHTML);
            })
        };
    }
}