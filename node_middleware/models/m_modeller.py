import sys 
import os
import json
import pandas as pd
from sklearn import preprocessing
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, accuracy_score, confusion_matrix, precision_score, recall_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.ensemble import AdaBoostRegressor
from sklearn.tree import DecisionTreeRegressor
import random


class Modeler():
    def init(self):
        self.df = None
        pass

    def read_data(self, csvpath):
        try:
            self.df = pd.read_csv(csvpath)
        except Exception as e:
            print ('error is ', e)
        # print ('df frame ', self.df.shape)
        return self.df

    def train_test_split(self,data, targetCol='Hall_of_Fame'):
        y = data[targetCol]
        X = data.drop([targetCol], axis=1)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.22, random_state=15)
        # print ('train test shape ', X_train.shape, X_test.shape)
        return X_train, X_test, y_train, y_test

    def pre_processdata(self, data, mainCol = 'Player', targetCol = 'isHof'):
        # print ('data shape before preprocess ', data.shape, data.columns.values)
        categorical = True
        try: data = data.drop([mainCol], axis=1)
        except Exception as e: pass
        data = data.apply(pd.to_numeric, errors='ignore')
        # deciding on wether to drop or fill with mean
        # data = data.fillna("0")
        data = data.fillna(method='ffill')
        # data = data.fillna(data.mean())
        # data.dropna(axis=0, inplace=True)
        colData = data.columns.values


        # if(categorical): data = self.one_hot_encode_category(data)
        # else: data = data._get_numeric_data()
        target_data = data[targetCol]
        data = data._get_numeric_data()
        data[targetCol] = target_data
        idCol = data['d3mIndex']

        data = data.drop(['d3mIndex'], axis=1)
        # print ('data shape after preprocess ', data.shape)
        # print ('data shape after preprocess ', data.head(10))
        return data, colData

    def one_hot_encode_category(self,X):
        X = pd.get_dummies(X)
        return X

    def one_hot_encode_category_old(self, X):    
        # print (' data in one hot ', X.head(10))
        cols = X.columns
        X = X.apply(pd.to_numeric, errors='ignore')
        num_cols = X._get_numeric_data().columns
        cat_cols = list(set(cols) - set(num_cols))
        if(len(cat_cols) == 0): return X
        X_cat = X[cat_cols]
        X_num = X[num_cols]

        le = preprocessing.LabelEncoder()
        X_2 = X_cat.apply(le.fit_transform)

        enc = preprocessing.OneHotEncoder()
        enc.fit(X_2)
        onehotlabels = enc.transform(X_2).toarray()
        onehotlabels_df = pd.DataFrame(onehotlabels)
        col_onehot_df = onehotlabels_df.columns
        X_num[col_onehot_df] = onehotlabels_df[col_onehot_df]
        # X_num = pd.concat([X_num, onehotlabels_df[col_onehot_df]], axis=1, sort=False)
        # X_num.dropna(axis=0,inplace=True)
        return X_num

    def build_model_classif(self,train, test, targetTrain, targetTest):
        clf = RandomForestClassifier(max_depth=20,
                                     min_samples_split=4,
                                     min_samples_leaf=5,
                                    #  bootstrap=,
                                     #  criterion=space['criterion']
                                     criterion='gini',
                                     random_state=1
                                     )
        clf.fit(train, targetTrain)

        predTrain = clf.predict(train)
        predTest = clf.predict(test)

        # feature wt compute
        feat_wts = [round(x,3) for x in clf.feature_importances_]
        feat_names = train.columns.values
        feat_dict = dict(zip(feat_names, feat_wts))
        feat_arr_wt = sorted(feat_dict.items(), key=lambda kv: kv[1], reverse =  True)#[:5]
        feat_arr_wt = [(str(x[0]), str(x[1])) for x in feat_arr_wt][0:8]
        # print('feature wts ' , feat_wts)
        # print('feature names ' , train.columns.values)
        # print ('feat wts and names , ', feat_arr_wt)

        metric = 'Acc'
        accTrain = accuracy_score(targetTrain, predTrain, normalize=True)
        accTest = accuracy_score(targetTest, predTest, normalize=True)

        return accTrain, accTest, feat_arr_wt, metric


    def build_model_regress(self,train, test, targetTrain, targetTest):
        reg = RandomForestRegressor(max_depth=50, #100 # 50 worked good too
                                     min_samples_split=3,#4,
                                     bootstrap=True,
                                     min_samples_leaf=1,#5,
                                    #  oob_score = True,
                                     ccp_alpha = 0,
                                    #  bootstrap=,
                                     criterion = 'mse', # mse
                                     max_leaf_nodes = 500,
                                     random_state=50
                                     )
        # reg = AdaBoostRegressor(base_estimator=DecisionTreeRegressor(max_depth=1), 
        #             n_estimators=100, 
        #             learning_rate=1, 
        #             loss='linear', 
        #             random_state=None)
        # reg = RandomForestRegressor(max_depth=1)
        # reg = LinearRegression(normalize= True)
        
        reg.fit(train, targetTrain)

        predTrain = reg.predict(train)
        predTest = reg.predict(test)

        # feature wt compute
        feat_wts = [round(x,3) for x in reg.feature_importances_]
        feat_names = train.columns.values
        feat_dict = dict(zip(feat_names, feat_wts))
        feat_arr_wt = sorted(feat_dict.items(), key=lambda kv: kv[1], reverse =  True)#[:5]
        feat_arr_wt = [(str(x[0]),str(x[1])) for x in feat_arr_wt][0:8]
        # print('feature wts ' , feat_wts)
        # print('feature names ' , train.columns.values)
        # print ('feat wts and names , ', feat_arr_wt)



        metric = 'R2'
        # metric = 'mse'
        if(metric == 'R2'):
            accTrain = round(r2_score(targetTrain, predTrain), 6)
            accTest = round(r2_score(targetTest, predTest),6)

        if(metric == 'mse'):
            accTrain = round(mean_squared_error(targetTrain, predTrain),6)
            accTest = round(mean_squared_error(targetTest, predTest),6)
        return accTrain, accTest, feat_arr_wt, metric


