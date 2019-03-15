REM This assumes you are running in a conda environment with the necessary packages
REM You can also type this on a command line
REM It executes the jupyter notebook without a browser, creates a plot, then creates performance and predictions
REM output files

jupyter nbconvert --to=notebook  --ExecutePreprocessor.enabled=True --inplace baseline.ipynb
