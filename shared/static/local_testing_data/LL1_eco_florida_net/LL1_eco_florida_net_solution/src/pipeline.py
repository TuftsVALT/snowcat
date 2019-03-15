import os, sys, json, random
import pandas as pd
import numpy as np
import networkx as nx
from louvain import Louvain
from collections import OrderedDict
from sklearn.metrics.cluster import normalized_mutual_info_score

here = os.path.dirname(os.path.abspath(__file__))

from d3mds import D3MDataset, D3MProblem, D3MDS

dspath = os.path.join(here, '..', '..', 'LL1_eco_florida_net_dataset')
prpath = os.path.join(here, '..', '..', 'LL1_eco_florida_net_problem')
assert os.path.exists(dspath)
assert os.path.exists(prpath)

d3mds = D3MDS(dspath, prpath) # this checks that the problem and dataset correspond

def read_graph():
	graphPath = os.path.join(d3mds.dataset.dsHome, 'graphs', 'graph.gml')
	os.path.exists(graphPath)
	G = nx.read_gml(graphPath)
	return G

def getSeedNodes(dspath, prpath):
	# get the train data
	trainDataDF = d3mds.get_train_data()
	trainTargetsDF = d3mds.get_train_targets()
	seedNodes = trainDataDF.copy()
	seedNodes['community'] = trainTargetsDF
	return seedNodes

def convert_gml_to_pajek():
	print('converting graph from GML to Pajek .NET format ....')
	G = read_graph()
	print('num nodes:', len(G.nodes()))
	print('num edges:', len(G.edges()))
	nx.write_pajek(G, os.path.join(here, 'G.net'))

def do_pajek_community_detection_steps():
	# run Pajek community detection
	# 1. load network
	# 2. Network -> Create Partition -> Communities -> Louvain Method -> Multi-level Coarsening + Single Refinement
	# 3. ( next settings = 2.7, 1, 20,50)
	# 4. OK
	# 5. Save partitions to partitions.clu
	return

def make_intermediate_results():
	print('making intermediate results ....')
	# if G is not loaded, load graph
	G = read_graph()
	columns = OrderedDict()

	nodes = G.nodes()
	print(len(nodes))
	
	idxs = list(range(1, len(G.nodes())+1))
	print(len(idxs))

	lines = open(os.path.join(here, 'partitions.clu')).read().splitlines()[1:]
	clusters = list(map(int, lines))
	print(len(clusters))

	columns['index'] = idxs
	columns['node'] = nodes
	columns['community'] = clusters

	df = pd.DataFrame(columns)
	df.to_csv(os.path.join(here, 'intermediate_result.csv'))
	return df

def make_predictions_file(df):
	print('making predictions file ...')
	targetNodes = d3mds.get_test_data()
	
	def get_community(targetNode, df):
		try:
			community = (df.loc[df['node']==targetNode].community.values[0])
		except:
			community = 1
		return community

	targetNodes['community'] = targetNodes['nodeID'].apply(get_community, df=df)

	target_cols = [col['colName'] for col in d3mds.problem.get_targets()]
	for col in targetNodes.columns:
		if col not in target_cols:
			targetNodes.pop(col)

	print('saving the predictions ....')
	targetNodes.to_csv(os.path.join(here, '..', 'predictions.csv'))
	return targetNodes

def make_scores_file(predicitons):
	if d3mds.get_test_targets().any():
		print('making scores file .....')
		y_truth = (d3mds.get_test_targets().ravel())
		y_pred = predictions['community'].values
		nmi = normalized_mutual_info_score(y_truth, y_pred)
		print('nmi', nmi)
		df = pd.DataFrame(columns=['metric', 'value'])
		df.loc[len(df)] = ['normalizedMutualInformation', nmi]
		df.to_csv(os.path.join(here, '..', 'scores.csv'))

if __name__ == '__main__':

	# convert the graph to Pajek network, if not already done
	if not os.path.exists(os.path.join(here, 'G.net')):
		convert_gml_to_pajek()
	
	# perform community detection using Pajek
	do_pajek_community_detection_steps()
	try:
		assert os.path.exists(os.path.join(here, 'partitions.clu'))
	except:
		raise RuntimeError('Look like you have not run Pajek yet. Please do so first !!!!')

	# make intermediate_results
	if not os.path.exists(os.path.join(here, 'intermediate_result.csv')):
		df = make_intermediate_results()
	else:
		df = pd.read_csv(os.path.join(here, 'intermediate_result.csv'), index_col=0)
	
	# make predicitons.csv file
	if not os.path.exists(os.path.join(here, '..', 'predictions.csv')):
		predictions = make_predictions_file(df)
	else:
		predictions = pd.read_csv(os.path.join(here, '..', 'predictions.csv'))

	# make scores.csv file
	if not os.path.exists(os.path.join(here, '..', 'scores.csv')):
		predictions = make_scores_file(predictions)

	print('predictions completed and scores computed ...')