#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
STANDALONE = False
# STANDALONE = True
TASK = 'classification'
TASK = 'regression'
# DATASET = 'basketball'
# DATASET = 'college'
DATASET = 'crime_bm'
# DATASET = 'movie'
DATASET = 'autos'
DATASET = 'employment'

TASK = 'classification'
DATASET = 'acled'

inpdir = sys.argv[1]
baseMod = sys.argv[2]

currentDirectory = os.getcwd()
path = currentDirectory + '/input/dataset/'+inpdir 

if(DATASET == 'college'):
    pathbaseline = './../'+'shared/static/local_testing_data/college_model/college_model_dataset/tables/learningData.csv' 
    mainCol = 'institution'
    targetCol = 'score' # score world_rank national_rank citations
elif(DATASET == 'movie'):
    pathbaseline = './../'+'shared/static/local_testing_data/movie_model/movie_model_dataset/tables/learningData.csv' 
    mainCol = 'movie_title'
    targetCol = 'imdb_score' # 
elif (DATASET == 'basketball'):
    pathbaseline = './../'+'shared/static/local_testing_data/185_baseball/185_baseball_dataset/tables/learningData.csv'
    mainCol = 'Player'
    targetCol = 'Hall_of_Fame'
elif (DATASET == 'crime_bm'):
    pathbaseline = './../'+'shared/static/local_testing_data/crime_bm_model/crime_bm_model_dataset/tables/learningData.csv'
    mainCol = 'Address'
    targetCol = 'CrimeArea'
elif (DATASET == 'autos'):
    pathbaseline = './../'+'shared/static/local_testing_data/autos_model/autos_model_dataset/tables/learningData.csv'
    mainCol = 'car name'
    targetCol = 'price'
elif (DATASET == 'employment'):
    pathbaseline = './../'+'shared/static/local_testing_data/employmentrate_model/employmentrate_model_dataset/tables/learningData.csv'
    mainCol = 'County'
    targetCol = 'Rate'
