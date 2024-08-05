import {
  updatePaperDisplayDPG,
  updateInfoModalDPG,
  drawAnnotationDPG,
  updatePaperDisplay,
  updateInfoModal,
  drawAnnotation,
} from "./utils/overlay_handlers.js";
import {
  handleSearchQuery,
  updateSearchResults,
} from "./utils/input_handlers.js";
import {
  toAbsolute,
  fetchDataWithStream,
  parseData,
  parseDataDPG,
  parseConnectivityList,
  extractConstants,
  updateProgress,
} from "./utils/utils.js";
import {
  drawGraph,
  handleZooming,
  updateDisplayedData,
} from "./utils/draw_functions.js";
import { applyCategoryColors } from "./utils/colorscales.js";

const pointerScroll = (elem) => {
  const dragStart = (ev) => elem.setPointerCapture(ev.pointerId);
  const dragEnd = (ev) => elem.releasePointerCapture(ev.pointerId);
  const drag = (ev) => {
    elem.hasPointerCapture(ev.pointerId) && (elem.scrollTop -= ev.movementY);
  };

  elem.addEventListener("pointerdown", dragStart);
  elem.addEventListener("pointerup", dragEnd);
  elem.addEventListener("pointermove", drag);
};

const handleInfoDialogOpen = (state) => {
  if (state.current_fixed_point == null) {
    return;
  }
  state.InfoModalUpdateFkt(state);
  document.getElementById("info-dialog").showModal();
};

const handleFunctionSelection = (state) => {
  if (state.active_map.dialog_fkt === "dpg") {
    state.InfoModalUpdateFkt = updateInfoModalDPG;
  } else if (state.active_map.dialog_fkt === "arxiv") {
    state.InfoModalUpdateFkt = updateInfoModal;
  } else {
    alert(`Unknown map type ${map_type}`);
    throw new Error(`Unknown map type ${map_type}`);
  }

  if (state.active_map.display_fkt === "dpg") {
    state.PaperDisplayUpdateFkt = updatePaperDisplayDPG;
  }
  if (state.active_map.display_fkt === "arxiv") {
    state.PaperDisplayUpdateFkt = updatePaperDisplay;
  } else {
    alert(`Unknown map type ${map_type}`);
    throw new Error(`Unknown map type ${map_type}`);
  }

  if (state.active_map.annotation_fkt === "dpg") {
    state.AnnotationUpdateFkt = drawAnnotationDPG;
  }
  if (state.active_map.annotation_fkt === "arxiv") {
    state.AnnotationUpdateFkt = drawAnnotation;
  } else {
    alert(`Unknown map type ${map_type}`);
    throw new Error(`Unknown map type ${map_type}`);
  }

  if (state.active_map.parse_fkt === "dpg") {
    state.DataParseFkt = parseDataDPG;
  } else if (state.active_map.parse_fkt === "arxiv") {
    state.DataParseFkt = parseData;
  } else {
    alert(`Unknown map type ${map_type}`);
    throw new Error(`Unknown map type ${map_type}`);
  }
};

const setDefaultDisplaySettings = (state) => {
  state.current_display_settings = {
    categories: new Set(),
    min_date: new Date(0),
    max_date: new Date(Date.now()),
  };
};

const handleSettingsChange = ({ state, point_container }) => {
  let min_date = document.getElementById("min_published_month").value;
  let max_date = document.getElementById("max_published_month").value;
  if (min_date !== "") {
    state.current_display_settings.min_date = new Date(min_date);
  } else {
    state.current_display_settings.min_date = new Date(0);
  }

  if (max_date !== "") {
    state.current_display_settings.max_date = new Date(max_date);
  } else {
    state.current_display_settings.max_date = new Date(Date.now());
  }

  updateDisplayedData({
    state: state,
    point_container: point_container,
  });
};

