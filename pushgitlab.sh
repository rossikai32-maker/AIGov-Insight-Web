#!/bin/bash
rsync -r --exclude={'node_modules','logs','.trae','.next','dist'} ./ /Share/code/gitlab/aisecweb/
