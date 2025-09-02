import { Grid } from "gridjs";

/**
 * Natural sort of two strings.
 * 
 * @param a - The first string.
 * @param b - The second string.
 * 
 * @returns The result of the natural sort.
 */
function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Extract columns and data from the HTML table.
 * 
 * @param table - The HTML table element.
 * 
 * @returns The columns and data of the table.
 */
function extractTableData(table: Element) {

  // Extract columns from the <thead>
  const columns = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent);

  // Extract rows from the <tbody>
  const data = Array.from(table.querySelectorAll("tbody tr")).map(tr =>
    Array.from(tr.querySelectorAll("td")).map(td => td.textContent)
  );

  return { columns, data };
}

function processTable(element: Element) {

    const { columns, data } = extractTableData(element);

    const newDiv = document.createElement("div");
  
    newDiv.classList.add("my-grid-js-wrapper");
  
    element.parentNode!.insertBefore(newDiv, element.nextSibling);
    element.parentElement!.removeChild(element);
  
    try {
      const grid = new Grid({
        search: true,
        pagination: {
          nextButton: false,
          prevButton: false,
          limit: 15,
          summary: false,
        },
        columns: columns.map((name, index) => ({
          name,
          sort: {
            // Apply natural sorting for all columns.
            compare: naturalSort,
            // By default, sort the first column in ascending order.
            direction: index === 0 ? 1 : undefined
          },
        })),
        data,
        sort: true,
        language: {
          search: {
            placeholder: "🔍 Table search...",
          },
        },
      });
      
      grid.render(newDiv);

      console.log("Converterd to Grid table");
    } catch (err) {
      console.error(err);
    }
  }
  
  export const useGridJsTableConverter = (intervalMs: number = 50) => {
    let _running = false;
  
    const intervalId = setInterval(
        async () => {
            if (_running) {
                return;
            }
            _running = true;
            const elements = document.getElementsByClassName("markdown-table");
        
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
        
                if (!element.classList.contains("pending")) {
                continue;
                }
        
                processTable(element);
        
                element.classList.remove("pending");
            }
            _running = false;
        },
        intervalMs
    );

    return () => clearInterval(intervalId);
}