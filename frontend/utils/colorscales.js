import { drawPoint } from "./draw_functions.js";
import {
  generateContinuousLegend,
  generateDiscreteLegend,
} from "./overlay_handlers.js";

async function applyYearColors({ state, point_container }) {
  const scheme = d3.interpolatePlasma;
  let min_val = state.metadata.get("min_year");
  let max_val = state.metadata.get("max_year");

  point_container.removeChildren();

  Promise.all(
    state.current_displayed_data.map((data_point) =>
      drawPoint({
        data_point: data_point,
        point_container: point_container,
        texture: state.texture,
        scale: state.default_scale,
        scaling: state.current_scaling,
        tint: scheme((data_point.year - min_val) / (max_val - min_val)),
        alpha: 0.7,
      })
    )
  );

  const discrete_legend = document.getElementById("discrete-legend");
  const continuous_legend = document.getElementById("continuous-legend");
  discrete_legend.style.display = "none";
  generateContinuousLegend({
    legend_element: continuous_legend,
    scheme: scheme,
    min_val: min_val,
    max_val: max_val,
  });
  continuous_legend.style.display = "flex";
}

async function applyCategoryColors({ state, point_container }) {
  let category_colors = state.metadata.get("category_colors");

  point_container.removeChildren();
  Promise.all(
    state.current_displayed_data.map((data_point) =>
      drawPoint({
        data_point: data_point,
        point_container: point_container,
        texture: state.texture,
        scale: state.default_scale,
        scaling: state.current_scaling,
        tint: category_colors.get(data_point.category),
        alpha: 0.7,
      })
    )
  );

  const discrete_legend = document.getElementById("discrete-legend");
  const continuous_legend = document.getElementById("continuous-legend");
  continuous_legend.style.display = "none";
  generateDiscreteLegend({
    state: state,
    legend_element: discrete_legend,
    point_container: point_container,
  });
  discrete_legend.style.display = "flex";
}

export { applyYearColors, applyCategoryColors };
