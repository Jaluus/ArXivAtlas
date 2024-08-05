import arxiv_long_names from "./arxiv_long_names.js";
import { drawPoint, updateDisplayedData } from "./draw_functions.js";

const month_number_to_string = new Map([
  ["01", "Jan."],
  ["02", "Feb."],
  ["03", "Mar."],
  ["04", "Apr."],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "Aug."],
  ["09", "Sept."],
  ["10", "Oct."],
  ["11", "Nov."],
  ["12", "Dec."],
]);

async function drawAnnotation({
  point_container,
  chart_annotation,
  chart_marker,
  state,
}) {
  const createParagraph = (heading, content) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("annotation-paragraph");
    let paragraph_heading_elem = document.createElement("div");
    paragraph_heading_elem.classList.add("annotation-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.innerHTML = content;
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  if (state.current_selected_point) {
    let transformed_position = {
      x:
        state.current_selected_point.x * state.current_scaling +
        point_container.x,
      y:
        state.current_selected_point.y * state.current_scaling +
        point_container.y,
    };

    chart_annotation.style.display = "block";
    chart_annotation.style.left = `${transformed_position.x + 10}px`;
    chart_annotation.style.top = `${transformed_position.y + 10}px`;

    chart_annotation.innerHTML = "";

    let title_element = document.createElement("div");
    title_element.classList.add("annotation-title");
    title_element.innerHTML = state.current_selected_point.title;
    chart_annotation.appendChild(title_element);

    let section_container = document.createElement("div");
    section_container.classList.add("annotation-content-wrap");

    let author_paragraph = createParagraph(
      "First Author",
      state.current_selected_point.authors.split(";")[0]
    );
    section_container.appendChild(author_paragraph);

    let year = "20" + state.current_selected_point.id.split(".")[0].slice(0, 2);
    let month = state.current_selected_point.id.split(".")[0].slice(2, 4);
    let pub_paragraph = createParagraph(
      "Published",
      `${month_number_to_string.get(month)} ${year}`
    );
    section_container.appendChild(pub_paragraph);

    let category = arxiv_long_names.get(state.current_selected_point.category);
    if (category == undefined) {
      category = state.current_selected_point.category;
    }
    let category_paragraph = createParagraph("Category", category);
    section_container.appendChild(category_paragraph);

    let journal_paragraph = createParagraph(
      "Journal",
      state.current_selected_point.journal == "-"
        ? "No Journal Information Found"
        : state.current_selected_point.journal
    );
    section_container.appendChild(journal_paragraph);
    chart_annotation.appendChild(section_container);

    chart_marker.style.display = "block";
    chart_marker.style.left = `${transformed_position.x}px`;
    chart_marker.style.top = `${transformed_position.y}px`;
  } else {
    chart_annotation.style.display = "none";
    chart_marker.style.display = "none";
  }
}

async function drawAnnotationDPG({
  point_container,
  chart_annotation,
  chart_marker,
  state,
}) {
  const createParagraph = (heading, content) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("annotation-paragraph");
    let paragraph_heading_elem = document.createElement("div");
    paragraph_heading_elem.classList.add("annotation-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.innerHTML = content;
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  if (state.current_selected_point) {
    let transformed_position = {
      x:
        state.current_selected_point.x * state.current_scaling +
        point_container.x,
      y:
        state.current_selected_point.y * state.current_scaling +
        point_container.y,
    };

    chart_annotation.style.display = "block";
    chart_annotation.style.left = `${transformed_position.x + 10}px`;
    chart_annotation.style.top = `${transformed_position.y + 10}px`;
    chart_marker.style.display = "block";
    chart_marker.style.left = `${transformed_position.x}px`;
    chart_marker.style.top = `${transformed_position.y}px`;

    chart_annotation.innerHTML = "";

    let title_element = document.createElement("div");
    title_element.classList.add("annotation-title");
    title_element.innerHTML = state.current_selected_point.title;
    chart_annotation.appendChild(title_element);

    let section_container = document.createElement("div");
    section_container.classList.add("annotation-content");

    let speaker_paragraph = createParagraph(
      "Speaker",
      state.current_selected_point.speaker
    );
    section_container.appendChild(speaker_paragraph);

    let category_paragraph = createParagraph(
      "Part",
      state.current_selected_point.category
    );
    section_container.appendChild(category_paragraph);

    let session_paragraph = createParagraph(
      "Session",
      state.current_selected_point.session_name
    );
    section_container.appendChild(session_paragraph);

    let type_paragraph = createParagraph(
      "Contribution Type",
      state.current_selected_point.contribution_type
    );
    section_container.appendChild(type_paragraph);
    chart_annotation.appendChild(section_container);
  } else {
    chart_annotation.style.display = "none";
    chart_marker.style.display = "none";
  }
}

const updatePaperDisplay = (state) => {
  const createParagraph = (heading, content) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("paper-display-paragraph");
    let paragraph_heading_elem = document.createElement("div");
    paragraph_heading_elem.classList.add("paper-display-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.innerHTML = content;
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  let paper_display = document.getElementById("paper-display");

  if (state.current_fixed_point == null) {
    paper_display.style.display = "none";
    return;
  } else {
    paper_display.style.display = "block";
  }

  let title_elem = document.getElementById("paper-display-title");
  let arxiv_elem = document.getElementById("paper-display-arxiv-button");
  let section_elem = document.getElementById(
    "paper-display-metadata-container"
  );

  // handle the title
  title_elem.innerHTML = `${state.current_fixed_point.title}`;

  // handle the arxiv link
  let link = `https://arxiv.org/abs/${state.current_fixed_point.id}`;
  arxiv_elem.href = link;

  section_elem.innerHTML = "";

  if (!state.is_mobile) {
    let author_paragraph = createParagraph(
      "First Author",
      state.current_fixed_point.authors.split(";")[0]
    );
    section_elem.appendChild(author_paragraph);

    let year = "20" + state.current_fixed_point.id.split(".")[0].slice(0, 2);
    let month = state.current_fixed_point.id.split(".")[0].slice(2, 4);
    let pub_paragraph = createParagraph(
      "Published",
      `${month_number_to_string.get(month)} ${year}`
    );
    section_elem.appendChild(pub_paragraph);

    let category = arxiv_long_names.get(state.current_fixed_point.category);
    if (category == undefined) {
      category = state.current_fixed_point.category;
    }
    let category_paragraph = createParagraph("Category", category);
    section_elem.appendChild(category_paragraph);

    let journal_paragraph = createParagraph(
      "Journal",
      state.current_fixed_point.journal == "-"
        ? "No Journal Information Found"
        : state.current_fixed_point.journal
    );
    section_elem.appendChild(journal_paragraph);
  }
};

const updatePaperDisplayDPG = (state) => {
  const createParagraph = (heading, content) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("paper-display-paragraph");
    let paragraph_heading_elem = document.createElement("div");
    paragraph_heading_elem.classList.add("paper-display-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.innerHTML = content;
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  let paper_display = document.getElementById("paper-display");

  if (state.current_fixed_point == null) {
    paper_display.style.display = "none";
    return;
  } else {
    paper_display.style.display = "block";
  }

  let title_elem = document.getElementById("paper-display-title");
  let arxiv_elem = document.getElementById("paper-display-arxiv-button");
  let section_elem = document.getElementById(
    "paper-display-metadata-container"
  );

  // handle the title
  title_elem.innerHTML = `${state.current_fixed_point.title}`;

  // handle the arxiv link
  arxiv_elem.innerHTML = `
  <span class="paper-info-text"> DPG </span>
  <img src="public/arrow-right.svg" class="svg-image" />
  `;
  arxiv_elem.href = `https://www.dpg-verhandlungen.de/year/${
    state.current_fixed_point.year
  }/conference/${state.current_fixed_point.conference.toLowerCase()}/part/${state.current_fixed_point.part_id.toLowerCase()}/session/${
    state.current_fixed_point.session_id
  }/contribution/${state.current_fixed_point.contribution_id}`;

  section_elem.innerHTML = "";

  if (!state.is_mobile) {
    let author_paragraph = createParagraph(
      "Speaker",
      state.current_fixed_point.speaker
    );
    section_elem.appendChild(author_paragraph);

    let part_elem = createParagraph("Part", state.current_fixed_point.category);
    section_elem.appendChild(part_elem);

    let session_elem = createParagraph(
      "Session",
      state.current_fixed_point.session_name
    );
    section_elem.appendChild(session_elem);

    let type_elem = createParagraph(
      "Contribution Type",
      state.current_fixed_point.contribution_type
    );
    section_elem.appendChild(type_elem);
  }
};

async function updateInfoModal(state) {
  const createParagraph = ({ heading, content, content_id = null }) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("dialog-paragraph");
    let paragraph_heading_elem = document.createElement("span");
    paragraph_heading_elem.classList.add("dialog-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    paragraph_elem.appendChild(document.createElement("br"));
    let paragraph_content_elem = document.createElement("span");
    paragraph_content_elem.innerHTML = content;
    if (content_id != null) {
      paragraph_content_elem.id = content_id;
    }
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  const createAuthorParagraph = (heading, authors) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("dialog-paragraph");
    let paragraph_heading_elem = document.createElement("span");
    paragraph_heading_elem.classList.add("dialog-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    paragraph_elem.appendChild(document.createElement("br"));
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.id = "info-dialog-authors";
    paragraph_content_elem.classList.add("dialog-author-container");
    for (let i = 0; i < authors.length; i++) {
      let author_elem = document.createElement("span");
      author_elem.classList.add("dialog-author");
      author_elem.innerHTML = authors[i].trim();
      paragraph_content_elem.appendChild(author_elem);
    }
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  let info_modal = document.getElementById("info-dialog");
  info_modal.scrollTop = 0;

  let info_modal_title = document.getElementById("info-dialog-title");
  info_modal_title.innerHTML = "Contribution Information";

  let section_container = document.getElementById(
    "info-dialog-section-container"
  );
  section_container.innerHTML = "";

  let arxiv_link = `https://arxiv.org/abs/${state.current_fixed_point.id}`;
  let api_link = `./api/abstract/${state.active_map_key}/${state.current_fixed_point.id}`;

  let arxiv_pub = state.current_fixed_point.id.split(".")[0];
  let year = "20" + arxiv_pub.slice(0, 2);
  let month = arxiv_pub.slice(2, 4);
  let pub_string = `${month_number_to_string.get(month)} ${year}`;

  let title_modal_elem = document.getElementById("info-dialog-section-title");
  title_modal_elem.innerHTML = state.current_fixed_point.title;

  let published_elem = createParagraph({
    heading: "Published",
    content: pub_string,
  });
  section_container.appendChild(published_elem);

  let arxiv_elem = createParagraph({
    heading: "ArXiv",
    content: `<a href="${arxiv_link}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: underline;">${state.current_fixed_point.id}</a>`,
  });
  section_container.appendChild(arxiv_elem);

  let category_name = arxiv_long_names.get(state.current_fixed_point.category);
  if (category_name == undefined) {
    category_name = state.current_fixed_point.category;
  }
  let category_elem = createParagraph({
    heading: "Category",
    content: category_name,
  });
  section_container.appendChild(category_elem);

  let journal_elem = createParagraph({
    heading: "Journal",
    content:
      state.current_fixed_point.journal == "-"
        ? "No journal or conference found"
        : state.current_fixed_point.journal,
  });
  section_container.appendChild(journal_elem);

  let authors_elem = createAuthorParagraph(
    "Authors",
    state.current_fixed_point.authors.split(";")
  );
  section_container.appendChild(authors_elem);

  let summary_elem = createParagraph({
    heading: "Abstract",
    content: "Fetching...",
    content_id: "info-dialog-abstract",
  });
  section_container.appendChild(summary_elem);

  // handle the recommended papers
  let recommended_elem = document.getElementById(
    "info-dialog-section-recommended-papers"
  );
  recommended_elem.innerHTML = "";

  let recommended_papers =
    state.connectivity_list[state.current_fixed_point.index];
  for (let i = 0; i < recommended_papers.length; i++) {
    let recommended_paper = state.data[recommended_papers[i][0]];
    let recommended_paper_score = recommended_papers[i][1];

    let recommended_paper_elem = document.createElement("div");
    recommended_paper_elem.classList.add("recommended-paper-card");

    let rec_pap_item_row_elem = document.createElement("div");
    rec_pap_item_row_elem.classList.add("item-row");

    let rec_pap_indic_elem = document.createElement("div");
    rec_pap_indic_elem.classList.add("indicator");
    rec_pap_indic_elem.innerHTML = `${recommended_paper_score}% Match`;
    rec_pap_item_row_elem.appendChild(rec_pap_indic_elem);

    let rec_pap_next_paper_elem = document.createElement("div");
    rec_pap_next_paper_elem.classList.add("indicator");
    rec_pap_next_paper_elem.style.pointerEvents = "auto";
    rec_pap_next_paper_elem.style.cursor = "pointer";
    rec_pap_next_paper_elem.innerHTML =
      "<span>Go to Paper</span><img src='public/arrow-right.svg' alt='Go to Symbol' class='svg-image'/>";

    rec_pap_next_paper_elem.onclick = () => {
      // update each key of the state.current_fixed_point inplace
      state.current_fixed_point = recommended_paper;
      state.InfoModalUpdateFkt(state);
      state.PaperDisplayUpdateFkt(state);
    };

    rec_pap_item_row_elem.appendChild(rec_pap_next_paper_elem);

    recommended_paper_elem.appendChild(rec_pap_item_row_elem);

    let rec_pap_title_elem = document.createElement("div");
    rec_pap_title_elem.classList.add("title");
    rec_pap_title_elem.innerHTML = recommended_paper.title;
    recommended_paper_elem.appendChild(rec_pap_title_elem);

    recommended_elem.appendChild(recommended_paper_elem);
  }

  // fetch the arxiv data
  let abstract_elem = document.getElementById("info-dialog-abstract");
  fetch(api_link)
    .then((response) => response.json())
    .then((data) => {
      if (data["abstract"] == undefined) {
        abstract_elem.innerHTML = "No Abstract found";
        return;
      }
      abstract_elem.innerHTML = data["abstract"];
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
      abstract_elem.innerHTML = "Error fetching abstract";
    });
}

async function updateInfoModalDPG(state) {
  const createParagraph = (heading, content) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("dialog-paragraph");
    let paragraph_heading_elem = document.createElement("span");
    paragraph_heading_elem.classList.add("dialog-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    paragraph_elem.appendChild(document.createElement("br"));
    let paragraph_content_elem = document.createElement("span");
    paragraph_content_elem.innerHTML = content;
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  const createAuthorParagraph = (heading, authors) => {
    let paragraph_elem = document.createElement("div");
    paragraph_elem.classList.add("dialog-paragraph");
    let paragraph_heading_elem = document.createElement("span");
    paragraph_heading_elem.classList.add("dialog-paragraph-heading");
    paragraph_heading_elem.innerHTML = heading;
    paragraph_elem.appendChild(paragraph_heading_elem);
    paragraph_elem.appendChild(document.createElement("br"));
    let paragraph_content_elem = document.createElement("div");
    paragraph_content_elem.id = "info-dialog-authors";
    paragraph_content_elem.classList.add("dialog-author-container");
    for (let i = 0; i < authors.length; i++) {
      let author = authors[i].trim();
      let author_elem = document.createElement("span");
      if (author == state.current_fixed_point.speaker) {
        author_elem.classList.add("dialog-main-author");
      } else {
        author_elem.classList.add("dialog-author");
      }
      author_elem.innerHTML = author;
      paragraph_content_elem.appendChild(author_elem);
    }
    paragraph_elem.appendChild(paragraph_content_elem);
    return paragraph_elem;
  };

  let info_modal = document.getElementById("info-dialog");
  info_modal.scrollTop = 0;

  let info_modal_title = document.getElementById("info-dialog-title");
  info_modal_title.innerHTML = "Contribution Information";

  let section_container = document.getElementById(
    "info-dialog-section-container"
  );
  section_container.innerHTML = "";

  let title_modal_elem = document.getElementById("info-dialog-section-title");
  title_modal_elem.innerHTML = state.current_fixed_point.title;

  let day_elem = createParagraph("Day", state.current_fixed_point.day);
  section_container.appendChild(day_elem);

  let time_elem = createParagraph("Time", state.current_fixed_point.time);
  section_container.appendChild(time_elem);

  let room_elem = createParagraph("Room", "BH-N 243");
  section_container.appendChild(room_elem);

  let part_elem = createParagraph("Part", state.current_fixed_point.category);
  section_container.appendChild(part_elem);

  let session_elem = createParagraph(
    "Session",
    state.current_fixed_point.session_name
  );
  section_container.appendChild(session_elem);

  let contribution_type_elem = createParagraph(
    "Contribution Type",
    state.current_fixed_point.contribution_type
  );
  section_container.appendChild(contribution_type_elem);

  let authors_elem = createAuthorParagraph(
    "Contributors",
    state.current_fixed_point.authors.split(";")
  );
  section_container.appendChild(authors_elem);

  let summary_elem = createParagraph(
    "Abstract",
    state.current_fixed_point.abstract
  );
  section_container.appendChild(summary_elem);

  // handle the recommended papers
  let recommended_title_elem = document.getElementById(
    "info-dialog-recommended-title"
  );
  recommended_title_elem.innerHTML = "Recommended Contributions";

  let recommended_elem = document.getElementById(
    "info-dialog-section-recommended-papers"
  );
  recommended_elem.innerHTML = "";

  let recommended_papers =
    state.connectivity_list[state.current_fixed_point.index];

  for (let i = 0; i < recommended_papers.length; i++) {
    let recommended_paper = state.data[recommended_papers[i][0]];
    let recommended_paper_score = recommended_papers[i][1];

    let recommended_paper_elem = document.createElement("div");
    recommended_paper_elem.classList.add("recommended-paper-card");

    let rec_pap_item_row_elem = document.createElement("div");
    rec_pap_item_row_elem.classList.add("item-row");

    let rec_pap_indic_elem = document.createElement("div");
    rec_pap_indic_elem.classList.add("indicator");
    rec_pap_indic_elem.innerHTML = `${recommended_paper_score}% Match`;
    rec_pap_item_row_elem.appendChild(rec_pap_indic_elem);

    let rec_pap_next_paper_elem = document.createElement("div");
    rec_pap_next_paper_elem.classList.add("indicator");
    rec_pap_next_paper_elem.style.pointerEvents = "auto";
    rec_pap_next_paper_elem.style.cursor = "pointer";
    rec_pap_next_paper_elem.innerHTML =
      "<span>Go to Contribution</span><img src='public/arrow-right.svg' alt='Go to Symbol' class='svg-image'/>";

    rec_pap_next_paper_elem.onclick = () => {
      // update each key of the state.current_fixed_point inplace
      state.current_fixed_point = recommended_paper;
      state.InfoModalUpdateFkt(state);
      state.PaperDisplayUpdateFkt(state);
    };

    rec_pap_item_row_elem.appendChild(rec_pap_next_paper_elem);

    recommended_paper_elem.appendChild(rec_pap_item_row_elem);

    let rec_pap_title_elem = document.createElement("div");
    rec_pap_title_elem.classList.add("title");
    rec_pap_title_elem.innerHTML = recommended_paper.title;
    recommended_paper_elem.appendChild(rec_pap_title_elem);

    recommended_elem.appendChild(recommended_paper_elem);
  }
}

const generateDiscreteLegend = ({ state, legend_element, point_container }) => {
  let category_colors = state.metadata.get("category_colors");
  let categories = state.metadata.get("categories");

  // remove all children from the legend
  legend_element.innerHTML = "";

  categories.forEach((category, idx) => {
    const category_elem = document.createElement("div");
    category_elem.className = "discrete-legend-category";

    const swatch = document.createElement("span");
    swatch.className = "discrete-legend-swatch";
    swatch.style.backgroundColor = category_colors.get(category);

    swatch.addEventListener("pointerdown", () => {
      if (state.current_display_settings.categories.has(category)) {
        state.current_display_settings.categories.delete(category);
        swatch.style.border = "none";
      } else {
        state.current_display_settings.categories.add(category);
        swatch.style.border = "2px solid white";
      }
      updateDisplayedData({
        state: state,
        point_container: point_container,
      });
    });

    const label = document.createElement("span");
    label.className = "discrete-legend-label";

    let category_name = arxiv_long_names.get(category);
    if (category_name == undefined) {
      category_name = category;
    }
    label.innerText = category_name;

    category_elem.appendChild(swatch);
    category_elem.appendChild(label);
    legend_element.appendChild(category_elem);
  });
};

const generateContinuousLegend = ({
  legend_element,
  max_val = 3000,
  min_val = 0,
  scheme,
}) => {
  legend_element.innerHTML = "";

  let delta = max_val - min_val;

  if (delta == 0) {
    return;
  }

  let grad_string = "linear-gradient(180deg,";
  for (let i = 0; i < 11; i++) {
    grad_string += `${scheme(1 - i / 10)} ${parseInt(i * 10)}%,`;
  }
  grad_string = grad_string.slice(0, grad_string.length - 1);
  grad_string += ")";

  const colorbar = document.createElement("div");
  colorbar.classList.add("bar");
  colorbar.style.backgroundImage = grad_string;
  legend_element.appendChild(colorbar);

  const ticks = document.createElement("div");
  ticks.classList.add("ticks");

  const max_tick = document.createElement("span");
  max_tick.innerText = max_val;
  ticks.appendChild(max_tick);

  if (delta % 2 == 0) {
    const delta_tick = document.createElement("span");
    delta_tick.innerText = min_val + delta / 2;
    ticks.appendChild(delta_tick);
  }

  const min_tick = document.createElement("span");
  min_tick.innerText = min_val;
  ticks.appendChild(min_tick);

  legend_element.appendChild(ticks);
};

export {
  updatePaperDisplay,
  updatePaperDisplayDPG,
  generateDiscreteLegend,
  generateContinuousLegend,
  updateInfoModal,
  updateInfoModalDPG,
  drawAnnotation,
  drawAnnotationDPG,
};
