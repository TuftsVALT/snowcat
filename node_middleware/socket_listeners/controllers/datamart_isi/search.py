# initialize
from datamart_isi.entries import Datamart, DatamartSearchResult
from d3m.container.dataset import Dataset, D3MDatasetLoader
from common_primitives.denormalize import Hyperparams as hyper_denormalize, DenormalizePrimitive
from d3m.base import utils as d3m_utils
import os
import sys
import pandas as pd
import shutil

searchInput = str(sys.argv[1])
augmentSelect = str(sys.argv[2])
index = int(sys.argv[3])
augmentIteration = str(sys.argv[4])
dataset_file = str(sys.argv[5])

dirname = os.path.dirname(os.path.abspath(__file__))
shared = os.path.join(dirname, '../../../../shared/')

# load the ISI datamart
isi_datamart_url = "http://dsbox02.isi.edu:9001/blazegraph/namespace/datamart3/sparql"
a = Datamart(connection_url=isi_datamart_url)

# load the D3M dataset
loader = D3MDatasetLoader()
path = dataset_file
json_file = os.path.abspath(path)
all_dataset_uri = 'file://{}'.format(json_file)
all_dataset = loader.load(dataset_uri=all_dataset_uri)

# run denormlaize primitive
denormalize_hyperparams = hyper_denormalize.defaults()
denormalize_primitive = DenormalizePrimitive(hyperparams = denormalize_hyperparams)
all_dataset = denormalize_primitive.produce(inputs = all_dataset).value
all_dataset['learningData'].head()

# run wikifier to get corresponding Q node columns
search_result_wikifier = DatamartSearchResult(search_result={}, supplied_data=None, query_json={}, search_type="wikifier")
wikifiered_result = search_result_wikifier.augment(supplied_data=all_dataset)
wikifiered_result['learningData'].head()

# search with dataset
# search_res = a.search_with_data(query=None, supplied_data=all_dataset)
search_res = a.search_with_data(query=None, supplied_data=wikifiered_result)
s1 = search_res.get_next_page()

if s1 is None:
    f = open(shared + "output/outputDatamartISI.csv", 'w+')
    f.write('No results')
    f.close()

# Writes the dataset's name, number of rows, and variables into a csv file for frontend
if s1 is not None:
	# show the search results details
	# wikidata has no dynamic score
	output_df = pd.DataFrame()
	for each in s1:
 	   col1 = each.display()
 	   output_df = output_df.append(col1)
	output_df
	f = open(shared + "output/outputDatamartISI.csv", 'w+')
	for index, row in output_df.iterrows():
		f.write("\"")
		f.write(row['title'])
		f.write("\"")
		f.write(",")
		f.write("\"")
		f.write(row['columns'])
		f.write("\"")
		f.write(",")
		f.write("\"")
		f.write(row['join columns'])
		f.write("\"")
		f.write(",")
		f.write(str(row['score']))
		f.write("\n")
	f.close()

# augmenting dataset
if augmentSelect == "true" and s1 is not None:
	aug = s1[index].augment(supplied_data=search_res.supplied_data)
	aug['learningData'].head()
	if os.path.isdir(shared + 'output/augment_data_isi/' + 'dataset' + augmentIteration):
		shutil.rmtree(shared + 'output/augment_data_isi/' + 'dataset' + augmentIteration) 
		aug.save("file://" + shared + 'output/augment_data_isi/' + 'dataset' + augmentIteration + '/' + 'datasetDoc.json')
	else:
		aug.save("file://" + shared + 'output/augment_data_isi/' + 'dataset' + augmentIteration + '/' + 'datasetDoc.json')