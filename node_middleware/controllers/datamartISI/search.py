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
url = 'https://dsbox02.isi.edu:9000/new/search_data'
# url = 'https://datamart.d3m.vida-nyu.org/search'
dirname = os.path.dirname(__file__)
data = os.path.join(dirname, '../../static/learningData.csv')
query={
    "dataset": {
        "about": searchInput
    }
}

# Calls ISI's Datamart REST API to search for datasets using a passed in keyword
with open(data, 'rb') as data_p:
    response = requests.post(
        url,
        verify=False,
        files={
            # 'data': data_p,
            'query': ('query.json', json.dumps(query), 'application/json'),
        }
    )
response.raise_for_status()
query_results = response.json()['data']

# Writes the dataset's name, number of rows, and variables into a csv file
f = open("./output/outputDatamartISI.csv", 'w') 
for result in query_results:
	f.write("\"")
	f.write(result['metadata']['title'])
	f.write("\"")
	f.write(",")
	f.write("\"")
	f.write(result['metadata']['description'])
	f.write("\"")
	f.write(",")
	f.write("\"")
	for i in range(0, len(result['metadata']['variables'])):
		f.write(result['metadata']['variables'][i]['name'])
		if(i + 1 != len(result['metadata']['variables'])):
			f.write(", ")
	f.write("\"")
	f.write(",")
	f.write("\"")
	f.write(str(result['score']))
	f.write("\"")
	f.write(",")
	f.write("\"")
	f.write(str(result['datamart_id']))
	f.write("\"")
	f.write("\n")
f.close()

# aug = 'https://dsbox02.isi.edu:9000/new/join_data'

# with open(data, 'rb') as data_p:
#     response = requests.post(
#         aug,
#         verify=False,
#         files={
#             'left_data': data_p,
#             'right_data': 126210000,
#             'left_columns': [[8]],
#             'right_columns': [[0]],
#         },
#         stream=True,
#     )
# response.raise_for_status()
# zip_ = zipfile.ZipFile(BytesIO(response.content), 'r')
# learning_data = pd.read_csv(zip_.open('tables/learningData.csv'))
# dataset_doc = json.load(zip_.open('datasetDoc.json'))
# zip_.close()

# Calls NYU's Datamart Python API to search for datasets using a passed in keyword
# query_results = datamart.search(
    # url='https://datamart.d3m.vida-nyu.org',
    # url="isi-datamart", 
    # query={'dataset': {'about': searchInput}})
    # send_data=False)
    # send_data=True)

# Writes the dataset's name, number of rows, and variables into a csv file
# f = open("./output/outputDatamart.csv", 'w') 
# for result in query_results:
# 	f.write(result.metadata['name'])
# 	f.write(",")
# 	f.write(str(result.metadata['nb_rows']))
# 	f.write(",")
# 	f.write("\"")
# 	for i in range(0, len(result.metadata['columns'])):
# 		f.write(result.metadata['columns'][i]['name'])
# 		if(i+1 != len(result.metadata['columns'])):
# 			f.write(", ")
# 	f.write("\"")
# 	f.write("\n")
# f.close()