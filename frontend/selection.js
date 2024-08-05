const config = await (await fetch("./configs/arxiv_atlas_config.json")).json();
let maps = config.available_maps;

document.title = config.atlas_type + " Atlas";

let header = document.getElementById("header");
header.innerText = config.atlas_type;

const selection_container = document.getElementById("selection-container");

// maps.forEach((map) => {
// maps is an object with keys as map names iterating over all keys and values
Object.keys(maps).forEach((map_key) => {
  let map = maps[map_key];
  let subtitle = map.subtitle;
  let num_docs = map.num_docs;
  let map_name = map.name;
  let image_url = map.image_url;
  let download_size_mb = map.data_size_bytes + map.sim_size_bytes;
  download_size_mb = (download_size_mb / 1024 / 1024).toFixed(1);
  let last_updated = map.last_updated;

  if (num_docs < 0) return;

  if (image_url) {
    let image_element = document.createElement("img");
    image_element.classList.add("selection-image");
    image_element.src = `./public/images/${map_key}.webp`;
    image_element.alt = map_name;
  }

  let selection_element = document.createElement("div");
  selection_element.classList.add("selection-element");
  selection_element.onclick = () => {
    window.location.href = `./?map=${map_key}`;
  };
  selection_element.innerHTML = `
    <div class="selection-infos">
    <div>${map_name}</div>
    <div class="plasma-gradient">${subtitle}</div>
    <br />
      <div class="info-container">
        <div class="info-card">
            <span class="title">Papers</span>
            <span class="value">${num_docs}</span>
        </div>
        <div class="info-card">
            <span class="title">Map Size</span>
            <span class="value">${download_size_mb} MB</span>
        </div>
        <div class="info-card">
          <span class="title">Last Updated</span>
          <span class="value">${last_updated}</span>
        </div>
      </div>
    </div>
    `;

  if (image_url) {
    let image_element = document.createElement("img");
    image_element.classList.add("selection-image");
    image_element.src = `./public/images/${map_key}.webp`;
    image_element.alt = map_name;
    selection_element.prepend(image_element);
  }
  selection_container.appendChild(selection_element);
});
