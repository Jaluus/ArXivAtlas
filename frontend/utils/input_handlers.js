import {
  findAuthorPapers,
  findPapersByTitle,
  parseSmartSearchResults,
} from "./utils.js";
import { drawHighlights } from "./draw_functions.js";

const handleAuthorInput = (state) => {
  let name_parts = state.current_query.toLowerCase().split(" ");
  let current_author_name;
  if (name_parts.length == 1) {
    current_author_name = name_parts[0];
  } else {
    current_author_name =
      name_parts[0][0] + "." + name_parts[name_parts.length - 1];
  }
  state.current_highlight_papers = findAuthorPapers({
    data: state.current_displayed_data,
    author_name: current_author_name,
  });
};

const handlePapernameInput = (state) => {
  state.current_highlight_papers = findPapersByTitle({
    data: state.current_displayed_data,
    papername: state.current_query,
  });
};

async function handleSmartInput(state) {
  await fetch("./api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: state.current_query,
      category: state.active_map_key,
      top_k: 200,
      top_n: 10,
      use_rerank: true,
      rerank_score_threshold: 0.1,
    }),
  })
    .then((response) => response.json())
    .then((search_results) => {
      state.current_highlight_papers = parseSmartSearchResults({
        data: state.data,
        search_results: search_results,
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function handleSearchQuery({
  state,
  search_input,
  search_select_elem,
  search_icon_elem,
  search_spinner_elem,
  highlight_container,
}) {
  state.current_search_page = 0;
  state.current_query = search_input;
  state.current_search_mode = search_select_elem.value;

  search_icon_elem.style.display = "none";
  search_spinner_elem.style.display = "block";
  document.getElementById("nothing-found-error").style.display = "none";

  if (state.current_query.trim().length > 2) {
    if (state.current_search_mode === "author") {
      handleAuthorInput(state);
    } else if (state.current_search_mode === "title") {
      handlePapernameInput(state);
    } else if (state.current_search_mode === "smart") {
      await handleSmartInput(state);
    }
  } else {
    state.current_highlight_papers = [];
  }

  if (state.current_highlight_papers.length == 0) {
    document.getElementById("nothing-found-error").style.display = "flex";
  }

  search_icon_elem.style.display = "block";
  search_spinner_elem.style.display = "none";

  drawHighlights({
    state: state,
    highlight_container: highlight_container,
  });

  updateSearchResults(state);
}

const updateSearchResults = (state) => {
  let sorted_highlight_papers;
  if (state.current_search_mode === "title") {
    sorted_highlight_papers = state.current_highlight_papers.sort(
      (a, b) => a.title.length - b.title.length
    );
  } else if (state.current_search_mode === "smart") {
    sorted_highlight_papers = state.current_highlight_papers.sort(
      (a, b) => b.score - a.score
    );
  } else {
    sorted_highlight_papers = state.current_highlight_papers.sort(
      (a, b) => b.year - a.year
    );
  }

  const info_dialog = document.getElementById("info-dialog");
  const search_result_list = document.getElementById("search-result-list");
  search_result_list.innerHTML = "";

  state.current_search_page = Math.max(state.current_search_page, 0);
  state.current_search_page = Math.min(
    state.current_search_page,
    Math.floor(sorted_highlight_papers.length / 4)
  );

  let search_result_text = document.getElementById("search-result-text");
  let search_result_menu = document.getElementById("search-result-menu");
  if (sorted_highlight_papers.length > 0) {
    search_result_text.innerHTML = `Results ${
      state.current_search_page * 4 + 1
    } - ${Math.min(
      (state.current_search_page + 1) * 4,
      sorted_highlight_papers.length
    )} of ${sorted_highlight_papers.length}`;
    search_result_menu.style.display = "flex";
    // only show the best 4 results
    for (
      let i = state.current_search_page * 4;
      i <
      Math.min(
        sorted_highlight_papers.length,
        (state.current_search_page + 1) * 4
      );
      i++
    ) {
      let paper = sorted_highlight_papers[i];
      let search_result_card = document.createElement("div");
      search_result_card.classList.add("search-result-card");

      let item_row = document.createElement("div");
      item_row.classList.add("item-row");

      let title_match_indicator = document.createElement("div");
      title_match_indicator.classList.add("indicator");
      if (state.current_search_mode === "smart") {
        title_match_indicator.innerHTML = `<span class="paper-info-text">${Math.round(
          paper.score * 100
        )}% Match</span>`;
      } else if (state.current_search_mode === "author") {
        title_match_indicator.innerHTML =
          '<span class="paper-info-text">Author Match</span>';
      } else if (state.current_search_mode === "title") {
        title_match_indicator.innerHTML =
          '<span class="paper-info-text">Title Match</span>';
      }
      item_row.appendChild(title_match_indicator);

      let paper_info_indicator = document.createElement("div");
      paper_info_indicator.classList.add("indicator");
      paper_info_indicator.innerHTML =
        '<img src="public/info-circle.svg" class="svg-image" alt="Go to Symbol" /><span class="paper-info-text">Paper Info</span>';

      paper_info_indicator.onclick = () => {
        state.current_fixed_point = paper;
        state.InfoModalUpdateFkt(state);
        state.PaperDisplayUpdateFkt(state);
        info_dialog.showModal();
      };

      item_row.appendChild(paper_info_indicator);

      search_result_card.appendChild(item_row);

      let search_result_card_title = document.createElement("div");
      search_result_card_title.classList.add("search-result-card-title");

      if (state.current_search_mode === "title") {
        let start_index = paper.title
          .toLowerCase()
          .indexOf(state.current_query.toLowerCase());
        let end_index = start_index + state.current_query.length;
        search_result_card_title.innerHTML =
          paper.title.slice(0, start_index) +
          "<span class='title-highlight'>" +
          paper.title.slice(start_index, end_index) +
          "</span>" +
          paper.title.slice(end_index);
      } else {
        search_result_card_title.innerHTML = paper.title;
      }
      search_result_card.appendChild(search_result_card_title);

      search_result_list.appendChild(search_result_card);
    }
  } else {
    search_result_menu.style.display = "none";
  }
};

export {
  handleAuthorInput,
  handlePapernameInput,
  handleSmartInput,
  handleSearchQuery,
  updateSearchResults,
};
