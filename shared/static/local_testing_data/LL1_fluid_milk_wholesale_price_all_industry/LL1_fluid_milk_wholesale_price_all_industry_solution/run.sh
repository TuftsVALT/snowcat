#!/usr/bin/env bash
# This assumes you are running in a conda environment with the necessary packages
# You can also type this on a command line
# It executes the jupyter notebook without a browser, creates a plot, then creates performance and predictions
# output files

jupyter nbconvert --to=notebook  --ExecutePreprocessor.enabled=True --inplace ./baseline.ipynb
