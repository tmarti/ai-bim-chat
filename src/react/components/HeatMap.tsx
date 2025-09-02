import React from "react";

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

export interface HeatMapCell {
  x: string;   // The label on the horizontal axis
  y: string;   // The label on the vertical axis
  value: number; // The cell's numeric value
}

export interface HeatMapProps {
  /** The title of the heatmap. */
  title: string;

  /** The data to display in the heatmap. */
  values: HeatMapCell[];

  labels: {
    x: string;
    y: string;
    value: string;
  };

  /** Color used for cells that do not have a corresponding value. */
  emptyCellColor?: string;

  /** Color used for the cell(s) with the maximum value. Defaults to green. */
  maxValueColor?: string;

  /** 
   * Color used for cells that have value 0 or very close to 0. 
   * This could be used if you want a smooth gradient between minValueColor and maxValueColor.
   * Defaults to white.
   */
  minValueColor?: string;

  /**
   * Optional cell size or styling. You can also apply these via CSS.
   */
  cellSize?: number;

  /**
   * The maximum number of digits in the values.
   * 
   * If the value is longer than this, the cell will be empty.
   * 
   * This is useful if you want to avoid having values that overflow the cell.
   */
  maxDigitsInValues?: number;
}

export const HeatMap: React.FC<HeatMapProps> = ({
  title,
  labels,
  values,
  emptyCellColor = "rgb(235, 237, 240)",
  minValueColor = "#bbffbb",
  maxValueColor = "#007000",
  cellSize = 30,
  maxDigitsInValues = 3,
}) => {
  // Collect unique X and Y labels
  let xLabels = Array.from(new Set(values.map((v) => v.x)));
  xLabels.sort(naturalSort);
  let yLabels = Array.from(new Set(values.map((v) => v.y)));
  yLabels.sort(naturalSort);

  // Make sure the x dimension is the one with the least number of unique values
  if (xLabels.length > yLabels.length) {
    [xLabels, yLabels] = [yLabels, xLabels];

    values = values.map((v) => ({
      x: v.y,
      y: v.x,
      value: v.value
    }));

    labels = {
      x: labels.y,
      y: labels.x,
      value: labels.value
    };
  }

  // Add N/A to the values if they are not present
  values = values.map((v) => ({
    x: v.x.trim() || "N/A",
    y: v.y.trim() || "N/A",
    value: v.value
  }));

  // Add N/A to the labels if they are not present
  // And remove duplicates
  xLabels = xLabels.map((x) => x.trim() || "N/A");
  yLabels = yLabels.map((y) => y.trim() || "N/A");

  let tmp = [] as string[];

  for (let i = 0; i < xLabels.length; i++) {
    if (i == 0 || xLabels[i] != xLabels[i-1]) {
      tmp.push(xLabels[i]);
    }
  }
  xLabels = tmp;

  console.log(xLabels);

  tmp = [] as string[];
  for (let i = 0; i < yLabels.length; i++) {
    if (i == 0 || yLabels[i] != yLabels[i-1]) {
      tmp.push(yLabels[i]);
    }
  }
  yLabels = tmp;  

  console.log(values);

  const longestValueInDigits = Math.max(...values.map((v) => v.value.toString().length));

  // Find the maximum value among all cells
  const maxValue = Math.max(...values.map((v) => v.value), 0);

  // Build a quick lookup: (x,y) -> value
  // e.g. lookup.get("Monday-Week1") => a numeric value
  const lookup = new Map<string, number>();
  values.forEach((v) => {
    lookup.set(`${v.x}-${v.y}`, v.value);
  });

  // Optional: A helper to interpolate between two hex colors
  // for values [0..1]. If you prefer a discrete scale, you can
  // skip the gradient logic and pick from a palette instead.
  const interpolateColor = (minColor: string, maxColor: string, fraction: number) => {
    // Ensure fraction is between 0 and 1
    const clamped = Math.max(0, Math.min(1, fraction));

    // Parse #RRGGBB
    const parseHex = (hex: string) => {
      if (hex.startsWith("#")) hex = hex.slice(1);
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ];
    };

    const [r1, g1, b1] = parseHex(minColor);
    const [r2, g2, b2] = parseHex(maxColor);

    // Linear interpolation
    const r = Math.round(r1 + (r2 - r1) * clamped);
    const g = Math.round(g1 + (g2 - g1) * clamped);
    const b = Math.round(b1 + (b2 - b1) * clamped);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Determine cell background color given its value
  const getCellColor = (value?: number) => {
    // If there's no entry for this cell at all
    if (value === undefined) {
      return emptyCellColor;
    }

    // If maxValue is 0, avoid divide-by-zero
    if (maxValue === 0) {
      return maxValueColor; // or minValueColor; depends on your preference
    }

    // fraction of the maximum
    const fraction = value / maxValue;
    return interpolateColor(minValueColor, maxValueColor, fraction);
  };

  const generateTooltip = (cell: HeatMapCell, labels: HeatMapProps['labels']) => {
    return `${labels.x}: ${cell.x || 'N/A'}\n${labels.y}: ${cell.y || 'N/A'}\n${labels.value}: ${cell.value}`;
  };

  // Render as a table; you could also do a flexbox or absolutely‐positioned div grid
  return (
    <>
      <div className="heatmap-chart">
        <h2>{title}</h2>
        <table style={{ borderCollapse: "collapse" }} className="heatmap-component-table">
          <thead>
            <tr>
            <th></th>
              {xLabels.map((x) => (
                <th key={x} style={{ textAlign: "center", padding: "4px" }}>
                  {x || 'N/A'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yLabels.map((y) => (
              <tr key={y}>
                {/* Row label */}
                <th style={{ textAlign: "left", padding: "4px" }}>{y || 'N/A'}</th>

                {/* Cells in this row */}
                {xLabels.map((x) => {
                  const cellValue = lookup.get(`${x}-${y}`);
                  return (
                    <td key={`${x}-${y}`}>
                      <div
                        className="heatmap-component-cell-content"
                        data-tooltip={cellValue !== undefined ? generateTooltip({ x, y, value: cellValue }, labels) : undefined}
                        style={{
                          background: getCellColor(cellValue),
                          width: cellSize,
                          height: cellSize,
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        {/* you can show the numeric value or leave it blank */}
                        {longestValueInDigits <= maxDigitsInValues && cellValue !== undefined && cellValue > 0 ? cellValue : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <br/>
        <div style={{
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          width:"100%",
          justifyContent: "center",
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          <span style={{ position: "relative"  }}>Less</span>
          <div style={{ display: "inline-block", marginLeft: "5px", marginRight: "5px" }}>
            <table style={{ borderCollapse: "collapse" }} className="heatmap-component-table">
              <tbody>
                <tr>
                  <td style={{
                            width: 20,
                            height: 20,
                          }}>
                            <div
                              className="heatmap-component-legend-cell-content"
                              style={{
                                background: getCellColor(undefined),
                                width: 16,
                                height: 16,
                                borderRadius: "2px",
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                              }}></div>
                          </td>
                  <td style={{
                            width: 20,
                            height: 20,
                          }}>
                            <div
                              className="heatmap-component-legend-cell-content"
                              style={{
                                background: getCellColor(1),
                                width: 16,
                                height: 16,
                                borderRadius: "2px",
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                              }}></div>
                          </td>
                  <td style={{
                            width: 20,
                            height: 20,
                          }}>
                            <div
                              className="heatmap-component-legend-cell-content"
                              style={{
                                background: getCellColor(maxValue/3),
                                width: 16,
                                height: 16,
                                borderRadius: "2px",
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                              }}></div>
                          </td>
                  <td style={{
                            width: 20,
                            height: 20,
                          }}>
                            <div
                              className="heatmap-component-legend-cell-content"
                              style={{
                                background: getCellColor(maxValue*2/3),
                                width: 16,
                                height: 16,
                                borderRadius: "2px",
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                              }}></div>
                          </td>
                  <td style={{
                            width: 20,
                            height: 20,
                          }}>
                            <div
                              className="heatmap-component-legend-cell-content"
                              style={{
                                background: getCellColor(maxValue),
                                width: 16,
                                height: 16,
                                borderRadius: "2px",
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                              }}></div>
                          </td>
                </tr>
              </tbody>
            </table>
          </div>
          <span style={{ position: "relative"  }}>More</span>
        </div>
      </div>
    </>
  );
};

export default HeatMap;
