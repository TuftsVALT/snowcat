import os, sys
import pandas as pd 

ldfpath = sys.argv[1] # path to learningData.csv
dsfpath = sys.argv[2] # path to dataSplits.csv

# here = os.path.dirname(os.path.abspath(__file__))
# ldfpath = os.path.join(here, '..','56_sunspots_dataset','tables','learningData.csv')
# dsfpath = os.path.join(here, 'dataSplits.csv')
assert os.path.exists(ldfpath)
assert os.path.exists(dsfpath)

ldf = pd.read_csv(ldfpath)

# print(ldf.head())
# print(ldf.tail())

ldf['type']=['TRAIN']*len(ldf) # by default set all to TRAIN

# only rows with year >= 1998 will be set to TEST
ldf['type'] = (ldf['year'].apply(lambda x: 'TEST' if x >= 1998 else 'TRAIN'))

print(ldf[ldf['type']=='TRAIN'].shape, ldf[ldf['type']=='TEST'].shape)
ldf = ldf.drop(columns=['year','sd','observations','sunspots'], axis=1)
ldf['fold']=[0]*len(ldf)
ldf['repeat']=[0]*len(ldf)
ldf = ldf.set_index('d3mIndex')
print(ldf.head())
print(ldf.tail())
ldf.to_csv(dsfpath)
