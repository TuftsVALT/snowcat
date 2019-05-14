import datamart
from io import BytesIO
import json
import os
import pandas as pd
from pprint import pprint
import requests 
import zipfile
import sys
import csv

searchInput = str(sys.argv[1])
augmentSelect = str(sys.argv[2])
index = int(sys.argv[3])
# url = 'https://dsbox02.isi.edu:9000/new/search_data'
# url = 'https://datamart.d3m.vida-nyu.org/search'
dirname = os.path.dirname(__file__)
config = os.path.join(dirname, '../../tufts_gt_wisc_configuration.json')
with open(config) as configData:
	json_data = json.loads(configData.read())
	filepath = json_data['training_data_root']

# Calls NYU's Datamart Python API to search for datasets using a passed in keyword
query_results = datamart.search(
    url='https://datamart.d3m.vida-nyu.org',
    query={'dataset': {'about': searchInput}},
    data=filepath + '/tables/learningData.csv',
    send_data=True
)

# Writes the dataset's name, number of rows, and variables into a csv file
f = open("./output/outputDatamart.csv", 'w') 
for result in query_results:
	f.write(result.metadata['name'])
	f.write(",")
	f.write(str(result.metadata['nb_rows']))
	f.write(",")
	f.write("\"")
	for i in range(0, len(result.metadata['columns'])):
		f.write(result.metadata['columns'][i]['name'])
		if(i+1 != len(result.metadata['columns'])):
			f.write(", ")
	f.write("\"")
	f.write(",")
	f.write(str(result.score))
	f.write(",")
	f.write("\"")
	f.write(str(result.union_columns))
	f.write("\"")
	f.write(",")
	f.write("\"")
	f.write(str(result.join_columns))
	f.write("\"")
	f.write("\n")
f.close()

# Calls NYU's Datamart Python API to augment the dataset based on augment data variable
if augmentSelect == "true":
	learning_data, dataset_doc = datamart.augment(
	    data=filepath + '/tables/learningData.csv',
	    augment_data=query_results[index],
	    send_data=True
	)

	with open('dataset_doc.json', 'w') as jsonfile:
		json.dump(dataset_doc, jsonfile, indent=4)

	learning_data.head()
	learning_data.to_csv('augmentData.csv')