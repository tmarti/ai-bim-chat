import { generateThinkingHtmlBlock } from "./util";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import { v4 as uuid } from "uuid";
import MarkdownIt from "markdown-it";
import Chart, { ChartConfiguration, ChartType } from 'chart.js/auto'

interface ChartConfig {
  type: string;
  title: string;
  labels: string[];
  data: number[];
}

export class ChartJsFenceBlockProcessor extends IFenceBlockProcessor {
  public process(_type: string, block: string, _md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {

    if (env.isStreaming) {
        return {
            async: false,
            content: generateThinkingHtmlBlock('Generating chart...')
        };
    }

    const uid = `canvas-${uuid()}`;

    const data = JSON.parse(block) as ChartConfig;

    return {
      async: false,
      content: `
<div class="chart-container">
  <canvas class="chart-canvas" id="${uid}" height="${50 + data.labels.length * 30}">
  </canvas>
</div>
`,
      afterProcessing: () => this.generateChartWithChartJs(data, uid, env),
    };
  }

  private async generateChartWithChartJs(data: ChartConfig, uid: string, env: MarkdownItEnv) {
    
    const minMaxValueRatio = Math.max(...data.data) / Math.min(...data.data);

    // const useLogScale = data.type === 'bar' && minMaxValueRatio > 10;

    const config : ChartConfiguration = {
        type: data.type as ChartType,
        data: {
            labels: data.labels,
            datasets: [{
              data: data.data,
              backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
        },
        options: {
          // animation: {
          //   duration: 0
          // },
          indexAxis: 'y',
          // Elements options apply to all of the options unless overridden in a dataset
          // In this case, we are setting the border of each horizontal bar to be 2px wide
          elements: {
            bar: {
              borderWidth: 2,
            }
          },
          // scales: {
          //   x: {
          //     type: useLogScale ? 'logarithmic' : 'linear',
          //   }
          // },
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: data.title
            },
            tooltip: { enabled: false }, // Disable tooltips
            legend: { display: data.type === 'pie' } // Hide legend if desired
          },
          interaction: { mode: undefined } // Disable hover interaction
        },
      };
      
      const element = document.getElementById(uid) as HTMLCanvasElement;

      new Chart(
        element,  
        config,
      );
    }
}
