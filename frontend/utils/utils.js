const extractConstants = ({ data }) => {
  // extract the categories and the years from the data
  let categories = new Set();
  let published_per_category = new Map();
  let published_per_year_per_category = new Map();
  // hmm, this will break for papers published before the birth of Christ
  // and after the year 3000, may need to fix this in the future
  let max_year = 0;
  let min_year = 3000;

  for (let i = 0; i < data.length; i++) {
    max_year = Math.max(data[i].year, max_year);
    min_year = Math.min(data[i].year, min_year);
    categories.add(data[i].category);

    if (!published_per_category.has(data[i].category)) {
      published_per_category.set(data[i].category, 0);
    }
    published_per_category.set(
      data[i].category,
      published_per_category.get(data[i].category) + 1
    );

    // HYPERCURSED CODE
    // I just like my very verbose variable names
    if (!published_per_year_per_category.has(data[i].year)) {
      published_per_year_per_category.set(data[i].year, new Map());
    }
    if (
      !published_per_year_per_category.get(data[i].year).has(data[i].category)
    ) {
      published_per_year_per_category
        .get(data[i].year)
        .set(data[i].category, 0);
    }
    published_per_year_per_category
      .get(data[i].year)
      .set(
        data[i].category,
        published_per_year_per_category
          .get(data[i].year)
          .get(data[i].category) + 1
      );
  }
  categories = Array.from(categories);

  // sort the categories by the number of papers published in them
  categories.sort((a, b) => {
    return published_per_category.get(b) - published_per_category.get(a);
  });

  let scheme = new Map();
  if (categories.length > 10) {
    for (let i = 0; i < categories.length; i++) {
      scheme.set(
        categories[i],
        d3.interpolateSinebow(i / (categories.length - 1))
      );
    }
  } else {
    for (let i = 0; i < categories.length; i++) {
      scheme.set(
        categories[i],
        d3.schemeCategory10[i % d3.schemeCategory10.length]
      );
    }
  }

  const map_metadata = new Map();
  map_metadata.set("category_colors", scheme);
  map_metadata.set("categories", categories);
  map_metadata.set("max_year", max_year);
  map_metadata.set("min_year", min_year);
  map_metadata.set(
    "published_per_year_per_category",
    published_per_year_per_category
  );
  map_metadata.set("published_per_category", published_per_category);
  return map_metadata;
};

async function fetchDataWithStream({
  data_fname,
  data_size,
  drawCallback = (downloaded, data_size) => {},
}) {
  const response = await fetch(data_fname);
  if (!response.ok) {
    alert("File download failed, Server error!");
    return;
  }

  let loaded = 0;

  const reader = response.body.getReader();
  let chunks = [];
  const stream = new ReadableStream({
    start(controller) {
      function push() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            loaded += value.byteLength;
            drawCallback(loaded, data_size);
            controller.enqueue(value);
            chunks.push(value);
            push();
          })
          .catch((error) => {
            console.error("Stream error:", error);
            controller.error(error);
          });
      }
      push();
    },
  });
  const newResponse = new Response(stream);
  const blob = await newResponse.blob();

  // set the progress to 100% after the download is finished it may sometimes happen that the progress is not 100% at the end
  drawCallback(data_size, data_size);

  const raw_data_text = await blob.text();
  return normalizeLineEndings(raw_data_text);
}

function updateProgress(
  name,
  progress_bar,
  progress_text,
  downloaded,
  data_size
) {
  progress_bar.style.width =
    Math.max(0, Math.min(1, downloaded / data_size)) * 100 + "%";
  progress_text.innerText = `Downloading ${name}... ${(
    downloaded /
    1024 /
    1024
  ).toFixed(1)}/${(data_size / 1024 / 1024).toFixed(1)} MB`;
}

const parseData = ({ raw_data_text, width, height }) => {
  const lines = raw_data_text.split("\n");
  const header = lines[0].split("\t");
  // remove the header from the lines
  lines.shift();

  const data = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] == "") {
      break;
    }
    let obj = {};
    let split_lines = lines[i].split("\t");
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = split_lines[j];
    }
    obj.index = i;
    obj.id = obj.arxiv_id;
    obj.category = obj.main_category;
    obj.journal =
      obj.journal_ref == "<NA>" ? "No Journal Found" : obj.journal_ref;
    obj.x = Number(obj.x) * width * 0.8 + width * 0.1;
    obj.y = Number(obj.y) * height * 0.8 + height * 0.1;
    obj.year = 2000 + parseInt(obj.id.slice(0, 2));
    obj.date = new Date(obj.year, parseInt(obj.id.slice(2, 4)) - 1);
    data.push(obj);
  }
  return data;
};

const parseDataDPG = ({ raw_data_text, width, height }) => {
  const lines = raw_data_text.split("\n");
  const header = lines[0].split("\t");
  // remove the header from the lines
  lines.shift();

  const data = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] == "") {
      break;
    }
    let obj = {};
    let split_lines = lines[i].split("\t");
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = split_lines[j];
    }
    obj.index = i;
    obj.x = Number(obj.x) * width * 0.8 + width * 0.1;
    obj.y = Number(obj.y) * height * 0.8 + height * 0.1;
    obj.category = obj.part_name;
    data.push(obj);
  }
  return data;
};

const parseConnectivityList = ({ raw_data_text }) => {
  return raw_data_text
    .split("\n")
    .map((row) =>
      row.split(";").map((x) => x.split(",").map((y) => parseInt(y)))
    );
};

const toAbsolute = ({ point, reference_point, scaling }) => {
  return {
    x: (point.x - reference_point.x) / scaling,
    y: (point.y - reference_point.y) / scaling,
  };
};

const toRelative = ({ point, reference_point, scaling }) => {
  return {
    x: point.x * scaling - reference_point.x,
    y: point.y * scaling - reference_point.y,
  };
};

const findAuthorPapers = ({ data, author_name }) => {
  let author_string = "";
  let author_papers = [];
  for (let i = 0; i < data.length; i++) {
    // We need to add the ; at the start and end to be have to do a full name check
    author_string = ";" + data[i].authors.toLowerCase() + ";";
    if (
      author_string.includes(" " + author_name + ";") || // check for the last name
      author_string.includes("." + author_name + ";") || // check for the last name
      author_string.includes(";" + author_name + ";") // check for the full name
    ) {
      author_papers.push(data[i]);
    }
  }

  return author_papers;
};

const findPapersByTitle = ({ data, papername }) => {
  let lower_papername = papername.toLowerCase();
  let matching_papers = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].title.toLowerCase().includes(lower_papername)) {
      matching_papers.push(data[i]);
    }
  }

  return matching_papers;
};

const parseSmartSearchResults = ({ data, search_results }) => {
  let matching_papers = [];
  for (let i = 0; i < search_results.length; i++) {
    let search_result = search_results[i];
    let index = data.findIndex((x) => x.id == search_result.id);
    if (index != -1) {
      let paper = data[index];
      paper.score = search_result.score;
      matching_papers.push(paper);
    }
  }
  return matching_papers;
};

const normalizeLineEndings = (str, normalized = "\n") =>
  str.replace(/\r?\n/g, normalized);

export {
  toAbsolute,
  toRelative,
  findAuthorPapers,
  findPapersByTitle,
  fetchDataWithStream,
  extractConstants,
  parseData,
  updateProgress,
  parseConnectivityList,
  normalizeLineEndings,
  parseSmartSearchResults,
  parseDataDPG,
};
