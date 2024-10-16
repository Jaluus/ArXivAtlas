import { toAbsolute } from "./utils.js";

async function drawHighlights({ state, highlight_container }) {
  if (highlight_container.children.length > 0) {
    highlight_container.removeChildren();
  }
  let used_alpha = state.current_highlight_papers.length > 200 ? 0.2 : 1;

  state.current_highlight_papers.forEach((data_point) => {
    const sprite = new PIXI.Sprite(state.texture);
    sprite.tint = 0x00ff00;
    sprite.x = data_point.x;
    sprite.y = data_point.y;
    sprite.anchor.set(0.5);
    sprite.scale.x = state.highlight_scale / state.current_scaling ** 0.5;
    sprite.scale.y = state.highlight_scale / state.current_scaling ** 0.5;
    sprite.alpha = used_alpha;
    highlight_container.addChild(sprite);
  });
}

const updateDisplayedData = ({ state, point_container }) => {
  let displayed_data = [];
  let cats = state.current_display_settings.categories;
  let min_date = state.current_display_settings.min_date;
  let max_date = state.current_display_settings.max_date;

  for (let i = 0; i < state.data.length; i++) {
    let datum = state.data[i];
    let is_in_category = cats.has(datum.category) || cats.size == 0;
    let is_in_year = datum.date >= min_date && datum.date <= max_date;

    if (
      datum.data === undefined ||
      datum.data === null ||
      datum.data === false
    ) {
      is_in_year = true;
    }

    if (is_in_category && is_in_year) {
      displayed_data.push(datum);
    }
  }

  state.current_displayed_data = displayed_data;
  state.quadtree = d3
    .quadtree()
    .x((d) => d.x)
    .y((d) => d.y)
    .addAll(state.current_displayed_data);

  point_container.removeChildren();
  Promise.all(
    state.current_displayed_data.map((data_point) =>
      drawPoint({
        data_point: data_point,
        point_container: point_container,
        texture: state.texture,
        scale: state.default_scale,
        scaling: state.current_scaling,
        tint: state.metadata.get("category_colors").get(data_point.category),
        alpha: 0.7,
      })
    )
  );
};

const drawGraph = ({ state, graph_container }) => {
  if (graph_container.children.length > 0) {
    graph_container.removeChildren();
  }

  let current_drawn_point;
  if (state.current_fixed_point) {
    current_drawn_point = state.current_fixed_point;
  } else if (state.current_selected_point) {
    current_drawn_point = state.current_selected_point;
  } else {
    return;
  }

  let current_idx = current_drawn_point.index;
  let edges = state.connectivity_list[current_idx];
  let available_idxs = state.current_displayed_data.map((point) => point.index);
  for (let i = 0; i < edges.length; i++) {
    let edge_idx = edges[i][0];
    let edge_score = edges[i][1];
    if (!available_idxs.includes(edge_idx)) {
      continue;
    }

    let connected_point = state.data[edges[i][0]];
    let color = d3.interpolatePlasma((i + 1) / edges.length);

    const edge = new PIXI.Graphics();
    edge.lineStyle(3 / state.current_scaling, color, 1);
    edge.moveTo(current_drawn_point.x, current_drawn_point.y);
    edge.lineTo(connected_point.x, connected_point.y);
    graph_container.addChild(edge);

    const node = new PIXI.Graphics();
    node.beginFill(color);
    node.drawCircle(0, 0, 1.5);
    node.endFill();
    node.position.set(connected_point.x, connected_point.y);
    node.scale.x = 1 / state.current_scaling ** 0.5;
    node.scale.y = 1 / state.current_scaling ** 0.5;
    graph_container.addChild(node);
  }
};

const handleZooming = ({
  state,
  point_container,
  graph_container,
  highlight_container,
}) => {
  let abs_pos = toAbsolute({
    point: state.current_pos,
    reference_point: point_container,
    scaling: state.current_scaling,
  });

  state.current_scaling -=
    Math.max(-1, Math.min(1, state.scroll_delta)) *
    state.scale_speed *
    state.current_scaling;
  state.current_scaling = Math.min(100, Math.max(0.2, state.current_scaling));

  [point_container, graph_container, highlight_container].forEach(
    (container) => {
      container.setTransform(
        -abs_pos.x * state.current_scaling + state.current_pos.x,
        -abs_pos.y * state.current_scaling + state.current_pos.y,
        state.current_scaling,
        state.current_scaling
      );
    }
  );

  point_container.children.forEach((child) => {
    child.scale.x = state.default_scale / state.current_scaling ** 0.5;
    child.scale.y = state.default_scale / state.current_scaling ** 0.5;
  });
  highlight_container.children.forEach((child) => {
    child.scale.x = state.highlight_scale / state.current_scaling ** 0.5;
    child.scale.y = state.highlight_scale / state.current_scaling ** 0.5;
  });

  if (graph_container.children.length > 0) {
    graph_container.removeChildren();
    drawGraph({
      state: state,
      graph_container: graph_container,
    });
  }
};

async function drawPoint({
  data_point,
  texture,
  point_container,
  scaling = 1,
  scale = 1,
  tint = 0xffffff,
  alpha = 1,
}) {
  const sprite = new PIXI.Sprite(texture);
  sprite.tint = tint;
  sprite.x = data_point.x;
  sprite.y = data_point.y;
  sprite.anchor.set(0.5);
  sprite.scale.x = scale / scaling ** 0.5;
  sprite.scale.y = scale / scaling ** 0.5;
  sprite.alpha = alpha;
  point_container.addChild(sprite);
}

export {
  drawGraph,
  handleZooming,
  drawHighlights,
  drawPoint,
  updateDisplayedData,
};
