
# coding: utf-8

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import randint as sp_randint
from time import time
from sklearn.metrics import f1_score
from sklearn import preprocessing
import numpy as np
import scipy.sparse as sparse
import networkx as nx

sp_randint(1, 11)
iterate_num = 25

class ICA(object):
    def __init__(self, nodeID):
        self.nodeID = nodeID

    def encode_label(self, lm):
        return np.argmax(lm, axis=1)

    def decode_label(self, label, num_label):
        lm = np.zeros((len(label), num_label))
        for i in range(len(label)):
            lm[i, label[i]] = 1
        return lm

    def max_component(self, fea, link_data):
        # process links
        link_data = link_data - 1
        reverse_link_data = np.append(link_data[:, 1][:,np.newaxis], link_data[:, 0][:,np.newaxis], axis=1)
        link_data = np.append(link_data, reverse_link_data, axis=0)
        weight = [1]*link_data.shape[0]
        num_inst = fea.shape[0]
        link = sparse.csr_matrix((weight, link_data.transpose()), shape=(num_inst, num_inst))
        return fea, link

    def fit_predict(self, X_train, y_train, X_test, edgeList):
        X = pd.concat([X_train, X_test], axis=0)
        X = X.sort_values(by=[self.nodeID])
        X.pop(self.nodeID)
        trainInd = X_train[self.nodeID].values
        testInd = X_test[self.nodeID].values

        clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        
        fea, link = self.max_component(X.values, edgeList.values)
        clf.fit(fea[trainInd], y_train)
        y_pred = pd.DataFrame(clf.predict(fea[testInd]))
        y_pred.index = testInd
        y_train = pd.DataFrame(y_train)
        y_train.index = trainInd
        label = (pd.concat([y_train, y_pred], axis=0).sort_index()).values
        lb = preprocessing.LabelBinarizer()
        label = lb.fit_transform(label)
        num_label = label.shape[1]

        rel_fea = link*label
        new_fea = np.append(fea, rel_fea, axis=1)

        clf.fit(new_fea[trainInd], self.encode_label(label[trainInd]))
        # score = f1_score(y_test, lb.inverse_transform(self.decode_label(clf.predict(new_fea[testInd]),7)), average='macro')
        # print('raw score: ', score)
        
        for i in range(iterate_num):
            label[testInd] = self.decode_label(clf.predict(new_fea[testInd]), num_label)
            rel_fea = link*label
            new_fea = np.append(fea, rel_fea, axis=1)
        
        y_pred = lb.inverse_transform(label[testInd])
        return y_pred


class semi_ICA(ICA):
    
    def fit_predict(self, X_train, y_train, X_test, edgeList):
        X = pd.concat([X_train, X_test], axis=0)
        X = X.sort_values(by=[self.nodeID])
        X.pop(self.nodeID)
        trainInd = X_train[self.nodeID].values
        testInd = X_test[self.nodeID].values

        clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        
        fea, link = self.max_component(X.values, edgeList.values)
        clf.fit(fea[trainInd], y_train)
        y_pred = pd.DataFrame(clf.predict(fea[testInd]))
        y_pred.index = testInd
        y_train = pd.DataFrame(y_train)
        y_train.index = trainInd
        label = (pd.concat([y_train, y_pred], axis=0).sort_index()).values
        lb = preprocessing.LabelBinarizer()
        label = lb.fit_transform(label)
        num_label = label.shape[1]

        rel_fea = link*label
        new_fea = np.append(fea, rel_fea, axis=1)

        clf.fit(new_fea[trainInd], self.encode_label(label[trainInd]))
        # score = f1_score(y_test, lb.inverse_transform(self.decode_label(clf.predict(new_fea[testInd]),7)), average='macro')
        # print('raw score: ', score)
        
        for i in range(iterate_num):
            label[testInd] = self.decode_label(clf.predict(new_fea[testInd]), num_label)
            rel_fea = link*label
            new_fea = np.append(fea, rel_fea, axis=1)
            clf.fit(new_fea[trainInd], self.encode_label(label[trainInd]))
        
        y_pred = lb.inverse_transform(label[testInd])
        return y_pred



    