elif (DATASET == 'radon'):
    pathbaseline = './'+'static/local_testing_data/26_radon_seed/26_radon_seed_dataset/tables/learningData.csv'
    mainCol = 'county'
    targetCol = 'log_radon'
elif (DATASET == 'terrorism'):
    pathbaseline = './'+'static/local_testing_data/DA_global_terrorism_small/DA_global_terrorism_dataset/tables/learningData.csv'
    mainCol = 'group'
    targetCol = 'activity_level'
elif (DATASET == 'malpractice'):
    pathbaseline = './'+'static/local_testing_data/DA_medical_malpractice/DA_medical_malpractice_dataset/tables/learningData.csv'
    mainCol = 'WORKSTAT'
    targetCol = 'PFIDX'
elif (DATASET == 'fifa'):
    pathbaseline = './'+'static/local_testing_data/fif2018_manofmatch/fif2018_manofmatch_dataset/tables/learningData.csv'
    mainCol = 'Team'
    targetCol = 'Man of the Match'
elif (DATASET == 'complaints'):
    pathbaseline = './'+'static/local_testing_data/DA_consumer_complaints/DA_consumer_complaints_dataset/tables/learningData.csv'
    mainCol = 'ZIP code'
    targetCol = 'relevance'
elif (DATASET == 'collegedebt'):
    pathbaseline = './'+'static/local_testing_data/DA_college_debt_small/DA_college_debt_dataset/tables/learningData.csv'
    mainCol = 'INSTNM'
    targetCol = 'DEBT_EARNINGS_RATIO'
elif (DATASET == 'acled'):
    pathbaseline = './'+'static/local_testing_data/LL0_acled_reduced_small/LL0_acled_reduced_dataset/tables/learningData.csv'
    mainCol = 'actor1'
    targetCol = 'event_type'

    
# pathbaseline = './../../'+'shared/static/local_testing_data/college_model/college_model_dataset/tables/learningData.csv' # only for testing

# only to be used when testing the py file independently of the app
if STANDALONE:
    path = './../input/dataset/ds1237/ds1237_dataset/tables/learningData.csv'
    pathbaseline = './../../'+'shared/static/local_testing_data/employmentrate_model/employmentrate_model_dataset/tables/learningData.csv'

outobj = {}
m = Modeler()
# if(int(baseMod) is 1):
if(int(baseMod) == 1):
    # CHECK BASELINE MODEL
    # print('CHECKING BASELINE MODEL +++++++++++++++++++++++++++++++++++++++++++++++++ ')
    m.read_data(pathbaseline)
    outobj['model_name'] = 'Base'
else: 
    # CHECK AUGMENTED MODEL
    # print ('CHECKING AUGMENTED MODEL +++++++++++++++++++++++++++++++++++++++++++++++++ ')
    m.read_data(path)
    outobj['model_name'] = 'Aug'





df, colData = m.pre_processdata(m.df,mainCol, targetCol)
# print("df columns are ", df.columns.values)
# print("df.head() is ", df.head())
# print("df['event_type'] is ", df['event_type'])
X_train, X_test, y_train, y_test = m.train_test_split(df, targetCol)

if(TASK == 'classification'):
    accTrain, accTest, feat_arr_wt, metric = m.build_model_classif(X_train, X_test, y_train, y_test)
    outobj['acc_train'] = str(accTrain)
    outobj['acc_test'] = str(accTest)
    outobj['col_names'] = str(','.join(colData))
    outobj['feature_wts'] = feat_arr_wt

elif (TASK == 'regression'):
    accTrain, accTest, feat_arr_wt, metric = m.build_model_regress(X_train.fillna(0), X_test.fillna(0), y_train, y_test)
    outobj['acc_train'] = str(accTrain)
    outobj['acc_test'] = str(accTest)
    outobj['col_names'] = str(','.join(colData))
    outobj['feature_wts'] = feat_arr_wt
    outobj['metric'] = metric



print(json.dumps(outobj, sort_keys=True))











