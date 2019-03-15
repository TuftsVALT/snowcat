import os, sys, json
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import f1_score, mean_squared_error
import numpy as np
from sklearn.base import TransformerMixin
from scipy import signal
from sklearn.cluster import MiniBatchKMeans
from sklearn.feature_extraction.text import TfidfVectorizer, HashingVectorizer
from sklearn.model_selection import StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, f1_score
from sklearn.externals import joblib
from sklearn.neighbors import NearestNeighbors, KNeighborsClassifier

here = os.path.dirname(os.path.abspath(__file__))

from d3mds import D3MDataset, D3MProblem, D3MDS

def simple_tokenizer(x):
		return [str(c) for c in x]

class BagOfSpectra(TransformerMixin):

	def __init__(self, num_clusters=100, window_size=256):
		self.num_clusters = num_clusters
		self.window_size = window_size

	def fit(self, X, y=None):
		self.fit_transform(X, y)
		return self

	def fit_transform(self, X, y=None):
		spectrograms = [signal.spectrogram(x, nperseg=self.window_size)[-1].T for x in X]
		self.kmeans = MiniBatchKMeans(self.num_clusters).fit(np.concatenate(spectrograms, axis=0))
		clusters = [self.kmeans.predict(s) for s in spectrograms]
		# self.tfidf = TfidfVectorizer(lowercase=False, tokenizer=simple_tokenizer)
		self.tfidf = HashingVectorizer(lowercase=False, decode_error='ignore', n_features=500, alternate_sign=False, tokenizer=simple_tokenizer)
		return self.tfidf.fit_transform(clusters)
   
	def transform(self, X):
		spectrograms = [signal.spectrogram(x, nperseg=self.window_size)[-1].T for x in X]
		return self.tfidf.transform([self.kmeans.predict(s) for s in spectrograms])

def train_model_bos(X_train, y_train):
	if not os.path.exists('modelSearchResults.csv'):
	# we have to search for parameters of the model
		results = []
		best_accuracy = 0.0
		for k in [250, 500, 1000, 1500, 2000]:
		# for k in [500]:
			for ws in [2**k for k in range(5, 9)]:
				print(k, ws)
				bos = BagOfSpectra(k, ws)
				try:
					X_train_bos = bos.fit_transform(X_train)
				except:
					continue
				for c in [10**k for k in range(-2, 5)]:
					y_out = []
					y_actual = []
					for train_index, test_index in StratifiedKFold(10).split(X_train, y_train):
						X_train_train, X_train_test = X_train_bos[train_index, :], X_train_bos[test_index, :]
						y_train_train, y_train_test = y_train[train_index], y_train[test_index]
						lr = LogisticRegression(C=c).fit(X_train_train, y_train_train)
						y_tilde = lr.predict(X_train_test)
						y_out += list(y_tilde)
						y_actual += list(y_train_test)
					accuracy = accuracy_score(y_actual, y_out)
					precision, recall, fscore, _ = precision_recall_fscore_support(y_actual, y_out, average='macro')
					results.append({
						'k': k,
						'ws': ws,
						'c': c,
						'accuracy': accuracy,
						'precision': precision,
						'recall': recall,
						'fscore': fscore
					})
					if accuracy > best_accuracy:
						# pickle and save the TFIDF of this point in search. This will be required to -
						# - load the trained model
						joblib.dump(bos.tfidf, 'vectroizer.pkl')
						joblib.dump(bos.kmeans, 'kmeans.pkl')
						print('------------ %s'%accuracy)
						print(k, ws, c)
						best_accuracy = accuracy
					
		# save the search results for model parameters
		results_df = pd.DataFrame(results)
		results_df = results_df.sort_values(by='accuracy', ascending=False).head(20)
		results_df.to_csv('modelSearchResults.csv')
	else:
		# the parameters have already been searched for and the results are stored in results_df
		# just read it
		results_df = pd.read_csv('modelSearchResults.csv', index_col=0)

	# choose the best parameters from the search
	best_row = results_df.loc[results_df['accuracy'].idxmax()]
	k, ws, c = best_row[['k', 'ws', 'c']]
	# build a model
	bos = BagOfSpectra(int(k), int(ws))
	X_train_bos = bos.fit_transform(X_train)
	lr = LogisticRegression(C=c).fit(X_train_bos, y_train)
	# persist the trained model
	joblib.dump(lr, 'trainedModel.pkl')

