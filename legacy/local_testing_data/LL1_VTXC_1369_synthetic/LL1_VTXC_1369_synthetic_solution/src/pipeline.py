
# coding: utf-8

import os, sys, json
import pandas as pd
from d3mds import D3MDataset, D3MProblem, D3MDS
from time import time
from sklearn.metrics import f1_score
import scipy.sparse as sparse
import networkx as nx
from sklearn import neighbors
from collective_classification import ICA, semi_ICA

def in_jyputer_notebook():
    try:
        assert get_ipython().__class__.__name__=="ZMQInteractiveShell"
        return True
    except:
        return False

if in_jyputer_notebook(): 
    here = os.getcwd()
else:
    here = os.path.dirname(os.path.abspath(__file__))


dspath = os.path.join(here,'..','..','LL1_VTXC_1369_synthetic_dataset')
assert os.path.exists(dspath)
prpath = os.path.join(here,'..','..','LL1_VTXC_1369_synthetic_problem')
assert os.path.exists(prpath)
edgeListPath = os.path.join(dspath, 'graphs', 'edgeList.csv')
assert os.path.exists(edgeListPath)

d3mds = D3MDS(dspath, prpath)

# get the train and test data
X_train = d3mds.get_train_data()
y_train = d3mds.get_train_targets().ravel()
X_test = d3mds.get_test_data()
y_test = d3mds.get_test_targets().ravel()
print('train nodes', X_train.shape, y_train.shape)
print('test nodes', X_test.shape, y_test.shape)
edgeList = pd.read_csv(edgeListPath, index_col=0)
print('edges', edgeList.shape)

# get the metric
metric = d3mds.problem.get_performance_metrics()[0]['metric']
assert metric == 'f1Macro'
NODEID_COL = 'nodeID'

cc = ICA(nodeID = NODEID_COL)
# cc = semi_ICA(nodeID = NODEID_COL)

y_pred = cc.fit_predict(X_train, y_train, X_test, edgeList)
score = f1_score(y_test, y_pred, average='macro')
print('f1Macro score', score)

# store predictions
targetCols = [col['colName'] for col in d3mds.problem.get_targets()]
y_pred_df = pd.DataFrame(index=X_test.index, data=y_pred, columns=targetCols)
y_pred_df.to_csv(os.path.join(here, '..','predictions.csv'))

# store score
scoresdf = pd.DataFrame(columns=['metric','value','randomSeed','fold'])
scoresdf.loc[len(scoresdf)]=['f1', score, 42, 0]
scoresdf.to_csv(os.path.join(here, '..','scores.csv'), index=None)

    