(async () => {
  const config = await (
    await fetch("./configs/arxiv_atlas_config.json")
  ).json();
  const available_maps = config.available_maps;
  const url = new URL(window.location.href);
  const map_key = url.searchParams.get("map");
  if (!Object.keys(available_maps).includes(map_key)) {
    window.location.href = `/selection.html`;
  }
  const active_map = available_maps[map_key];

  const view = document.getElementById("chart");
  const state = {
    active_map_key: map_key,
    active_map: active_map,
    dragging: false,
    current_selected_point: null,
    current_fixed_point: null,
    last_selected_point: null,
    current_color_scheme: null,
    current_author_name: null,
    current_papername: null,
    current_smart_query: null,
    current_highlight_papers: [],
    current_scaling: 1.0,
    current_query: null,
    current_search_mode: null,
    current_search_page: 0,
    default_scale: active_map.default_scale || 0.05,
    highlight_scale: active_map.highlight_scale || 0.15,
    scale_speed: 0.2,
    width: window.innerWidth,
    height: window.innerHeight,
    initial_pos: { x: 0, y: 0 },
    last_pos: { x: 0, y: 0 },
    current_pos: { x: 0, y: 0 },
    current_zoom_center: { x: 0, y: 0 },
    previous_pointer_distance: -1,
    scroll_delta: 0,
    event_cache: [],
    metadata: null,
    data: null,
    current_displayed_data: null,
    current_display_settings: null,
    connectivity_list: null,
    texture_path: "./public/circle.png",
    texture: null,
    is_mobile: window.innerWidth < 768,
    config: config,
    InfoModalUpdateFkt: null,
    PaperDisplayUpdateFkt: null,
    AnnotationUpdateFkt: null,
    DataParseFkt: null,
    quadtree: d3
      .quadtree()
      .x((d) => d.x)
      .y((d) => d.y),
  };

  handleFunctionSelection(state);
  setDefaultDisplaySettings(state);

  document.getElementById("map-name").innerText = state.active_map.name;

  const renderer = PIXI.autoDetectRenderer({
    width: state.width,
    height: state.height,
    view: view,
    transparent: true,
    autoDensity: true,
    antialias: false,
    resolution: 4,
    backgroundAlpha: 0,
  });

  state.texture = PIXI.Texture.from(state.texture_path);

  let search_input;
  let search_select;
  let search_button;
  let search_icon;
  let search_spinner;
  let search_next_button;
  let search_prev_button;
  let search_result_menu;
  if (state.is_mobile) {
    search_input = document.getElementById("search-input-mobile");
    search_select = document.getElementById("search-select-mobile");
    search_button = document.getElementById("search-button-mobile");
    search_icon = document.getElementById("search-icon-mobile");
    search_spinner = document.getElementById("search-spinner-mobile");
  } else {
    search_input = document.getElementById("search-input");
    search_select = document.getElementById("search-select");
    search_button = document.getElementById("search-button");
    search_icon = document.getElementById("search-icon");
    search_spinner = document.getElementById("search-spinner");
  }
  search_next_button = document.getElementById("search-next-button");
  search_prev_button = document.getElementById("search-prev-button");
  search_result_menu = document.getElementById("search-result-menu");
  state.current_search_mode = search_select.value;

  const chart_annotation = document.getElementById("chart-annotation");
  const chart_marker = document.getElementById("chart-marker");
  const paper_display = document.getElementById("paper-display");
  const progress_bar_1 = document.getElementById("progress-bar-1");
  const progress_bar_2 = document.getElementById("progress-bar-2");
  const progress_text_1 = document.getElementById("progress-text-1");
  const progress_text_2 = document.getElementById("progress-text-2");
  const discrete_legend = document.getElementById("discrete-legend");
  const search_result_list = document.getElementById("search-result-list");
  const search_error = document.getElementById("nothing-found-error");
  const info_dialog = document.getElementById("info-dialog");
  const usage_dialog = document.getElementById("usage-dialog");
  const settings_dialog = document.getElementById("settings-dialog");
  const settings_dialog_apply = document.getElementById(
    "settings-dialog-apply"
  );
  const paper_display_info_button = document.getElementById(
    "paper-display-info-button"
  );

  pointerScroll(discrete_legend);

  const [raw_connectivity_list, raw_data] = await Promise.all([
    fetchDataWithStream({
      data_fname: state.active_map.sim_url,
      data_size: state.active_map.sim_size_bytes,
      drawCallback: updateProgress.bind(
        undefined,
        "Connectivity Matrix",
        progress_bar_1,
        progress_text_1
      ),
    }),
    fetchDataWithStream({
      data_fname: state.active_map.data_url,
      data_size: state.active_map.data_size_bytes,
      drawCallback: updateProgress.bind(
        undefined,
        "Embeddings",
        progress_bar_2,
        progress_text_2
      ),
    }),
  ]);

  progress_text_1.innerText = "Parsing data...";
  await new Promise(requestAnimationFrame);
  state.data = state.DataParseFkt({
    raw_data_text: raw_data,
    width: state.width,
    height: state.height,
  });
  state.current_displayed_data = [...state.data];

  progress_text_2.innerText = "Parsing Connectivity Matrix...";
  await new Promise(requestAnimationFrame);
  state.connectivity_list = parseConnectivityList({
    raw_data_text: raw_connectivity_list,
  });

  progress_text_1.innerText = "Building Quadtree...";
  await new Promise(requestAnimationFrame);
  state.quadtree.addAll(state.data);

  progress_text_2.innerText = "Analyzing Data for Metadata...";
  await new Promise(requestAnimationFrame);
  state.metadata = extractConstants({ data: state.data });

  progress_text_1.innerText = "Rendering Datapoints...";
  await new Promise(requestAnimationFrame);

  const point_container = new PIXI.ParticleContainer(state.data.length, {
    position: false,
    scale: true,
    interactiveChildren: false,
  });
  const highlight_container = new PIXI.ParticleContainer(
    state.data.length / 2,
    {
      position: false,
      scale: true,
      interactiveChildren: false,
    }
  );
  const graph_container = new PIXI.Container({ interactiveChildren: false });
  const stage = new PIXI.Container({ interactiveChildren: false });

  stage.addChild(point_container);
  stage.addChild(highlight_container);
  stage.addChild(graph_container);

  state.current_color_scheme = "category";
  applyCategoryColors({
    state: state,
    point_container: point_container,
  });
  document.getElementById("loading").style.display = "none";

  search_button.addEventListener("click", async () => {
    await handleSearchQuery({
      search_input: search_input.value,
      search_select_elem: search_select,
      search_icon_elem: search_icon,
      search_spinner_elem: search_spinner,
      highlight_container: highlight_container,
      state: state,
    });
  });

  search_input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    await handleSearchQuery({
      search_input: search_input.value,
      search_select_elem: search_select,
      search_icon_elem: search_icon,
      search_spinner_elem: search_spinner,
      highlight_container: highlight_container,
      state: state,
    });
  });

  search_select.addEventListener("change", (event) => {
    search_input.value = "";

    state.selected_search_mode = event.target.value;

    if (state.selected_search_mode === "author") {
      search_input.placeholder = "Search By Author";
    } else if (state.selected_search_mode === "title") {
      search_input.placeholder = "Search By Title";
    } else if (state.selected_search_mode === "smart") {
      search_input.placeholder = "Smart Search";
    }

    search_result_menu.style.display = "none";
    search_result_list.innerHTML = "";
    highlight_container.removeChildren();
    state.current_highlight_papers = [];
    state.current_query = null;
    stage.current_search_page = 0;
  });

  window.addEventListener("pointerdown", (event) => {
    if (event.target.id !== "chart") {
      return;
    }
    // handling multiple pointers for mobile or touch devices
    // check if the pointer is already in the cache
    let pointer_index = state.event_cache.findIndex(
      (cached_event) => cached_event.pointerId === event.pointerId
    );

    // if the pointer is not in the cache, add it to the cache
    if (pointer_index === -1) {
      state.event_cache.push(event);
    }
    // dont handle further events if the pointer is not the active pointer
    if (state.event_cache[0].pointerId !== event.pointerId) {
      return;
    }

    state.dragging = true;
    state.last_pos = { x: event.clientX, y: event.clientY };
    state.initial_pos = { x: event.clientX, y: event.clientY };
  });

  window.addEventListener("pointerout", (event) => {
    // remove the current pointer from the cache
    let pointer_index = state.event_cache.findIndex(
      (cached_event) => cached_event.pointerId === event.pointerId
    );

    if (pointer_index === -1) {
      //somehow the pointer is not in the cache, just return
      return;
    } else if (pointer_index === 0) {
      // if the pointer is the first pointer in the cache, aka the active pointer, remove all pointers
      state.event_cache.splice(0, state.event_cache.length);
    } else {
      // if the pointer is not the active pointer, remove only the pointer
      state.event_cache.splice(pointer_index, 1);
    }

    // reset the previous pointer distance if there is only one pointer left
    if (state.event_cache.length < 2) {
      state.previous_pointer_distance = 0;
    }
    if (pointer_index !== 0) {
      return;
    }

    state.dragging = false;
    state.current_pos = { x: event.clientX, y: event.clientY };
    // remove the point of the selected point is the same as the fixed point
    // only update the new fixed point if there was only minimal movement
    if (
      Math.hypot(
        state.initial_pos.x - state.current_pos.x,
        state.initial_pos.y - state.current_pos.y
      ) < 10
    ) {
      let abs_pos = toAbsolute({
        point: state.current_pos,
        reference_point: point_container,
        scaling: state.current_scaling,
      });
      state.current_selected_point = state.quadtree.find(
        abs_pos.x,
        abs_pos.y,
        30
      );

      if (state.current_fixed_point && state.current_selected_point) {
        if (state.current_fixed_point.id == state.current_selected_point.id) {
          state.current_fixed_point = null;
          graph_container.removeChildren();
          state.PaperDisplayUpdateFkt(state);
          return;
        }
      }

      if (state.current_selected_point) {
        state.current_fixed_point = { ...state.current_selected_point };
        graph_container.removeChildren();
        drawGraph({
          state: state,
          graph_container: graph_container,
        });
      } else {
        state.current_fixed_point = null;
        graph_container.removeChildren();
      }
      state.PaperDisplayUpdateFkt(state);
    }
  });

  // handling multiple pointers for mobile or touch devices
  // this is currently ugly and needs to be refactored
  window.addEventListener("pointerup", (event) => {
    // remove the current pointer from the cache
    let pointer_index = state.event_cache.findIndex(
      (cached_event) => cached_event.pointerId === event.pointerId
    );

    if (pointer_index === -1) {
      //somehow the pointer is not in the cache, just return
      return;
    } else if (pointer_index === 0) {
      // if the pointer is the first pointer in the cache, aka the active pointer, remove all pointers
      state.event_cache.splice(0, state.event_cache.length);
    } else {
      // if the pointer is not the active pointer, remove only the pointer
      state.event_cache.splice(pointer_index, 1);
    }

    // reset the previous pointer distance if there is only one pointer left
    if (state.event_cache.length < 2) {
      state.previous_pointer_distance = 0;
    }
    if (pointer_index !== 0) {
      return;
    }

    state.dragging = false;
    state.current_pos = { x: event.clientX, y: event.clientY };
    // remove the point of the selected point is the same as the fixed point
    // only update the new fixed point if there was only minimal movement
    if (
      Math.hypot(
        state.initial_pos.x - state.current_pos.x,
        state.initial_pos.y - state.current_pos.y
      ) < 10
    ) {
      let abs_pos = toAbsolute({
        point: state.current_pos,
        reference_point: point_container,
        scaling: state.current_scaling,
      });
      state.current_selected_point = state.quadtree.find(
        abs_pos.x,
        abs_pos.y,
        30
      );

      if (state.current_fixed_point && state.current_selected_point) {
        if (state.current_fixed_point.id == state.current_selected_point.id) {
          state.current_fixed_point = null;
          graph_container.removeChildren();
          state.PaperDisplayUpdateFkt(state);
          return;
        }
      }

      if (state.current_selected_point) {
        state.current_fixed_point = { ...state.current_selected_point };
        graph_container.removeChildren();
        drawGraph({
          state: state,
          graph_container: graph_container,
        });
      } else {
        state.current_fixed_point = null;
        graph_container.removeChildren();
      }
      state.PaperDisplayUpdateFkt(state);
    }
  });

  window.addEventListener("pointermove", (event) => {
    // if the target is not the chart, trigger the pointerout event
    if (event.target.id !== "chart") {
      state.current_selected_point = null;
      if (state.current_fixed_point === null) {
        graph_container.removeChildren();
      }

      window.dispatchEvent(new PointerEvent("pointerup", event));
      return;
    }

    // if the event cache is empty, add the event to the cache
    // this happens if the current pointer is not tracked yet
    if (state.event_cache.length === 0) {
      state.event_cache.push(event);
    }

    // find the pointer in the cache to update it later
    let pointer_index = state.event_cache.findIndex(
      (cached_event) => cached_event.pointerId === event.pointerId
    );
    if (pointer_index === -1) {
      // it may happen that the pointer is not in the cache, just return
      return;
    }

    // update the pointer in the cache
    state.event_cache[pointer_index] = event;

    // if we have two pointers, aka a pinch gesture, calculate the distance between the two pointers
    if (state.event_cache.length === 2) {
      let current_pointer_distance = Math.hypot(
        state.event_cache[0].clientX - state.event_cache[1].clientX,
        state.event_cache[0].clientY - state.event_cache[1].clientY
      );
      if (state.previous_pointer_distance > 0) {
        state.scroll_delta +=
          (state.previous_pointer_distance - current_pointer_distance) * 0.05;
        state.current_zoom_center = {
          x: (state.event_cache[0].clientX + state.event_cache[1].clientX) / 2,
          y: (state.event_cache[0].clientY + state.event_cache[1].clientY) / 2,
        };
      }
      state.previous_pointer_distance = current_pointer_distance;
    }

    // dont handle further events if the pointer is not the active pointer
    if (state.event_cache[0].pointerId !== event.pointerId) {
      return;
    }

    state.current_pos = { x: event.clientX, y: event.clientY };
    let abs_pos = toAbsolute({
      point: state.current_pos,
      reference_point: point_container,
      scaling: state.current_scaling,
    });
    if (!state.dragging) {
      state.current_selected_point = state.quadtree.find(
        abs_pos.x,
        abs_pos.y,
        30
      );
    }

    if (state.dragging && state.last_pos && state.current_pos) {
      point_container.x += state.current_pos.x - state.last_pos.x;
      point_container.y += state.current_pos.y - state.last_pos.y;
      graph_container.x += state.current_pos.x - state.last_pos.x;
      graph_container.y += state.current_pos.y - state.last_pos.y;
      highlight_container.x += state.current_pos.x - state.last_pos.x;
      highlight_container.y += state.current_pos.y - state.last_pos.y;
    }

    // only draw the graph if there is a selected point and no annotation
    state.last_pos = state.current_pos;
  });

  window.addEventListener(
    "wheel",
    (event) => {
      // Laptops should zoom with ctrl + scroll
      if (event.ctrlKey) {
        event.preventDefault();
      }

      if (event.target.id == "chart") {
        state.scroll_delta += Math.sign(event.deltaY + event.deltaX) / 2;
        state.scroll_delta = Math.max(-1, Math.min(1, state.scroll_delta));
        state.current_zoom_center = { ...state.current_pos };
      }
    },
    { passive: false }
  );

  window.onresize = () => {
    renderer.resize(window.innerWidth, window.innerHeight);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.is_mobile = window.innerWidth < 768;

    if (state.is_mobile) {
      search_input = document.getElementById("search-input-mobile");
      search_select = document.getElementById("search-select-mobile");
      search_button = document.getElementById("search-button-mobile");
      search_icon = document.getElementById("search-icon-mobile");
      search_spinner = document.getElementById("search-spinner-mobile");
    } else {
      search_input = document.getElementById("search-input");
      search_select = document.getElementById("search-select");
      search_button = document.getElementById("search-button");
      search_icon = document.getElementById("search-icon");
      search_spinner = document.getElementById("search-spinner");
    }
  };

  paper_display_info_button.addEventListener("click", () => {
    handleInfoDialogOpen(state);
  });

  settings_dialog_apply.addEventListener("click", () => {
    settings_dialog.close();
    handleSettingsChange({
      state: state,
      point_container: point_container,
    });
  });

  search_next_button.addEventListener("click", async () => {
    state.current_search_page++;
    updateSearchResults(state);
  });
  search_prev_button.addEventListener("click", async () => {
    state.current_search_page--;
    updateSearchResults(state);
  });

  // if the user clicks outside the dialog, close it
  info_dialog.addEventListener("click", (event) => {
    if (event.target === info_dialog) {
      info_dialog.close();
    }
  });
  settings_dialog.addEventListener("click", (event) => {
    if (event.target === settings_dialog) {
      settings_dialog.close();
    }
  });
  usage_dialog.addEventListener("click", (event) => {
    if (event.target === usage_dialog) {
      usage_dialog.close();
    }
  });

  search_error.addEventListener("click", (event) => {
    search_error.style.display = "none";
  });

  const ticker = new PIXI.Ticker();
  ticker.add(async () => {
    if (state.scroll_delta !== 0) {
      handleZooming({
        state: state,
        point_container: point_container,
        graph_container: graph_container,
        highlight_container: highlight_container,
      });

      state.scroll_delta -= state.scroll_delta * 0.5;
      if (state.scroll_delta < 0.1 && state.scroll_delta > -0.1) {
        state.scroll_delta = 0;
      }
    }
    if (!state.is_mobile) {
      state.AnnotationUpdateFkt({
        point_container: point_container,
        chart_annotation: chart_annotation,
        chart_marker: chart_marker,
        state: state,
      });
    }

    if (state.current_fixed_point) {
      drawGraph({
        state: state,
        graph_container: graph_container,
      });
    } else if (state.current_selected_point && !state.is_mobile) {
      drawGraph({
        state: state,
        graph_container: graph_container,
      });
    } else if (graph_container.children.length > 0) {
      graph_container.removeChildren();
    }

    if (chart_annotation.style.display !== "none") {
      renderMathInElement(chart_annotation, {
        delimiters: [{ left: "$", right: "$", display: false }],
      });
    }
    if (info_dialog.open) {
      renderMathInElement(info_dialog, {
        delimiters: [{ left: "$", right: "$", display: false }],
      });
    }
    if (paper_display.style.display !== "none") {
      renderMathInElement(paper_display, {
        delimiters: [{ left: "$", right: "$", display: false }],
      });
    }
    renderMathInElement(search_result_list, {
      delimiters: [{ left: "$", right: "$", display: false }],
    });

    renderer.render(stage);
    state.last_selected_point = state.current_selected_point;
  });
  ticker.start();
})();
