import os, sys, json
import pandas as pd
from collections import OrderedDict
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
import numpy as np

ldfpath = sys.argv[1] # path to learningData.csv
dsfpath = sys.argv[2] # path to dataSplits.csv
assert os.path.exists(ldfpath)
assert os.path.exists(dsfpath)

# here = os.path.dirname(os.path.abspath(__file__)) # _ignore
# ldfpath = os.path.join(here, '..','LL1_VTXC_1369_synthetic_dataset','tables','learningData.csv')
# dsfpath = os.path.join(here, 'dataSplits.csv')

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
TEST_SIZE = 0.9
target_col = 'label'

lddf = pd.read_csv(ldfpath, index_col='d3mIndex')
lddf['type'] = ['TRAIN']*len(lddf)

X = lddf.copy()
y = pd.DataFrame(lddf.pop(target_col))

sss = StratifiedShuffleSplit(n_splits=1, test_size=TEST_SIZE, random_state=RANDOM_SEED)
for train_index, test_index in sss.split(X, y):
    for i in test_index:
        lddf.iloc[i, lddf.columns.get_loc('type')] = 'TEST'

for col in lddf.columns:
    if col != 'type':
        lddf.pop(col)

lddf['repeat']=[0]*(len(lddf))
lddf['fold']=[0]*(len(lddf))

print(lddf.head())
print(lddf.tail())

lddf.to_csv(dsfpath)
