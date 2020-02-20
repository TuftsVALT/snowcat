from d3m import container
import datamart
import datamart_rest
import csv
import sys
import os
import json
import shutil

searchInput = str(sys.argv[1])
augmentSelect = str(sys.argv[2])
index = int(sys.argv[3])
augmentIteration = str(sys.argv[4])
dataset_file = str(sys.argv[5])
datamart_url = str(sys.argv[6])
output_dir = str(sys.argv[7])

# file directory
dataset = container.Dataset.load('file://' + dataset_file)
dataset['learningData'].head()
client = datamart_rest.RESTDatamart(datamart_url)

# searching for datasets with supplied dataset and keyword

query = datamart.DatamartQuery(
    keywords=[searchInput],  # keywords from problem definition
    variables=[]
)
cursor = client.search_with_data(query=query, supplied_data=dataset)

results = cursor.get_next_page()

if results is None:
    f = open(output_dir + "/outputDatamart.csv", 'w+')
    f.write('No results')
    f.close()

# Writes the dataset's name, number of rows, and variables into a csv file for frontend
if results is not None:
    f = open(output_dir + "/outputDatamart.csv", 'w+')
    for result in results:
    	f.write("\"")
    	f.write(result.get_json_metadata()['metadata']['name'])
    	f.write("\"")
    	f.write(",")
    	f.write(str(result.score()))
    	f.write(",")
    	f.write("\"")
    	f.write(str(result.get_json_metadata()['augmentation']['left_columns_names']))
    	f.write("\"")
    	f.write(",")
    	f.write("\"")
    	f.write(str(result.get_json_metadata()['augmentation']['right_columns_names']))
    	f.write("\"")
    	f.write("\n")
    f.close()

# augmenting dataset
if augmentSelect == "true" and results is not None:
    join_ = results[index].augment(supplied_data=dataset)
    join_['learningData'].head()
    if os.path.isdir(output_dir + '/augment_data/' + 'augment' + augmentIteration):
        shutil.rmtree(output_dir + '/augment_data/' + 'augment' + augmentIteration)
        join_.save("file://" + output_dir + '/augment_data/' + 'augment' + augmentIteration + '/' + 'augment' + augmentIteration + '_dataset' + '/' + 'datasetDoc.json')
    else:
        join_.save("file://" + output_dir + '/augment_data/' + 'augment' + augmentIteration + '/' + 'augment' + augmentIteration + '_dataset' + '/' + 'datasetDoc.json')