def test_model_bos(X_test, y_test):
		# load the tfidf and kmeans
		tfidf = joblib.load('vectroizer.pkl')
		kmeans = joblib.load('kmeans.pkl')

		# load the BOS transformation
		results_df = pd.read_csv('modelSearchResults.csv', index_col=0)
		best_row = results_df.loc[results_df['accuracy'].idxmax()]
		k, ws, c = best_row[['k', 'ws', 'c']]
		print(k, ws, c)
		bos = BagOfSpectra(int(k), int(ws))
		bos.tfidf = tfidf
		bos.kmeans = kmeans

		X_test_bos = bos.transform(X_test)
		print(X_test_bos.shape)

		# load the trained model
		trainedmodel = joblib.load('trainedModel.pkl')

		# make predictions on test data
		y_pred = trainedmodel.predict(X_test_bos)
		accuracy = accuracy_score(y_test, y_pred)
		f1 = f1_score(y_test, y_pred, average='macro')
		print(accuracy)
		print(f1)

def train_model_knn(X_train, y_train):
	model = KNeighborsClassifier(metric='euclidean',n_neighbors=1)
	model.fit(X_train, y_train)
	joblib.dump(model, 'trainedModel.pkl')

def test_model_knn(X_test):
	trainedmodel = joblib.load('trainedModel.pkl')
	y_pred = trainedmodel.predict(X_test)
	return y_pred


def process_train_view(dspath, prpath):
	# initialize the API class
	d3mds = D3MDS(dspath, prpath) # this checks that the problem and dataset correspond
	# get the train data
	trainDataDF = d3mds.get_train_data()
	print(trainDataDF.shape)

	X_train = np.array([
		pd.read_csv(d3mds.dataset.open_raw_timeseries_file(_file), index_col=0).as_matrix().ravel()
		for _file in trainDataDF['timeseries_file']
	], dtype=float)

	print(X_train.shape)

	# get the train targets
	y_train = d3mds.get_train_targets()
	print(y_train.shape)

	# train_model(X_train, y_train)
	train_model_knn(X_train, y_train)

def process_test_view(dspath, prpath):
	# initialize the API class
	d3mds = D3MDS(dspath, prpath) # this checks that the problem and dataset correspond
	# make sure the trained model exists
	assert os.path.exists('trainedModel.pkl')

	# get the test data
	testDataDF = d3mds.get_test_data()
	print(testDataDF.shape)

	X_test = np.array([
		pd.read_csv(d3mds.dataset.open_raw_timeseries_file(_file), index_col=0).as_matrix().ravel()
		for _file in testDataDF['timeseries_file']
	], dtype=float)

	print(X_test.shape)

	y_pred = test_model_knn(X_test)
	y_pred_df = pd.DataFrame(index=testDataDF.index, data=y_pred)
	
	y_pred_df.to_csv(os.path.join(here, '..', 'mitll_predictions.csv'))
	return y_pred

def compute_performance(dspath, prpath, y_pred):
	d3mds = D3MDS(dspath, prpath)
	y_test = d3mds.get_test_targets()
	accuracy = accuracy_score(y_test, y_pred)
	f1 = f1_score(y_test, y_pred, average='macro')
	print('accuracy:', accuracy)
	print('f1:', f1)
	return f1, accuracy



if __name__ == '__main__':
	
	# get the paths of the dataset and problem
	try:
		dspath = sys.argv[1]
	except:
		dspath = input('Enter the path to the dataset: ')
		assert os.path.exists(dspath)

	try:
		prpath = sys.argv[2]
	except:
		prpath = input('Enter the path to the problem: ')
		assert os.path.exists(prpath)

	try:
		VIEW = sys.argv[3]
	except:
		VIEW = input('Enter the view (TRAIN/TEST/FULL): ').upper()

	assert os.path.exists(dspath)
	assert os.path.exists(prpath)

	if VIEW == 'TRAIN':
		process_train_view(dspath, prpath)
	elif VIEW == 'TEST':
		process_test_view(dspath, prpath)

	elif VIEW == 'FULL':
		process_train_view(dspath, prpath)
		y_pred = process_test_view(dspath, prpath)
		accuracy, f1 = compute_performance(dspath, prpath, y_pred)
		df = pd.DataFrame(columns=['metric', 'value'])
		df.loc[len(df)] = ['accuracy', accuracy]
		df.loc[len(df)] = ['f1', f1]
		df.to_csv('scores.csv')
