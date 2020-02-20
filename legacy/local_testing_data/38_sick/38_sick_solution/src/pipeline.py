
# coding: utf-8

# In[1]:


import os, sys, json
import pandas as pd
from d3mds import D3MDataset, D3MProblem, D3MDS
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint as sp_randint
from time import time
from feature_extraction import *
from feature_selection import *
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, f1_score
import warnings, string
from sklearn import preprocessing


# In[2]:


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


# In[3]:


dspath = os.path.join(here,'..','..','38_sick_dataset')
assert os.path.exists(dspath)
prpath = os.path.join(here,'..','..','38_sick_problem')
assert os.path.exists(prpath)

d3mds = D3MDS(dspath, prpath)

# get the train and test data
X_train = d3mds.get_train_data()
y_train = d3mds.get_train_targets()
X_test = d3mds.get_test_data()
y_test = d3mds.get_test_targets()
print(X_train.shape, y_train.shape)
print(X_test.shape, y_test.shape)

# get the metric
metrics = d3mds.problem.get_performance_metrics()


# In[4]:


sp_randint(1, 11)


# In[9]:


# define a custom pipeline
def make_pipeline(X_train, y_train, X_test, y_test):
    
    # get columns information
    cols_info = d3mds.dataset.get_learning_data_columns()
    
    # read the Slacker JSON file
    pipe_json = os.path.join(here, 'pipeline.json')
    assert os.path.exists(pipe_json)
    with open(pipe_json) as data_file:    
        ps = json.load(data_file)

    ## instantiate feature extractor
    key, fe = ps['feature_extractors'].popitem()
    fe_class = fe['feature_extractor']
    fe_params = fe['params']
    feature_extractor = eval(fe_class)(**fe_params)
    if isinstance(feature_extractor, AnnotatedTabularExtractor):
        feature_extractor.set_cols_info(cols_info)

    ## instantiate feature selector
    fs = ps['feature_selector']
    fs_class = fs['feature_selector']
    fs_params = fs['params']
    feature_selector = eval(fs_class)(**fs_params)
    
    ## binarize labels
    lb = preprocessing.LabelBinarizer()
    lb.fit(y_train)
    y_train = lb.transform(y_train).ravel()
    y_test = lb.transform(y_test).ravel()
    
    clf = RandomForestClassifier(random_state=42)
    param_grid = {"n_estimators":sp_randint(10, 200),
                  "max_depth": [3,5,10,20,None],
                  "max_features": sp_randint(1, 20),
                  "min_samples_split": sp_randint(2, 20),
                  "bootstrap": [True, False],
                  "criterion": ["gini", "entropy"]}   
    n_iter_search = 20
    random_search  = RandomizedSearchCV(clf, 
                                        param_distributions=param_grid, 
                                        n_iter=n_iter_search,
                                        cv=5,
                                        scoring='roc_auc',
                                        random_state=42,
                                        verbose=0)
    pipeline = Pipeline([
        ('vect', feature_extractor),
        ('sel', feature_selector),
        ('clf', random_search),
    ])
    
    # fit the pipeline
    start = time()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        pipeline.fit(X_train, y_train)
    print("RandomizedSearchCV took %.2f seconds for %d candidates parameter settings." % ((time() - start), n_iter_search))
    print("train score", random_search.best_score_ )
    
    # store the estimator model
    best_estimator=(pipeline.steps[2][1].best_estimator_)
    remove_white_space = lambda x: ''.join([i for i in x if i not in (string.whitespace)])
    be_str = remove_white_space(best_estimator.__repr__())
    with open (os.path.join(here, "best_estimator.json"), "w") as f:
        json.dump({"best_estimator":be_str}, f)
    return pipeline, lb

pipeline, lb = make_pipeline(X_train, y_train, X_test, y_test)
    
## make prediction
y_pred = pipeline.predict(X_test)

## store predictions
targetCols = [col['colName'] for col in d3mds.problem.get_targets()]
y_pred_df = pd.DataFrame(index=X_test.index, data=lb.inverse_transform(y_pred), columns=targetCols)
y_pred_df.to_csv(os.path.join('.','predictions.csv'))

## compute performance on test data
metrics = d3mds.problem.get_performance_metrics()
scoresdf = pd.DataFrame(columns=['metric','value','randomSeed','fold'])
for item in metrics:
    metric = item['metric']
    print(metric)
    if metric=='rocAuc':
        score = roc_auc_score(y_test, y_pred)
        scoresdf.loc[len(scoresdf)]=['rocAuc', score, 42, 0]
    elif metric == 'f1':
        score = f1_score(y_test, lb.inverse_transform(y_pred), pos_label='sick')
        scoresdf.loc[len(scoresdf)]=['f1', score, 42, 0]

print('test score', score)
scoresdf.to_csv(os.path.join('.','scores.csv'), index=None)

