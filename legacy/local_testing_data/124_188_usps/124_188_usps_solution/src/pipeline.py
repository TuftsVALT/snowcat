import argparse
import glob
import os
import sys
import numpy as np
import pandas as pd
import skimage.io as skimg_io
from sklearn.metrics import accuracy_score
from d3mds import D3MDS

import tensorflow as tf
import keras
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Activation
from keras.utils import to_categorical


def load_imgs_from_files(img_files, img_dir):
    X = []
    for i, img_file in enumerate(img_files):
        if i % 1000 == 0:
            print('Loading Image %d' % i)
        img = skimg_io.imread(os.path.join(img_dir, img_file))        
        X.append(img)
    X = np.stack(X, axis=0)
    X = X[:, :, :, None]
    return X


def build_model(num_classes=10, input_size=16):
    model = Sequential()
    model.add(Conv2D(32, kernel_size=(5, 5), strides=(1, 1),
                     activation='relu',
                     input_shape=(input_size, input_size, 1)))
    model.add(MaxPooling2D(pool_size=(2, 2), strides=(2, 2)))
    model.add(Conv2D(64, (3, 3), activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Flatten())
    model.add(Dense(200, activation='relu'))
    model.add(Dense(num_classes))#, activation='softmax'))
    model.add(Activation(tf.nn.softmax))
    
    return model


def evaluate_on_test_set(model, X_test, y_test):
    preds = np.argmax(model.predict(X_test), axis=1)
    preds += 1
    acc_test = accuracy_score(y_test, preds)
    print('Test Accuracy: %.2f' % (acc_test * 100))
    return acc_test, preds


def write_predictions_csv_file(inds, preds, prediction_filename):     
    df = pd.DataFrame(preds, index=inds, columns=['label'])
    df.to_csv(prediction_filename, index_label='d3mIndex')

def write_scores_csv_file(metric_dict, score_filename):    
    metric_names = []
    metric_values = []
    for metric_name, metric_value in metric_dict.items():
        metric_names.append(metric_name)
        metric_values.append(metric_value)
    metric_names = np.array(metric_names)
    metric_values = np.array(metric_values)

    df = pd.DataFrame(np.concatenate((metric_names[:, None], metric_values[:, None]), axis=1), columns=['metric', 'value'])
    df.to_csv(score_filename)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Script to train CNN pipeline on USPS dataset.')
    parser.add_argument('--dataset_root', dest='dataset_root',
                        help='Folder containing dataset to run pipeline.')
    parser.add_argument('--model_dir', dest='model_dir', default='./models/',
                        help='Location to load and save model files.')

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)

    args = parser.parse_args()
    return args


if __name__ == "__main__":
    args = parse_args()
    dataset_root = args.dataset_root
    model_dir = args.model_dir

    print('Load DATA')    
    data_path = glob.glob(os.path.join(dataset_root, "*_dataset"))[0]
    problem_path = glob.glob(os.path.join(dataset_root, "*_problem"))[0]
    d3mds = D3MDS(data_path, problem_path)

    print('\nLoad train data')
    df_train = d3mds.get_train_data()
    media_dir = os.path.join(data_path, 'media')
    X_train = load_imgs_from_files(df_train['image'], media_dir)
    y_train = d3mds.get_train_targets()
    X_train = X_train.astype('float32') / 255.0
    print(X_train.shape, y_train.shape)

    print('Load test data')
    df_test = d3mds.get_test_data()
    X_test = load_imgs_from_files(df_test['image'], media_dir)
    y_test = d3mds.get_test_targets()
    X_test = X_test.astype('float32') / 255.0
    print(X_test.shape, y_test.shape)

    num_classes = len(np.unique(y_train))
    model = build_model(num_classes=num_classes, input_size=X_train.shape[1])
    model.summary()

    model.compile(loss=keras.losses.categorical_crossentropy,
                  optimizer=keras.optimizers.SGD(lr=0.01),
                  metrics=['accuracy'])

    y_train_temp = y_train - 1
    y_train_one_hot = to_categorical(y_train_temp, num_classes=num_classes)

    batch_size = 128
    epochs = 10

    model_file = 'model_weights.h5'
    model_full_path = os.path.join(model_dir, model_file)
    if os.path.exists(model_full_path):
        print('Loading model from %s' % model_full_path)
        model.load_weights(model_full_path)
    else:
        print('Training model')
        model.fit(X_train, y_train_one_hot,
                  batch_size=batch_size,
                  epochs=epochs,
                  verbose=1)
        model.save(model_full_path)

    print('Performance on TEST sest')
    acc_test, preds_test = evaluate_on_test_set(model, X_test, y_test)

    print('Writing predictions to .csv file.')
    cur_dir = os.getcwd()
    predictions_file = os.path.join(cur_dir, 'predictions.csv')
    write_predictions_csv_file(df_test.index, preds_test, predictions_file)

    print('Writing scores to .csv file.')
    metric_dict = {'accuracy': acc_test}
    scores_file = os.path.join(cur_dir, 'scores.csv')
    write_scores_csv_file(metric_dict, scores_file)
