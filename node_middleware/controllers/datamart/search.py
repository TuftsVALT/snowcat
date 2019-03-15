import datamart
from io import BytesIO
import pandas as pd
from pprint import pprint
import sys
import csv

# Calls NYU's Datamart API to search for datasets using a passed in keyword
searchInput = str(sys.argv[1])
query_results = datamart.search(
    url='https://datamart.d3m.vida-nyu.org',
    query={'dataset': {'about': searchInput}},
    send_data=False)
    # send_data=True)

# Writes the dataset's name, number of rows, and variables into a csv file
f = open("./output/outputDatamart.csv", 'w') 
for result in query_results:
	f.write(result.metadata['name'])
	f.write(",")
	f.write(str(result.metadata['nb_rows']))
	f.write(",")
	for i in range(0, len(result.metadata['columns'])):
		f.write(result.metadata['columns'][i]['name'])
		f.write(" ")
	f.write("\n")
f.close()