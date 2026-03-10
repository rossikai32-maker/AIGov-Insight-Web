#!/bin/bash
rsync -r --exclude={'node_modules','.trae','.next','dist'} ./ /Share/code/github/AIGov-Insight-Web/
