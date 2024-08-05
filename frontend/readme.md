# ArXiv Atlas Frontend

This it the Frontend of the ArXiv Atlas Project.  
It is build using Plain JavaScript and the [PixiJS](https://pixijs.com/) Library.

This code is extremely messy and not very well structured.  
I plan to fully rewrite it in the future in React, but for now I will stick with this.

## Setup

None needed.
Just host the `frontend` folder on a webserver.  
One way to do this would first go to the `frontend` folder and then run:

```bash
python -m http.server 8000
```

in the `frontend` folder and then open `http://localhost:8000` in your browser.

## How do I add my own data?

If you want to add your own data, you can do so by editing the `arxiv_atlas_config.json` file in the `fontend/configs` folder.  
Just change the `data_url` key under `api` to point to the folder where your data is stored. Then change the `available_maps` key to include your map.

The data typically needs a specific format, which is described in the `backend` folder.
Execute the `backend\generate_frontend_files.py` script to generate the necessary files.
If you are using different column names, you will also need to write your own data parser.
I dont have a good guide for this yet, but you can look at the code in `utils\utils.js` to see how the data is parsed for the DPG and ArXiv datasets.

`Example New Map`:

```json
{
  "available_maps": {
    "my-custom-map": {
      "data_size_bytes": 10000,
      "sim_size_bytes": 10000,
      "num_docs": 42,
      "name": "My Custom Map",
      "subtitle": "of my data",
      "image_url": "path/or/url/to/image",
      "data_url": "path/or/url/to/data.tsv",
      "sim_url": "path/or/url/to/sim_list.txt",
      "default_scale": 0.015,
      "highlight_scale": 0.1,
      "parse_fkt": "my_parse_fkt",      # Currently dpg or arxiv
      "display_fkt": "my_display_fkt",  # Currently dpg or arxiv
      "dialog_fkt": "my_dialog_fkt",    # Currently dpg or arxiv
      "annotation_fkt": "my_annot_fkt", # Currently dpg or arxiv
      "map_type": "Custom",
      "last_updated": "12. Sept 2024"
    },
    ...
  }
}
```

## Maybe TODO?

### Done

- Add Legend
- Add ability to search the map via paper names
- Add ability to search the map via free text
- Improve the Overlay
  - Display cards of the best matching papers
- Add ability to read the abstract of the paper
- Add ability to click the legend to show only that category
- Add Application State

### Next

- Improve the styling of the selection website
- Improve mode switching (Category, Year)
- Improve Styling of the Overlay
- Add fetching animation for abstracts
- Add ability to hide the legend
- Add ability to search the map via abstracts
- Add ability to search for multiple authors
- Add ability to see the paper graphs
- Add better Author Coloring

### Later

- Add ability to dynamically show points based on sliders
  - may be very slow ?
- Add Rendergroups?
  - Is with Pixi V8, but they dont have a particle container yet
- Improve Graph Drawing
  - make it more concise
- Dynamically draw Points
  - Add a progress bar for this
